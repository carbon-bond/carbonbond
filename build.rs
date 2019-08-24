fn main() {
    let mut config = prost_build::Config::default();
    config.out_dir("src/chat");
    config
        .compile_protos(&["api/protobuf/chat.proto"], &["api/protobuf/"])
        .unwrap();
}