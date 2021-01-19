#! /bin/bash
export NAME="cb/run"
cd ~/github/carbon-bond/carbonbond

sudo service redis-server start
sudo service postgresql start

tmux new-session -s $NAME -d "cargo run; bash"
cd frontend
tmux split-window -h "yarn watch; bash"
tmux split-window -v "yarn check-ts --watch; bash"

tmux -2 attach-session -d
