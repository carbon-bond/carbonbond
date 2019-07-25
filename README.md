# 碳鍵
提高你的鍵能，把那些笨蛋嘴成渣吧！

## CI

![Build Status](https://travis-ci.org/MROS/carbonbond.svg?branch=master)

## 建置
- 設定檔
    + 預設使用 config/carbonbond.local.toml，請將系統特定資訊寫於此份檔案
    + 若前述檔案不存在，則使用 config/carbonbond.toml
    + 私密訊息，如 API KEY 等等，請放置於 config/secret 資料夾，並於設定檔中指定欲使用哪一個私密檔案 
    + 更詳盡的說明請參閱 config/carbonbond.toml
- 後端：使用 Rust 語言開發。
    + 參考 [官方網站](https://www.rust-lang.org/tools/install)
    + 使用 `cargo run` 可啟動伺服器並預設使用
    + 使用 `cargo run -- --config-file FILE` 指定設定檔
    + 使用 `cargo run --bin db-tool` 可管理資料庫
- 前端：使用 typescript + React 開發。
    + `yarn` 安裝套件
    + `yarn watch` 編譯前端，並且監聽檔案改動
    + `yarn lint` 檢查風格

