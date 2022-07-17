#! /bin/bash
export NAME="cb/run"

brew services start redis
brew services start postgresql

cd api-service
tmux new-session -s $NAME -d "env RUST_LOG=debug cargo run; bash"
cd ../frontend/app/desktop
tmux split-window -h "yarn dev; bash"
tmux split-window -v "yarn check-ts --watch; bash"

tmux -2 attach-session -d
