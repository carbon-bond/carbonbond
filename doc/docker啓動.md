# docker 啓動

1. 設置 `carbonbond.release.toml` 設定檔

```sh
cd api-service/config          # 依循第 2 步 docker-compose 啓動後，會讀取 config/ 下的設定檔
cp carbonbond.docker.toml carbonbond.release.toml
```

2. 修改 deply/docker-compose.yml

（若您僅要執行 docker hub 上最新的映像檔，可省略本步驟）

根據該檔案中的說明，註解／反註解特定程式碼

3. 根據目前程式碼製作 docker 映像檔

（若您僅要執行 docker hub 上最新的映像檔，可省略本步驟）

```sh
cd deploy
sh build.sh
docker-compose build
```

4. 啓動 docker

```sh
cd deploy
docker-compose up
```

需先關閉本地端的 postgresql ，否則埠口會撞到