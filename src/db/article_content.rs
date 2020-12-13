use super::{get_pool, DBObject};
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use force::{
    error::Error as ForceError, instance_defs::Bond, validate::ValidatorTrait, Bondee, Category,
    Field,
};
use serde_json::Value;
use sqlx::{executor::Executor, Postgres};
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

#[async_trait::async_trait]
impl ValidatorTrait for Validator {
    type OtherError = Error;
    async fn validate_bond(&self, bondee: &Bondee, data: &Bond) -> Result<bool, Error> {
        //XXX: 鍵能
        let res = match bondee {
            Bondee::All => true,
            Bondee::Choices { category, family } => {
                let meta = match super::article::get_meta_by_id(data.target_article).await {
                    Err(e) => {
                        if let Error::LogicError { code, .. } = &e {
                            if let ErrorCode::NotFound(..) = code {
                                log::trace!("找不到鍵結文章：{}", data.target_article);
                                return Ok(false);
                            }
                        }
                        return Err(e);
                    }
                    Ok(m) => m,
                };
                if meta.board_id != self.board_id {
                    log::trace!("鍵結指向不同看板：{} -> {}", self.board_id, meta.board_id);
                    return Ok(false);
                }
                if category.contains(&meta.category_name) {
                    return Ok(true);
                }
                for f in &meta.category_families {
                    if family.contains(f) {
                        return Ok(true);
                    }
                }
                log::trace!(
                    "鍵結不合力語言定義：定義為{:?}，得到{:?}，指向文章{:?}",
                    bondee,
                    data,
                    meta
                );
                false
            }
        };
        Ok(res)
    }
}

async fn insert_int_field<C: Executor<Database = Postgres>>(
    conn: &mut C,
    article_id: i64,
    field_name: &String,
    value: i64,
) -> Fallible<()> {
    sqlx::query!(
        "INSERT INTO article_int_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
        article_id,
        field_name,
        value
    )
    .execute(conn)
    .await?;
    Ok(())
}

async fn insert_string_field<C: Executor<Database = Postgres>>(
    conn: &mut C,
    article_id: i64,
    field_name: &String,
    value: &String,
) -> Fallible<()> {
    sqlx::query!(
        "INSERT INTO article_string_fields
                        (article_id, name, value)
                        VALUES ($1, $2, $3)",
        article_id,
        field_name,
        value
    )
    .execute(conn)
    .await?;
    Ok(())
}

async fn insert_bond_field<C: Executor<Database = Postgres>>(
    conn: &mut C,
    article_id: i64,
    field_name: &String,
    bond: &Bond,
) -> Fallible<()> {
    sqlx::query!(
        "INSERT INTO article_bond_fields
                        (article_id, name, value, energy)
                        VALUES ($1, $2, $3, $4)",
        article_id,
        field_name,
        bond.target_article,
        bond.energy
    )
    .execute(conn)
    .await?;
    Ok(())
}
async fn insert_field<C: Executor<Database = Postgres>>(
    conn: &mut C,
    article_id: i64,
    field: &Field,
    value: Value,
) -> Fallible<()> {
    log::debug!("插入文章內容 {:?} {:?}", field, value);
    match field.datatype.basic_type() {
        force::BasicDataType::Number => match value {
            Value::Number(number) => {
                insert_int_field(conn, article_id, &field.name, number.as_i64().unwrap()).await?
            }
            // validate 過，不可能發生
            _ => {}
        },
        force::BasicDataType::OneLine | force::BasicDataType::Text(_) => {
            match value {
                Value::String(s) => insert_string_field(conn, article_id, &field.name, &s).await?,
                // validate 過，不可能發生
                _ => {}
            }
        }
        force::BasicDataType::Bond(_) => match serde_json::from_value::<Bond>(value) {
            Ok(bond) => insert_bond_field(conn, article_id, &field.name, &bond).await?,
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

pub(super) async fn create<C: Executor<Database = Postgres>>(
    conn: &mut C,
    article_id: i64,
    board_id: i64,
    content: &str,
    category: Category,
) -> Fallible<()> {
    let mut json: Value = serde_json::from_str(content).map_err(|err| {
        ErrorCode::ParsingJson
            .context("文章內容反序列化失敗")
            .context(err)
    })?;

    // 檢驗格式
    let validator = Validator { board_id };
    match validator.validate_category(&category, &json).await {
        Ok(()) => (),
        Err(ForceError::Validation(err)) => return Err(ErrorCode::ForceValidate(err).into()),
        Err(ForceError::Other(err)) => return Err(err),
    }

    use force::DataType::*;

    let json = json.as_object_mut().unwrap();

    for field in category.fields {
        // XXX: 如果使用者搞出一個有撞名欄位的分類，這裡的 unwrap 就會爆掉
        let value = json.remove(&field.name).unwrap();
        match &field.datatype {
            Optional(_) | Single(_) => insert_field(conn, article_id, &field, value).await?,
            Array { .. } => match value {
                Value::Array(values) => {
                    for value in values {
                        insert_field(conn, article_id, &field, value).await?
                    }
                }
                _ => {}
            },
        }
    }
    Ok(())
}
