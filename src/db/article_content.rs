use super::{get_pool, DBObject};
use crate::custom_error::{DataType, ErrorCode, Fallible};
use force::validate::ValidatorTrait;
use force::{Bondee, Category, Field};
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

pub async fn get_by_article_id(id: i64, category: &Category) -> Fallible<String> {
    let pool = get_pool();
    let mut kvs: HashMap<String, Value> = HashMap::new();
    for field in &category.fields {
        if let force::DataType::Array { .. } = field.datatype {
            kvs.insert(field.name.clone(), (Vec::new() as Vec<Value>).into());
        }
    }
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
        match kvs.get_mut(&field.name) {
            Some(array @ Value::Array(_)) => {
                array.as_array_mut().unwrap().push(field.value.into());
            }
            _ => {
                kvs.insert(field.name, field.value.into());
            }
        }
    }
    let int_fields: Vec<ArticleIntField> = sqlx::query_as!(
        ArticleIntField,
        "
        SELECT article_id, name, value FROM article_int_fields
        WHERE article_id = $1;
        ",
        id
    )
    .fetch_all(pool)
    .await?;
    for field in int_fields.into_iter() {
        match kvs.get_mut(&field.name) {
            Some(array @ Value::Array(_)) => {
                array.as_array_mut().unwrap().push(field.value.into());
            }
            _ => {
                kvs.insert(field.name, field.value.into());
            }
        }
    }
    let bond_fields: Vec<ArticleBondField> = sqlx::query_as!(
        ArticleBondField,
        "
        SELECT article_id, name, value FROM article_bond_fields
        WHERE article_id = $1;
        ",
        id
    )
    .fetch_all(pool)
    .await?;
    for field in bond_fields.into_iter() {
        match kvs.get_mut(&field.name) {
            Some(array @ Value::Array(_)) => {
                array.as_array_mut().unwrap().push(field.value.into());
            }
            _ => {
                kvs.insert(field.name, field.value.into());
            }
        }
    }
    Ok(serde_json::to_string(&kvs)?)
}

struct Validator {
    board_id: i64,
}

impl ValidatorTrait for Validator {
    fn validate_bond(&self, bondee: &Bondee, data: &Value) -> bool {
        true
    }
}

async fn insert_int_field(article_id: i64, field_name: &String, value: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO article_int_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
        article_id,
        field_name,
        value
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn insert_string_field(article_id: i64, field_name: &String, value: &String) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO article_string_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
        article_id,
        field_name,
        value
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn insert_bond_field(article_id: i64, field_name: &String, value: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO article_bond_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
        article_id,
        field_name,
        value
    )
    .execute(pool)
    .await?;
    Ok(())
}
async fn insert_field(article_id: i64, field: &Field, value: &Value) -> Fallible<()> {
    match field.datatype.basic_type() {
        force::BasicDataType::Number => match value {
            Value::Number(number) => {
                insert_int_field(article_id, &field.name, number.as_i64().unwrap()).await?
            }
            // validate 過，不可能發生
            _ => {}
        },
        force::BasicDataType::OneLine | force::BasicDataType::Text(_) => {
            match value {
                Value::String(s) => insert_string_field(article_id, &field.name, s).await?,
                // validate 過，不可能發生
                _ => {}
            }
        }
        force::BasicDataType::Bond(_) => match value {
            Value::Number(number) => {
                insert_bond_field(article_id, &field.name, number.as_i64().unwrap()).await?
            }
            // validate 過，不可能發生
            _ => {}
        },
        _ => {
            return Err(
                ErrorCode::Other(format!("力語言尚未支援 {:?} 型別", field.datatype)).into(),
            );
        }
    }
    Ok(())
}

pub(super) async fn create(
    article_id: i64,
    board_id: i64,
    content: &str,
    category: Category,
) -> Fallible<()> {
    let json: Value = serde_json::from_str(content)?;

    // 檢驗格式
    if (Validator { board_id }.validate_category(&category, &json) == false) {
        return Err(ErrorCode::Other("文章不符合力語言定義".to_owned()).into());
    }

    use force::DataType::*;

    for field in category.fields {
        match &field.datatype {
            Optional(_) | Single(_) => insert_field(article_id, &field, &json[&field.name]).await?,
            Array { .. } => match &json[&field.name] {
                Value::Array(values) => {
                    for value in values {
                        insert_field(article_id, &field, value).await?
                    }
                }
                _ => {}
            },
        }
    }
    Ok(())
}
