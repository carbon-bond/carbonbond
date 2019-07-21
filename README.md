# 碳鍵
提高你的鍵能，把那些笨蛋嘴成渣吧！

## CI

![Build Status](https://travis-ci.org/MROS/carbonbond.svg?branch=master)

## 建置
- 後端：使用 Rust 語言開發。
    + 參考 [官方網站](https://www.rust-lang.org/tools/install)
    + 使用 `cargo run` 可啟動伺服器並預設使用 `config/carbonbond.toml` 設定檔，
    + 使用 `cargo run -- --config-file FILE` 指定設定檔
    + 使用 `cargo run --bin db-tool` 可管理資料庫
- 前端：使用 typescript + React 開發。
    + `yarn` 安裝套件
    + `yarn watch` 編譯前端，並且監聽檔案改動
    + `yarn lint` 檢查風格

