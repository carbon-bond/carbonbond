use serde::{Deserialize, Serialize};
use serde_json;
use std::{
    collections::HashSet,
    fmt::{Debug, Display, Formatter, Result as FmtResult},
};
use typescript_definitions::TypeScriptify;

use crate::custom_error::{ErrorCode, Fallible};

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub enum FieldKind {
    Number,
    OneLine,
    MultiLine,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Field {
    pub name: String,
    pub kind: FieldKind,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Category {
    pub name: String,
    pub fields: Vec<Field>,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Force {
    pub categories: Vec<Category>,
    pub suggested_tags: Vec<String>,
}

impl Force {
    pub fn check_semantic(&self) -> Fallible<()> {
        if self.categories.len() == 0 {
            return Err(ForceLangError::NoCategory.into());
        }
        let mut tag_set: HashSet<String> = HashSet::new();
        for tag in &self.suggested_tags {
            if tag_set.contains(tag) {
                return Err(ForceLangError::DuplicateTag(tag.clone()).into());
            }
            tag_set.insert(tag.clone());
        }

        let mut category_name_set: HashSet<String> = HashSet::new();
        for category in &self.categories {
            if category_name_set.contains(&category.name) {
                return Err(ForceLangError::DuplicateCategory(category.name.clone()).into());
            }
            category_name_set.insert(category.name.clone());
            let mut field_name_set: HashSet<String> = HashSet::new();
            for field in &category.fields {
                if field_name_set.contains(&field.name) {
                    return Err(ForceLangError::DuplicateTag(field.name.clone()).into());
                }
                field_name_set.insert(field.name.clone());
            }
        }
        Ok(())
    }
}

#[derive(Display, Debug, Serialize)]
pub enum ForceLangError {
    #[display(fmt = "至少要有一個分類")]
    NoCategory,
    #[display(fmt = "同名標籤 {}", "_0")]
    DuplicateTag(String),
    #[display(fmt = "同名分類 {}", "_0")]
    DuplicateCategory(String),
    #[display(fmt = "同名欄位 {}", "_0")]
    DuplicateField(String),
}

impl Into<ErrorCode> for ForceLangError {
    fn into(self) -> ErrorCode {
        ErrorCode::ForceLangError(self)
    }
}
impl std::error::Error for ForceLangError {}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Bond {
    pub to: i64,
    pub tag: String,
}

#[derive(Debug)]
pub struct ValidationError {
    pub field_name: String,
    pub code: ValidationErrorCode,
}
#[derive(Debug)]
pub enum ValidationErrorCode {
    NotI64(serde_json::Number),
    NotOneline(String),
    TypeMismatch(FieldKind, serde_json::Value),
}
impl Display for ValidationError {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        write!(f, "{:?}", self)
    }
}
impl std::error::Error for ValidationError {}

#[cfg(test)]
mod tests {
    use std::vec;

    use super::*;

    #[test]
    fn test_force_valid() {
        assert!(
            Force {
                suggested_tags: vec![],
                categories: vec![],
            }
            .check_semantic()
            .is_ok()
                == false,
            "至少要有一個分類"
        );
        assert!(
            Force {
                suggested_tags: vec!["x".to_owned(), "x".to_owned()],
                categories: vec![Category {
                    fields: vec![],
                    name: "a".to_owned()
                }],
            }
            .check_semantic()
            .is_ok()
                == false,
            "不允許同名標籤"
        );
        assert!(
            Force {
                suggested_tags: vec![],
                categories: vec![
                    Category {
                        fields: vec![],
                        name: "a".to_owned()
                    },
                    Category {
                        fields: vec![],
                        name: "a".to_owned()
                    }
                ],
            }
            .check_semantic()
            .is_ok()
                == false,
            "不允許同名分類"
        );
        assert!(
            Force {
                suggested_tags: vec![],
                categories: vec![Category {
                    fields: vec![
                        Field {
                            name: "n".to_owned(),
                            kind: FieldKind::MultiLine,
                        },
                        Field {
                            name: "n".to_owned(),
                            kind: FieldKind::MultiLine,
                        },
                    ],
                    name: "a".to_owned()
                },],
            }
            .check_semantic()
            .is_ok()
                == false,
            "不允許同名欄位"
        );
        assert!(
            Force {
                suggested_tags: vec!["x".to_owned(), "y".to_owned()],
                categories: vec![Category {
                    fields: vec![
                        Field {
                            name: "n".to_owned(),
                            kind: FieldKind::MultiLine,
                        },
                        Field {
                            name: "m".to_owned(),
                            kind: FieldKind::MultiLine,
                        },
                    ],
                    name: "a".to_owned()
                },],
            }
            .check_semantic()
            .is_ok()
                == true,
            "一切正常"
        );
    }
}
