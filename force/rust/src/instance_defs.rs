use serde::{Deserialize, Serialize};
use typescript_definitions::TypeScriptify;

// 力語言第三個基本型別
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TypeScriptify)]
pub struct Bond {
    pub energy: i16,
    pub target_article: i64,
    pub tag: Option<String>,
}
