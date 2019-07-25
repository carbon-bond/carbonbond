use std::io::prelude::*;
use std::path::{Path, PathBuf};
use std::fs::File;
use serde::{Serialize, Deserialize};
use failure::Fallible;
use state::LocalStorage;

pub static CONFIG: LocalStorage<Config> = LocalStorage::new();

#[derive(Debug, Serialize, Deserialize)]
pub struct RawConfig {
    pub server: RawServerConfig,
    pub database: RawDatabaseConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawServerConfig {
    pub address: String,
    pub port: u64,
    pub mailgun_key_file: PathBuf,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawDatabaseConfig {
    pub url: String,
}

#[derive(Debug)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
}

#[derive(Debug)]
pub struct ServerConfig {
    pub address: String,
    pub port: u64,
    pub mailgun_api_key: String,
}

#[derive(Debug)]
pub struct DatabaseConfig {
    pub url: String,
}

impl From<RawConfig> for Fallible<Config> {
    fn from(orig: RawConfig) -> Fallible<Config> {
        Ok(Config {
            server: Fallible::<ServerConfig>::from(orig.server)?,
            database: Fallible::<DatabaseConfig>::from(orig.database)?,
        })
    }
}

impl From<RawServerConfig> for Fallible<ServerConfig> {
    fn from(orig: RawServerConfig) -> Fallible<ServerConfig> {
        let mailgun_api_key = load_file_content(&orig.mailgun_key_file)?;
        Ok(ServerConfig {
            address: orig.address,
            port: orig.port,
            mailgun_api_key,
        })
    }
}

impl From<RawDatabaseConfig> for Fallible<DatabaseConfig> {
    fn from(orig: RawDatabaseConfig) -> Fallible<DatabaseConfig> {
        Ok(DatabaseConfig { url: orig.url })
    }
}

fn load_file_content<P: AsRef<Path>>(path: P) -> Fallible<String> {
    let path = path.as_ref();
    fn inner(path: &Path) -> Fallible<String> {
        let mut file = File::open(path)?;
        let mut content = String::new();
        file.read_to_string(&mut content)?;
        Ok(content)
    }
    inner(path).map_err(|err| format_err!("讀取設定檔 {:?} 時發生錯誤，原始錯誤為 {}", path, err))
}

fn load_content_with_prior<P: AsRef<Path>>(paths: &Vec<P>) -> Fallible<String> {
    if paths.len() == 0 {
        return Err(failure::format_err!("未指定設定檔"));
    }
    for p in paths.iter() {
        if let Ok(content) = load_file_content(p) {
            return Ok(content);
        }
    }
    Err(failure::format_err!("設定檔讀取失敗"))
}

/// 載入設定檔，回傳一個設定檔物件
/// * `paths` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
pub fn load_config<P: AsRef<Path>>(paths: &Vec<P>) -> Fallible<Config> {
    // 載入設定檔
    let content = load_content_with_prior(paths)?;
    let raw_config: RawConfig = toml::from_str(&content)?;
    let config = Fallible::<Config>::from(raw_config)?;

    Ok(config)
}

/// 載入設定檔，將設定檔物件儲存於全域狀態
/// * `paths` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
pub fn initialize_config<P: 'static + AsRef<Path>>(paths: &Vec<P>) {
    let paths_owned: Vec<PathBuf> = paths.iter().map(|p| p.as_ref().to_owned()).collect();
    assert!(
        CONFIG.set(move || load_config(&paths_owned).unwrap()),
        "initialize_config() is called twice",
    );
}
