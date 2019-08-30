# 啓動 postgresql 伺服器
export PGROOT=/var/lib/postgres
sudo -i -u postgres /usr/bin/postgresql-check-db-dir ${PGROOT}/data &&
    /usr/bin/postgres -D ${PGROOT}/data &
