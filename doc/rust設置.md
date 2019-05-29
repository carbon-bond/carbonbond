## 版本

1.35.0 stable 以上

## rustfmt

安裝
``` sh
rustup component add rustfmt
```

欲將將整個專案的 rust 檔案都標準格式化，執行
``` sh
cargo fmt
```

可修改專案底下的 .rustfmt.toml 檔案來設定格式，詳見[官方文件](https://github.com/rust-lang/rustfmt/blob/master/Configurations.md)

## vscode

安裝 [Rust (rls) 外掛](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust)

並在 vscode 的 setting.json 設定

```
"editor.formatOnSave": true,
```

以使 vscode 在每次存檔時都自動 format