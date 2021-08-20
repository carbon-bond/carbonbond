FROM ubuntu:20.04

WORKDIR '/app/api-service'
RUN apt update && apt install -y  --no-install-recommends ca-certificates
COPY target/release/server .
COPY assets ./assets
COPY migrations ./migrations
ENV RUST_LOG debug
ENV MODE release
CMD ./server