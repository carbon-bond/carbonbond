FROM ubuntu:20.04

WORKDIR '/app/api-service'
RUN apt update -y
# 寄發 email 時調用了 curl
RUN apt install curl -y
COPY target/release/server .
COPY assets ./assets
COPY migrations ./migrations
ENV RUST_LOG debug
ENV MODE release
CMD ./server