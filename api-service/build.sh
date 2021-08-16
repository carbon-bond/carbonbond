#! /bin/sh

export SQLX_OFFLINE=true

cargo build --release --bin server
echo "執行檔大小"
ls -sh "./target/release/server"

strip ./target/release/server
echo "strip 之後"
ls -sh "./target/release/server"
