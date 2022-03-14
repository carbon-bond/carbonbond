use serde::{Deserialize, Serialize};
use serde_json;
use std::{collections::HashSet, fmt::Debug};
use typescript_definitions::TypeScriptify;

use crate::custom_error::{ErrorCode, Fallible};

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug, Display)]
pub enum FieldKind {
    #[display(fmt = "數字")]
    Number,
    #[display(fmt = "單行文字")]
    OneLine,
    #[display(fmt = "多行文字")]
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

impl Category {
    pub fn validate_json(&self, content: &serde_json::Value) -> Fallible<()> {
        for field in &self.fields {
            match content.get(&field.name) {
                Some(value) => match (&field.kind, value) {
                    (FieldKind::MultiLine, serde_json::Value::String(_v)) => {
                        // TODO: 彈性限制字數
                    }
                    (FieldKind::OneLine, serde_json::Value::String(v)) => {
                        if v.contains("\n") {
                            return ValidationError::to_err(
                                field.name.clone(),
                                ValidationErrorCode::NotOneline,
                            );
                        }
                    }
                    (FieldKind::Number, serde_json::Value::Number(v)) => {
                        if !v.is_i64() {
                            return ValidationError::to_err(
                                field.name.clone(),
                                ValidationErrorCode::NotI64(v.clone()),
                            );
                        }
                    }
                    _ => {
                        return ValidationError::to_err(
                            field.name.clone(),
                            ValidationErrorCode::TypeMismatch(field.kind.clone()),
                        );
                    }
                },
                None => {
                    return Err(ValidationError {
                        field_name: field.name.clone(),
                        code: ValidationErrorCode::NotFound,
                    }
                    .into())
                }
            }
        }
        Ok(())
    }
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

#[derive(Display, Debug)]
#[display(fmt = "力語言驗證錯誤，欄位 {} 發生錯誤 {}", "field_name", "code")]
pub struct ValidationError {
    pub field_name: String,
    pub code: ValidationErrorCode,
}
impl ValidationError {
    pub fn to_err(field_name: String, code: ValidationErrorCode) -> Fallible<()> {
        Err(ValidationError { field_name, code }.into())
    }
}
#[derive(Display, Debug)]
pub enum ValidationErrorCode {
    NotI64(serde_json::Number),
    NotOneline,
    TypeMismatch(FieldKind),
    NoEmpty,
    NotFound,
    Nothing,
}
impl Into<ErrorCode> for ValidationError {
    fn into(self) -> ErrorCode {
        ErrorCode::ForceValidate(self)
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
