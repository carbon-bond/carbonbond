use std::io::prelude::*;
use std::path::Path;
use std::fs::File;
use serde::{Serialize, Deserialize};
use failure::Fallible;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerConfig {
    pub address: String,
    pub port: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
}

pub fn load_config<P: AsRef<Path>>(path: P) -> Fallible<Config> {
    // 載入設定檔
    let content = {
        let pathr = path.as_ref();
        let mut file = File::open(pathr)?;
        let mut content = String::new();
        file.read_to_string(&mut content)?;
        content
    };

    let config: Config = toml::from_str(&content)?;
    Ok(config)
}
