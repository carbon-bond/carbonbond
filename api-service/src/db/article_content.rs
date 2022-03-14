use super::{get_pool, DBObject};
use crate::api::model::forum::{Author, BondInfo, MiniArticleMeta};
use crate::custom_error::{DataType, Fallible};
use serde::Serialize;
use serde_json::Value;
use sqlx::PgConnection;
use std::borrow::Cow;
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

fn insert_kvs<T: Insertable>(kvs: &mut HashMap<String, Value>, fields: &Vec<T>) {
    for field in fields.into_iter() {
        let value = serde_json::to_value(field.get_value()).unwrap();
        let name = field.get_name();
        kvs.insert(name.to_owned(), value);
    }
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
pub async fn get_by_article_ids(ids: Vec<i64>) -> Fallible<Vec<String>> {
    let pool = get_pool();
    let mut id_to_kvs: HashMap<i64, HashMap<String, Value>> = HashMap::new();
    for i in 0..ids.len() {
        id_to_kvs.insert(ids[i], HashMap::new());
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
    let mut ret = Vec::new();
    for id in &ids {
        ret.push(serde_json::to_string(id_to_kvs.get(id).unwrap())?);
    }
    Ok(ret)
}

// ids[i] 的分類為 categories[i]
pub async fn get_bonds_by_article_ids(
    ids: Vec<i64>,
    viewer_id: Option<i64>,
) -> Fallible<Vec<Vec<BondInfo>>> {
    let pool = get_pool();
    let mut id_to_bonds: HashMap<i64, Vec<BondInfo>> = HashMap::new();
    for i in 0..ids.len() {
        id_to_bonds.insert(ids[i], Vec::new());
    }

    let infos = sqlx::query!(
        "
        SELECT
            article_bonds.from_id,
            tag as bond_tag,
            articles.category,
            articles.title,
            users.user_name as author_name,
            users.id as author_id,
            articles.id,
            articles.create_time,
            articles.anonymous,
            boards.board_name
        FROM article_bonds
            INNER JOIN articles ON articles.id = article_bonds.to_id
            INNER JOIN users ON articles.author_id = users.id
            INNER JOIN boards ON articles.board_id = boards.id
            WHERE article_bonds.from_id = ANY($1);
        ",
        &ids
    )
    .fetch_all(pool)
    .await?;
    // XXX: 不知道爲什麼 SQLX 的類型推導會都是 Option
    for info in infos {
        let anonymous = info.anonymous.unwrap();
        let bond_info = BondInfo {
            article_meta: MiniArticleMeta {
                title: info.title.unwrap(),
                category: info.category.unwrap(),
                create_time: info.create_time.unwrap(),
                id: info.id.unwrap(),
                author: if anonymous && viewer_id == Some(info.author_id.unwrap()) {
                    Author::MyAnonymous
                } else if anonymous {
                    Author::Anonymous
                } else {
                    Author::NamedAuthor {
                        id: info.author_id.unwrap(),
                        name: info.author_name.unwrap(),
                    }
                },
                board_name: info.board_name.unwrap(),
            },
            tag: info.bond_tag.unwrap(),
            energy: 0,
        };
        id_to_bonds
            .get_mut(&info.from_id.unwrap())
            .unwrap()
            .push(bond_info);
    }

    let mut ret = Vec::new();
    for id in &ids {
        ret.push(id_to_bonds.remove(id).unwrap());
    }
    Ok(ret)
}

pub async fn get_by_article_id(id: i64) -> Fallible<String> {
    let pool = get_pool();
    let mut kvs = HashMap::new();
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
    Ok(serde_json::to_string(&kvs)?)
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

async fn insert_bond(
    conn: &mut PgConnection,
    article_id: i64,
    bond: &crate::force::Bond,
) -> Fallible<()> {
    sqlx::query!(
        "INSERT INTO article_bonds
        (from_id, to_id, energy, tag)
        VALUES ($1, $2, $3, $4)",
        article_id,
        bond.to,
        0,
        bond.tag,
    )
    .execute(&mut *conn)
    .await?;
    // TODO: 思考鍵結如何改變鍵能
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
                    let end = s.char_indices().map(|(i, _)| i).nth(MAX_LEN).unwrap();
                    Value::String(s[0..end].to_owned())
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
    content: Cow<'_, Value>,
    bonds: &Vec<crate::force::Bond>,
    category: &crate::force::Category,
) -> Fallible<()> {
    use crate::force::FieldKind::*;
    use crate::force::{ValidationError, ValidationErrorCode::*};
    for bond in bonds {
        insert_bond(conn, article_id, &bond).await?;
    }
    // 需在他處已驗證過 category.validate_json(&content)?;

    let mut digest = Digest::new();

    for field in category.fields.iter() {
        let value = &content[&field.name];
        match (&field.kind, value) {
            (MultiLine, Value::String(s)) => {
                insert_string_field(conn, article_id, &field.name, s).await?;
                digest.add(&field.name, &value, true);
            }
            (OneLine, Value::String(s)) => {
                insert_string_field(conn, article_id, &field.name, s).await?;
                digest.add(&field.name, &value, false);
            }
            (Number, Value::Number(n)) => {
                let n = n.as_i64().unwrap();
                insert_int_field(conn, article_id, &field.name, n).await?;

                digest.add(&field.name, &value, false);
            }
            _ => {
                return Err(ValidationError {
                    field_name: field.name.clone(),
                    code: TypeMismatch(field.kind.clone()).into(),
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
