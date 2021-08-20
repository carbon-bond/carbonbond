FROM ubuntu:20.04

WORKDIR '/app/api-service'
RUN apt-get update && \
	apt-get install -y --no-install-recommends ca-certificates && \
	apt-get clean && \
	apt-get autoremove && \
	rm -rf /var/lib/apt/lists/* /var/tmp/* /tmp/*
COPY target/release/server .
COPY assets ./assets
COPY migrations ./migrations
ENV RUST_LOG debug
ENV MODE release
CMD ./server