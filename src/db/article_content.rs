use super::{get_pool, DBObject};
use crate::custom_error::{DataType, ErrorCode, Fallible};
use force::validate::ValidatorTrait;
use force::{Bondee, Category, Field};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;

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
impl DBObject for ArticleIntField {
    const TYPE: DataType = DataType::IntField;
}
impl DBObject for ArticleStringField {
    const TYPE: DataType = DataType::StringField;
}

trait Insertable {
    fn get_id(&self) -> i64;
    fn get_value(&self) -> Value;
    fn get_name(&self) -> String;
}

impl Insertable for ArticleIntField {
    fn get_id(&self) -> i64 {
        self.article_id
    }
    fn get_value(&self) -> Value {
        self.value.clone().into()
    }
    fn get_name(&self) -> String {
        self.name.clone()
    }
}
impl Insertable for ArticleStringField {
    fn get_id(&self) -> i64 {
        self.article_id
    }
    fn get_value(&self) -> Value {
        self.value.clone().into()
    }
    fn get_name(&self) -> String {
        self.name.clone()
    }
}

fn insert_kvs<T: Insertable>(kvs: &mut HashMap<String, Value>, fields: &Vec<T>) {
    for field in fields.into_iter() {
        match kvs.get_mut(&field.get_name()) {
            Some(array @ Value::Array(_)) => {
                array.as_array_mut().unwrap().push(field.get_value().into());
            }
            _ => {
                kvs.insert(field.get_name(), field.get_value().into());
            }
        }
    }
}

fn init_kvs(category: &Category) -> HashMap<String, Value> {
    let mut kvs: HashMap<String, Value> = HashMap::new();
    for field in &category.fields {
        if let force::DataType::Array { .. } = field.datatype {
            kvs.insert(field.name.clone(), (Vec::new() as Vec<Value>).into());
        }
    }
    kvs
}

fn make_group<T: Insertable>(fields: Vec<T>) -> HashMap<i64, Vec<T>> {
    let mut groups = HashMap::new();
    for field in fields {
        match groups.get_mut(&field.get_id()) {
            None => {
                groups.insert(field.get_id(), vec![field]);
            }
            Some(v) => v.push(field),
        }
    }
    groups
}

fn insert_id_to_kvs<T: Insertable>(
    ids: &Vec<i64>,
    id_to_kvs: &mut HashMap<i64, HashMap<String, Value>>,
    fields: Vec<T>,
) {
    let group = make_group(fields);
    for id in ids {
        match group.get(id) {
            Some(fs) => insert_kvs(id_to_kvs.get_mut(id).unwrap(), fs),
            _ => {}
        }
    }
}

// ids[i] 的分類爲 categories[i]
pub async fn get_by_article_ids(
    ids: Vec<i64>,
    categories: Vec<Arc<Category>>,
) -> Fallible<Vec<String>> {
    let pool = get_pool();
    let mut id_to_kvs: HashMap<i64, HashMap<String, Value>> = HashMap::new();
    for i in 0..ids.len() {
        id_to_kvs.insert(ids[i], init_kvs(&categories[i]));
    }
    let string_fields: Vec<ArticleStringField> = sqlx::query_as!(
        ArticleStringField,
        "
        SELECT article_id, name, value FROM article_string_fields
        WHERE article_id = ANY($1);
        ",
        &ids
    )
    .fetch_all(pool)
    .await?;
    insert_id_to_kvs(&ids, &mut id_to_kvs, string_fields);
    let int_fields: Vec<ArticleIntField> = sqlx::query_as!(
        ArticleIntField,
        "
        SELECT article_id, name, value FROM article_int_fields
        WHERE article_id = ANY($1);
        ",
        &ids
    )
    .fetch_all(pool)
    .await?;
    insert_id_to_kvs(&ids, &mut id_to_kvs, int_fields);
    let bond_fields: Vec<ArticleIntField> = sqlx::query_as!(
        ArticleIntField,
        "
        SELECT article_id, name, value FROM article_bond_fields
        WHERE article_id = ANY($1);
        ",
        &ids
    )
    .fetch_all(pool)
    .await?;
    insert_id_to_kvs(&ids, &mut id_to_kvs, bond_fields);
    let mut ret = Vec::new();
    for id in &ids {
        ret.push(serde_json::to_string(id_to_kvs.get(id).unwrap())?);
    }
    Ok(ret)
}

pub async fn get_by_article_id(id: i64, category: &Category) -> Fallible<String> {
    let pool = get_pool();
    let mut kvs = init_kvs(category);
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
    insert_kvs(&mut kvs, &string_fields);
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
    insert_kvs(&mut kvs, &int_fields);
    let bond_fields: Vec<ArticleIntField> = sqlx::query_as!(
        ArticleIntField,
        "
        SELECT article_id, name, value FROM article_bond_fields
        WHERE article_id = $1;
        ",
        id
    )
    .fetch_all(pool)
    .await?;
    insert_kvs(&mut kvs, &bond_fields);
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
