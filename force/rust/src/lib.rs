pub mod lexer;
pub mod parser;

#[derive(Debug, Clone, PartialEq)]
pub enum Bondee {
    All,
    Choices(Vec<String>),
}
// TODO: 處理輸能等等額外設定
#[derive(Debug, Clone, PartialEq)]
pub struct Tag {
    name: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DataType {
    Bond(Bondee),
    TaggedBond(Bondee, Vec<Tag>),
    OneLine,
    Text(Option<String>), // 正則表達式
    Number,
}
