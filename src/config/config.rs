use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::prelude::*;
use std::path::{Path, PathBuf};

use crate::custom_error::{Error, Fallible};

#[derive(Debug, Clone, Copy)]
pub enum Mode {
    Release,
    Dev,
    Test,
}

pub fn get_mode() -> Mode {
    match std::env::var("MODE").as_ref().map(|s| &**s) {
        Ok("release") => Mode::Release,
        Ok("dev") => Mode::Dev,
        Ok("test") => Mode::Test,
        _ => Mode::Dev,
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawConfig {
    pub server: RawServerConfig,
    pub database: DatabaseConfig,
    pub user: RawUserConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawServerConfig {
    pub address: String,
    pub port: u64,
    pub mailgun_key_file: PathBuf,
    pub base_url: String,
    pub mail_domain: String,
    pub mail_from: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawUserConfig {
    pub invitation_credit: i32,
    pub email_whitelist: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub file_name: String,
    pub mode: Mode,
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub user: UserConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub dbname: String,
    pub username: String,
    pub password: String,
    pub port: u32,
    pub host: String,
    pub data_path: String,
    pub max_conn: u32,
}
impl DatabaseConfig {
    pub fn get_url(&self) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}",
            self.username, self.password, self.host, self.port, self.dbname
        )
    }
}
#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub address: String,
    pub port: u64,
    pub mailgun_api_key: String,
    pub base_url: String,
    pub mail_domain: String,
    pub mail_from: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserConfig {
    pub invitation_credit: i32,
    pub email_whitelist: Vec<String>,
}

impl From<RawServerConfig> for Fallible<ServerConfig> {
    fn from(orig: RawServerConfig) -> Fallible<ServerConfig> {
        let mut mailgun_api_key = load_file_content(&orig.mailgun_key_file)
            .map_err(|e| e.add_msg(format!("讀取設定檔 {:?} 時失敗", orig.mailgun_key_file)))?;
        mailgun_api_key = mailgun_api_key.trim().to_owned();
        Ok(ServerConfig {
            address: orig.address,
            port: orig.port,
            mailgun_api_key,
            base_url: orig.base_url,
            mail_domain: orig.mail_domain,
            mail_from: orig.mail_from,
        })
    }
}

impl From<RawUserConfig> for Fallible<UserConfig> {
    fn from(orig: RawUserConfig) -> Fallible<UserConfig> {
        Ok(UserConfig {
            invitation_credit: orig.invitation_credit,
            email_whitelist: orig.email_whitelist,
        })
    }
}

fn load_file_content<P: AsRef<Path>>(path: P) -> Fallible<String> {
    let mut file = File::open(path.as_ref())?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

fn load_content_with_prior(paths: &[&str]) -> Fallible<(String, String)> {
    if paths.len() == 0 {
        return Err(Error::new_op("未指定設定檔"));
    }
    for p in paths.iter() {
        if let Ok(content) = load_file_content(p) {
            return Ok((p.to_string(), content));
        }
    }
    return Err(Error::new_op(format!("找不到任何設定檔: {:?}", paths)));
}

/// 載入設定檔，回傳一個設定檔物件
/// * `path` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
pub fn load_config(path: &Option<String>) -> Fallible<Config> {
    // 載入設定檔
    let mode = get_mode();
    let (file_name, content) = if let Some(path) = path {
        load_content_with_prior(&[&*path])?
    } else {
        let local_file = match get_mode() {
            Mode::Release => "config/carbonbond.release.toml",
            Mode::Dev => "config/carbonbond.dev.toml",
            Mode::Test => "config/carbonbond.test.toml",
        };
        load_content_with_prior(&[local_file, "config/carbonbond.toml"])?
    };

    let raw_config: RawConfig = toml::from_str(&content)?;
    let config = Config {
        mode,
        file_name,
        server: Fallible::<ServerConfig>::from(raw_config.server)?,
        database: raw_config.database,
        user: Fallible::<UserConfig>::from(raw_config.user)?,
    };

    Ok(config)
}
