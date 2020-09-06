use super::{get_pool, DBObject};
use crate::custom_error::{DataType, ErrorCode, Fallible};
use force::parser::Category;
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct ArticleIntField {
    pub article_id: i64,
    pub name: String,
    pub value: i64,
}
#[derive(Debug, Default)]
pub struct ArticleStringField {
    pub article_id: i64,
    pub name: String,
    pub value: String,
}
#[derive(Debug, Default)]
pub struct ArticleBondField {
    pub article_id: i64,
    pub name: String,
    pub value: i64,
}
impl DBObject for ArticleIntField {
    const TYPE: DataType = DataType::IntField;
}
impl DBObject for ArticleStringField {
    const TYPE: DataType = DataType::StringField;
}
impl DBObject for ArticleBondField {
    const TYPE: DataType = DataType::BondField;
}

pub async fn get_by_article_id(id: i64) -> Fallible<String> {
    let pool = get_pool();
    let mut kvs: HashMap<String, Value> = HashMap::new();
    let string_fields: Vec<ArticleStringField> = sqlx::query_as!(
        ArticleStringField,
        "
        SELECT article_id, name, value FROM article_string_fields
        WHERE article_id = $1;
        ",
        id
    )
    .fetch_all(pool)
    .await?;
    for field in string_fields.into_iter() {
        kvs.insert(field.name, Value::String(field.value));
    }
    Ok(serde_json::to_string(&kvs)?)
}

fn mismatch_error(field: &force::parser::Field) -> Fallible<()> {
    Err(ErrorCode::Other(format!(
        "力語言型別錯誤：預期欄位 {} 是 {:?} 型別",
        field.name, field.datatype
    ))
    .into())
}

// 檢驗 json 形式的文章是否符合力語言
fn validate_content(json: &Value, category: &Category) -> Fallible<()> {
    for field in &category.fields {
        match field.datatype {
            force::DataType::Number => match &json[&field.name] {
                Value::Number(_) => {}
                _ => {
                    return mismatch_error(field);
                }
            },
            force::DataType::OneLine => match &json[&field.name] {
                Value::String(_) => {}
                _ => {
                    return mismatch_error(field);
                }
            },
            force::DataType::Text(_) => match &json[&field.name] {
                Value::String(_) => {}
                _ => {
                    return mismatch_error(&field);
                }
            },
            _ => {
                return Err(
                    ErrorCode::Other(format!("力語言尚未支援 {:?} 型別", field.datatype)).into(),
                );
            }
        }
    }
    Ok(())
}

pub(super) async fn create(article_id: i64, content: &str, category: Category) -> Fallible<()> {
    let json: Value = serde_json::from_str(content)?;

    // 檢驗格式
    validate_content(&json, &category)?;

    let pool = get_pool();

    for field in category.fields {
        match field.datatype {
            force::DataType::Number => match &json[&field.name] {
                Value::Number(number) => {
                    sqlx::query!(
                        "INSERT INTO article_int_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
                        article_id,
                        field.name,
                        number.as_i64().unwrap()
                    )
                    .execute(pool)
                    .await?;
                }
                _ => {
                    return mismatch_error(&field);
                }
            },
            force::DataType::OneLine | force::DataType::Text(_) => match &json[&field.name] {
                Value::String(s) => {
                    sqlx::query!(
                        "INSERT INTO article_string_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
                        article_id,
                        field.name,
                        s
                    )
                    .execute(pool)
                    .await?;
                }
                _ => {
                    return mismatch_error(&field);
                }
            },
            _ => {
                return Err(
                    ErrorCode::Other(format!("力語言尚未支援 {:?} 型別", field.datatype)).into(),
                );
            }
        }
    }
    Ok(())
}
