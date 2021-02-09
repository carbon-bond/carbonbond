## 版本

1.37.0-nightly 以上

安裝
``` sh
rustup default nightly
rustup update
```

## rustfmt

欲將將整個專案的 rust 檔案都標準格式化，執行
``` sh
cargo fmt
```

若只想檢查語法但不想修改檔案，可以執行
``` sh
cargo fmt -- --check
```

可修改專案底下的 .rustfmt.toml 檔案來設定格式，詳見[官方文件](https://github.com/rust-lang/rustfmt/blob/master/Configurations.md)

## vscode 建議設定

安裝 [rust-analyzer 外掛](https://marketplace.visualstudio.com/items?itemName=matklad.rust-analyzer)

### 存檔時格式化程式碼
在 vscode 的 setting.json 設定
```
"[rust]":{
    "editor.formatOnSave": true,
}
```