FROM ubuntu:20.04

WORKDIR '/app/carbonbond'
COPY target/release/server .
COPY config ./config
COPY assets ./assets
COPY migrations ./migrations
ENV RUST_LOG debug
ENV MODE release
CMD ./server