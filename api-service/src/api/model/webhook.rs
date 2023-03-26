// 本檔案存放碳鍵發送給機器人的 webhook API 定義

use chitin::*;
#[chitin_model]
pub mod webhook_model_root {
    use chitin::*;
    use serde::{Deserialize, Serialize};
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct MentionInComment {
        pub article_id: i64,
        pub comment_id: i64,
        pub author_id: i64,
        pub comment_content: String,
    }

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub enum API {
        MentionedInComment(MentionInComment),
    }
}

pub use webhook_model_root::*;
