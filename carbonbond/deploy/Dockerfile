# 建置階段
FROM ekidd/rust-musl-builder AS builder

# 爲配合目前 config 檔案的專案目錄定位方式，需將專案根目錄命名爲 carbonbond
WORKDIR '/build/carbonbond'
RUN sudo chown -R rust:rust .
ENV SQLX_OFFLINE true
COPY . .
RUN cargo build --release --bin server
RUN strip ./target/x86_64-unknown-linux-musl/release/server

# 執行階段
FROM alpine:latest AS runtime

WORKDIR '/app/carbonbond'
COPY --from=builder \
    /build/carbonbond/target/x86_64-unknown-linux-musl/release/server \
    /app/carbonbond/
COPY config .
COPY assets .
ENV RUST_LOG debug
CMD ./server