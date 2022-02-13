use super::{get_pool, DBObject};
use crate::custom_error::{BondError, DataType, Error, ErrorCode, Fallible};
use crate::service;
use force::{instance_defs::Bond, validate::ValidatorTrait, Bondee, Category};
use serde::Serialize;
use serde_json::Value;
use sqlx::PgConnection;
use std::borrow::Cow;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Default)]
pub struct ArticleBondField {
    pub article_id: i64,
    pub name: String,
    pub energy: i16,
    pub tag: Option<String>,
    pub value: i64,
}
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

impl DBObject for ArticleBondField {
    const TYPE: DataType = DataType::BondField;
}
impl DBObject for ArticleIntField {
    const TYPE: DataType = DataType::IntField;
}
impl DBObject for ArticleStringField {
    const TYPE: DataType = DataType::StringField;
}

// XXX: 這個東西似乎不是用來 insert to db 的？
trait Insertable {
    type Output: Serialize;
    fn get_id(&self) -> i64;
    fn get_value(&self) -> Self::Output;
    fn get_name(&self) -> &str;
}

impl Insertable for ArticleIntField {
    type Output = i64;
    fn get_id(&self) -> i64 {
        self.article_id
    }
    fn get_value(&self) -> Self::Output {
        self.value
    }
    fn get_name(&self) -> &str {
        &self.name
    }
}
impl Insertable for ArticleStringField {
    type Output = String;
    fn get_id(&self) -> i64 {
        self.article_id
    }
    fn get_value(&self) -> Self::Output {
        self.value.clone()
    }
    fn get_name(&self) -> &str {
        &self.name
    }
}
impl Insertable for ArticleBondField {
    type Output = Bond;
    fn get_id(&self) -> i64 {
        self.article_id
    }
    fn get_value(&self) -> Self::Output {
        Bond {
            energy: self.energy,
            target_article: self.value,
            tag: self.tag.clone(),
        }
    }
    fn get_name(&self) -> &str {
        &self.name
    }
}

