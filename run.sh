#! /bin/bash
export NAME="cb/run"

sudo service redis-server start
sudo service postgresql start

cd api-service
tmux new-session -s $NAME -d "cargo run; bash"
cd ../frontend
tmux split-window -h "yarn dev; bash"
tmux split-window -v "yarn check-ts --watch; bash"

tmux -2 attach-session -d
