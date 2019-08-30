FROM archlinux/base:latest

# 準備檔案
COPY pacman.conf /etc/pacman.conf
COPY locale.gen /etc/locale.gen
COPY locale.conf /etc/locale.conf
COPY start.sh /start.sh
# COPY mirrorlist /etc/pacman.d/mirrorlist
# COPY makepkg.conf /etc/makepkg.conf

# 設定語系
RUN locale-gen
ENV LANG zh_TW.UTF-8
ENV LC_ALL zh_TW.UTF-8
ENV LANGUAGE zh_TW:zh

# 安裝相依套件
RUN pacman -Syu --noconfirm
RUN pacman -S --needed --noconfirm archlinux-keyring ca-certificates ca-certificates-mozilla base-devel git go wget sudo vim
RUN pacman -S --needed --noconfirm rustup postgresql yarn mariadb-libs

# 設定 rust
RUN rustup update
RUN rustup default nightly
RUN cargo install diesel_cli

CMD /start.sh

EXPOSE 8080