fn insert_kvs<T: Insertable>(kvs: &mut HashMap<String, Value>, fields: &Vec<T>) {
    for field in fields.into_iter() {
        let value = serde_json::to_value(field.get_value()).unwrap();
        let name = field.get_name();
        match kvs.get_mut(name) {
            Some(Value::Array(array)) => {
                array.push(value);
            }
            _ => {
                kvs.insert(name.to_owned(), value);
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

// ids[i] 的分類為 categories[i]
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
    let bond_fields: Vec<ArticleBondField> = sqlx::query_as!(
        ArticleBondField,
        "
        SELECT article_id, name, tag, energy, value FROM article_bond_fields
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
    let bond_fields: Vec<ArticleBondField> = sqlx::query_as!(
        ArticleBondField,
        "
        SELECT article_id, name, tag, energy, value FROM article_bond_fields
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
    type OtherError = BondError;
    async fn validate_bond(&self, bondee: &Bondee, data: &Bond) -> Result<(), Self::OtherError> {
        //XXX: 鍵能
        let meta = match super::article::get_meta_by_id(data.target_article, None).await {
            Err(e) => {
                if let Error::LogicError { code, .. } = &e {
                    if let ErrorCode::NotFound(..) = code {
                        log::trace!("找不到鍵結文章：{}", data.target_article);
                        return Err(BondError::TargetNotFound);
                    }
                }
                return Err(BondError::Custom(Box::new(e)));
            }
            Ok(m) => m,
        };
        if meta.board_id != self.board_id {
            return Err(BondError::TargetNotSameBoard(meta.board_id));
        }
        // XXX: 鍵能錯誤
        match bondee {
            Bondee::All => Ok(()),
            Bondee::Choices { category, family } => {
                if category.contains(&meta.category_name) {
                    return Ok(());
                }
                for f in &meta.category_families {
                    if family.contains(f) {
                        return Ok(());
                    }
                }
                log::trace!(
                    "鍵結不合力語言定義：定義為{:?}，得到{:?}，指向文章{:?}",
                    bondee,
                    data,
                    meta
                );
                Err(BondError::TargetViolateCategory)
            }
        }
    }
}

async fn insert_int_field(
    conn: &mut PgConnection,
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

async fn insert_string_field(
    conn: &mut PgConnection,
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

async fn insert_bond_field(
    conn: &mut PgConnection,
    article_id: i64,
    field_name: &String,
    bond: &Bond,
) -> Fallible<()> {
    sqlx::query!(
        "INSERT INTO article_bond_fields
        (article_id, name, value, energy, tag)
        VALUES ($1, $2, $3, $4, $5)",
        article_id,
        field_name,
        bond.target_article,
        bond.energy,
        bond.tag,
    )
    .execute(&mut *conn)
    .await?;
    super::article::update_energy(conn, bond.target_article, bond.energy).await?;
    service::hot_articles::modify_article_energy(bond.target_article, bond.energy).await?;
    Ok(())
}

// block 代表文章欄位中佔用空間較大的
// 目前僅有 multiline 屬於 block
struct Digest {
    block_fields: HashMap<String, Value>,
    non_block_fields: HashMap<String, Value>,
    char_count: usize,
}

const MAX_LEN: usize = 300;

impl Digest {
    fn new() -> Digest {
        Digest {
            block_fields: Default::default(),
            non_block_fields: Default::default(),
            char_count: 0,
        }
    }
    fn add(&mut self, field_name: &str, value: &Value, is_block: bool) {
        self.char_count += field_name.len();
        match value {
            Value::Number(n) => {
                self.char_count += format!("{}", &n).len();
                self.non_block_fields
                    .insert(field_name.to_string(), value.clone());
            }
            Value::String(s) => {
                self.char_count += s.len();
                let truncated_value = if s.len() > MAX_LEN {
                    Value::String(s[0..MAX_LEN].to_owned())
                } else {
                    value.clone()
                };
                if is_block {
                    self.block_fields
                        .insert(field_name.to_string(), truncated_value);
                } else {
                    self.non_block_fields
                        .insert(field_name.to_string(), truncated_value);
                }
            }
            _ => {
                log::error!("不支援的文章域類型（僅支援數字與字串）：{}", value)
            }
        }
    }
    fn is_truncated(&self) -> bool {
        self.char_count > 300
    }
    fn to_json(&self) -> Fallible<String> {
        if self.is_truncated() {
            if self.block_fields.len() > 0 {
                Ok(serde_json::to_string(&self.block_fields)?)
            } else {
                Ok(serde_json::to_string(&self.non_block_fields)?)
            }
        } else {
            let mut all = HashMap::new();
            all.extend(&self.block_fields);
            all.extend(&self.non_block_fields);
            Ok(serde_json::to_string(&all)?)
        }
    }
}

pub(super) async fn create(
    conn: &mut PgConnection,
    article_id: i64,
    board_id: i64,
    content: Cow<'_, Value>,
    category: &crate::force::Category,
) -> Fallible<()> {
    use crate::force::FieldKind::*;
    use crate::force::{ValidationError, ValidationErrorCode::*};
    // 檢驗格式

    // TODO: fields 長度爲 0 的特殊狀況（文章內不分域）

    let mut digest = Digest::new();

    for field in category.fields.iter() {
        let value = &content[&field.name];
        match (&field.kind, value) {
            (MultiLine, Value::String(s)) => {
                insert_string_field(conn, article_id, &field.name, s).await?;

                digest.add(&field.name, &value, true);
            }
            (OneLine, Value::String(s)) => {
                if s.contains('\n') {
                    return Err(ValidationError {
                        field_name: field.name.clone(),
                        code: NotOneline(s.clone()).into(),
                    }
                    .into());
                }
                insert_string_field(conn, article_id, &field.name, s).await?;

                digest.add(&field.name, &value, false);
            }
            (Number, Value::Number(n)) => {
                if !n.is_i64() {
                    return Err(ValidationError {
                        field_name: field.name.clone(),
                        code: NotI64(n.clone()).into(),
                    }
                    .into());
                }
                let n = n.as_i64().unwrap();
                insert_int_field(conn, article_id, &field.name, n).await?;

                digest.add(&field.name, &value, false);
            }
            _ => {
                return Err(ValidationError {
                    field_name: field.name.clone(),
                    code: TypeMismatch(field.kind.clone(), content[&field.name].clone()).into(),
                }
                .into());
            }
        }
    }

    sqlx::query!(
        "UPDATE articles SET digest = $1, digest_truncated = $2 where id = $3",
        digest.to_json()?,
        digest.is_truncated(),
        article_id
    )
    .execute(conn)
    .await?;

    Ok(())
}
