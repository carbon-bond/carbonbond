# HTTPS

`frontend` 容器中的 Nginx 預設使用 HTTP ，然而 HTTP 傳輸明文，這導致許多安全隱患，例如，在公共網路中使用密碼登入時，若有惡意人士竊聽，將有洩漏密碼的危險。是故，正式上線的網站都應採用 HTTPS 來保證安全與隱私。

本文提供兩種方式為碳鍵加上 HTTPS。

## 方法一： 設定 Nginx 

1. 申請 SSL 憑證，你可以在 [Let's Encrypt](https://letsencrypt.org/) 免費申請，或是其他供應商申請，但他們可能會收取費用。
2. 按照 [Nginx 官方文件](http://nginx.org/en/docs/http/configuring_https_servers.html)修改 [Nginx 設定檔](https://github.com/carbon-bond/carbonbond/blob/master/frontend/app/web/deploy/nginx.conf)，為其加入 SSL 憑證的設定。
3. 在本地端重新生成 `frontend` 的 docker 映像檔。(TODO:補充具體步驟)

## 方法二： Caddy 反向代理

Caddy 是一個 HTTPS 的伺服器軟體，無需任何設定，開箱即能使用 HTTPS。您可以在 443 埠口架設 Caddy ，再將所有請求反向代理給 `frontend`。這會是最容易的方法，但注意再增加一層反向代理是必帶來更多性能損耗。
