use state::LocalStorage;

mod config;
pub use config::*;

static CONFIG: LocalStorage<Config> = LocalStorage::new();

/// 載入設定檔，將設定檔物件儲存於全域狀態
/// * `paths` 一至多個檔案路徑，函式會選擇第一個讀取成功的設定檔
pub fn init(path: Option<String>) {
    let config = load_config(&path).unwrap();
    log::info!("初始化設定檔：{:?}", config.file_name);
    assert!(CONFIG.set(move || config.clone()), "init() is called twice",);
}

pub fn get_config() -> &'static Config {
    CONFIG.get()
}
