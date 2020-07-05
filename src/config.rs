use serde::{Deserialize, Serialize};
use state::LocalStorage;
use std::fs::File;
use std::io::prelude::*;
use std::path::{Path, PathBuf};

use crate::custom_error::{Error, Fallible};

#[derive(Debug)]
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

static CONFIG: LocalStorage<Config> = LocalStorage::new();

#[derive(Debug, Serialize, Deserialize)]
pub struct RawConfig {
    pub server: RawServerConfig,
    pub database: RawDatabaseConfig,
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
pub struct RawDatabaseConfig {
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawUserConfig {
    pub invitation_credit: i32,
    pub email_whitelist: Vec<String>,
}

#[derive(Debug)]
pub struct Config {
    pub mode: Mode,
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub user: UserConfig,
}

#[derive(Debug)]
pub struct ServerConfig {
    pub address: String,
    pub port: u64,
    pub mailgun_api_key: String,
    pub base_url: String,
    pub mail_domain: String,
    pub mail_from: String,
}

#[derive(Debug)]
pub struct DatabaseConfig {
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
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

impl From<RawDatabaseConfig> for Fallible<DatabaseConfig> {
    fn from(orig: RawDatabaseConfig) -> Fallible<DatabaseConfig> {
        Ok(DatabaseConfig { url: orig.url })
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

fn load_content_with_prior<P: AsRef<Path>>(paths: &Vec<P>) -> Fallible<String> {
    if paths.len() == 0 {
        return Err(Error::new_op("未指定設定檔"));
    }
    for p in paths.iter() {
        if let Ok(content) = load_file_content(p) {
            return Ok(content);
        }
    }
    let paths: Vec<PathBuf> = paths.into_iter().map(|p| p.as_ref().to_owned()).collect();
    return Err(Error::new_op(format!("找不到任何設定檔: {:?}", paths)));
}

/// 載入設定檔，回傳一個設定檔物件
/// * `paths` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
pub fn load_config<P: AsRef<Path>>(path: &Option<P>) -> Fallible<Config> {
    // 載入設定檔
    let mode = get_mode();
    let content = if let Some(path) = path {
        load_content_with_prior(&vec![path])?
    } else {
        let local_file = match get_mode() {
            Mode::Release => "config/carbonbond.release.toml",
            Mode::Dev => "config/carbonbond.dev.toml",
            Mode::Test => "config/carbonbond.test.toml",
        };
        load_content_with_prior(&vec![
            PathBuf::from(local_file),
            PathBuf::from("config/carbonbond.toml"),
        ])?
    };

    let raw_config: RawConfig = toml::from_str(&content)?;
    let config = Config {
        mode,
        server: Fallible::<ServerConfig>::from(raw_config.server)?,
        database: Fallible::<DatabaseConfig>::from(raw_config.database)?,
        user: Fallible::<UserConfig>::from(raw_config.user)?,
    };

    Ok(config)
}

/// 載入設定檔，將設定檔物件儲存於全域狀態
/// * `paths` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
pub fn initialize_config<P: 'static + AsRef<Path>>(path: &Option<P>) {
    let path_owned: Option<PathBuf> = path.as_ref().map(|p| p.as_ref().to_owned());
    assert!(
        CONFIG.set(move || load_config(&path_owned).unwrap()),
        "initialize_config() is called twice",
    );
}

pub fn get_config() -> &'static Config {
    CONFIG.get()
}
