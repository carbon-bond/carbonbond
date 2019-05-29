爲了使各個開發者共用 hook ，各個 hook 放在 .hooks 目錄底下，但 git 預設是去 .git/hooks 目錄下檢查 hook ，所以請執行
``` sh
git config core.hooksPath .hooks
```
來修改 git 預設的 hook 目錄。