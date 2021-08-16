#! /bin/sh

export SQLX_OFFLINE=true
cargo build --release --bin server
strip ./target/release/server
