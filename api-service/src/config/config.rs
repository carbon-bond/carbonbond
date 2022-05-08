use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::prelude::*;
use std::path::{Path, PathBuf};

use crate::custom_error::{Contextable, Error, Fallible};

#[derive(Debug, Clone, Copy)]
pub enum Mode {
    Release,
    Dev,
    Test,
}

pub fn get_mode() -> Mode {
    if cfg!(test) {
        Mode::Test
    } else {
        match std::env::var("MODE").as_ref().map(|s| &**s) {
            Ok("release") => Mode::Release,
            Ok("dev") => Mode::Dev,
            Ok("test") => Mode::Test,
            _ => Mode::Dev,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawConfig {
    pub server: RawServerConfig,
    pub account: RawAccountConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
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
pub struct RawAccountConfig {
    pub fake_email: Option<String>,
    pub allow_self_signup: bool,
    pub allow_invitation_signup: bool,
    pub session_expire_seconds: usize,
    pub min_password_length: usize,
    pub max_password_length: usize,
    pub email_whitelist: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub file_name: PathBuf,
    pub mode: Mode,
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub account: AccountConfig,
    pub redis: RedisConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub dbname: String,
    pub username: String,
    pub password: String,
    pub port: u16,
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
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RedisConfig {
    pub host: String,
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
pub struct AccountConfig {
    pub fake_email: Option<String>,
    pub allow_self_signup: bool,
    pub allow_invitation_signup: bool,
    pub session_expire_seconds: usize,
    pub min_password_length: usize,
    pub max_password_length: usize,
    pub email_whitelist: Vec<String>,
}

impl From<RawServerConfig> for Fallible<ServerConfig> {
    fn from(orig: RawServerConfig) -> Fallible<ServerConfig> {
        let mut mailgun_api_key = load_file_content(&orig.mailgun_key_file)
            .context(format!("讀取設定檔 {:?} 時失敗", orig.mailgun_key_file))?;
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

impl From<RawAccountConfig> for Fallible<AccountConfig> {
    fn from(orig: RawAccountConfig) -> Fallible<AccountConfig> {
        Ok(AccountConfig {
            fake_email: orig.fake_email,
            allow_self_signup: orig.allow_self_signup,
            allow_invitation_signup: orig.allow_invitation_signup,
            session_expire_seconds: orig.session_expire_seconds,
            min_password_length: orig.min_password_length,
            max_password_length: orig.max_password_length,
            // 目前無作用
            email_whitelist: orig.email_whitelist,
        })
    }
}

fn load_file_content<P: AsRef<Path>>(path: P) -> Fallible<String> {
    let mut path: PathBuf = path.as_ref().to_owned();
    if !path.is_absolute() {
        path = project_path()?.join(path);
    }
    log::debug!("嘗試載入 {:?} 設定檔", path);
    let mut file = File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

/// 載入一至多個設定檔
/// * `path` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
fn load_content_with_priority(paths: &[&str]) -> Fallible<(PathBuf, String)> {
    if paths.len() == 0 {
        return Err(Error::new_op("未指定設定檔"));
    }
    for p in paths.iter() {
        if let Ok(content) = load_file_content(&p) {
            return Ok((p.into(), content));
        }
    }
    return Err(Error::new_op(format!("找不到任何設定檔: {:?}", paths)));
}

pub fn project_path() -> Fallible<PathBuf> {
    let exe = std::env::current_exe()?;
    let mut p = &*exe;
    let mut n = 0;
    loop {
        p = p.parent().ok_or(Error::new_op("抓不到上層目錄= ="))?;
        let children = fs::read_dir(p)?;
        for child in children {
            let path = child.unwrap().path();
            if path.is_dir() && path.ends_with("config") {
                log::debug!("根目錄 {:?}", path);
                return Ok(p.to_owned());
            }
        }
        n += 1;
        if n > 10 {
            return Err(Error::new_op("太多層了吧…"));
        }
    }
}
/// 載入設定檔，回傳一個設定檔物件
pub fn load_config(path: &Option<String>) -> Fallible<Config> {
    // 載入設定檔
    let mode = get_mode();
    let (file_name, content) = if let Some(path) = path {
        load_content_with_priority(&[&*path])?
    } else {
        let local_file = match get_mode() {
            Mode::Release => "config/carbonbond.release.toml",
            Mode::Dev => "config/carbonbond.dev.toml",
            Mode::Test => "config/carbonbond.test.toml",
        };
        load_content_with_priority(&[local_file, "config/carbonbond.toml"])?
    };

    let raw_config: RawConfig = toml::from_str(&content)?;
    let config = Config {
        mode,
        file_name,
        server: Fallible::<ServerConfig>::from(raw_config.server)?,
        account: Fallible::<AccountConfig>::from(raw_config.account)?,
        database: raw_config.database,
        redis: raw_config.redis,
    };

    Ok(config)
}
