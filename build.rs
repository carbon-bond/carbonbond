extern crate prost_build;
fn main() {
    let mut config = prost_build::Config::default();
    config.out_dir("src/chat");
    config
        .compile_protos(&["src/chat/protobuf/chat.proto"], &["src/chat"])
        .unwrap();
}
