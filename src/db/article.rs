use super::{article_content, get_pool, DBObject, ToFallible};
use crate::api::model::{Article, ArticleMeta, Bond, SearchField};
use crate::custom_error::{self, DataType, Error, Fallible};
use crate::db::board;
use chrono::{DateTime, Utc};
use force;
use force::parse_category;
use lazy_static::lazy_static;
use std::sync::Arc;
use std::sync::RwLock;
use std::{collections::HashMap, mem::MaybeUninit};

impl DBObject for ArticleMeta {
    const TYPE: DataType = DataType::Article;
}

struct BondAndArticle {
    id: i64,
    board_id: i64,
    board_name: String,
    category_id: i64,
    category_name: String,
    category_source: String,
    title: String,
    author_id: i64,
    author_name: String,
    show_in_list: bool,
    create_time: DateTime<chrono::Utc>,

    from: i64,
    to: i64,
    bond_energy: i16,
    name: String,
    bond_id: i64,
}
impl BondAndArticle {
    fn into(self) -> (Bond, ArticleMeta) {
        (
            Bond {
                from: self.from,
                to: self.to,
                energy: self.bond_energy,
                name: self.name,
                id: self.bond_id,
            },
            ArticleMeta {
                id: self.id,
                board_id: self.board_id,
                board_name: self.board_name,
                category_id: self.category_id,
                category_name: self.category_name,
                category_source: self.category_source,
                title: self.title,
                author_id: self.author_id,
                author_name: self.author_name,
                show_in_list: self.show_in_list,
                create_time: self.create_time,
            },
        )
    }
}

pub async fn metas_to_articles(
    metas: Vec<ArticleMeta>,
) -> Fallible<impl ExactSizeIterator<Item = Article>> {
    let mut categories = Vec::new();
    let mut ids = Vec::new();
    for meta in &metas {
        let category = get_force_category(meta.board_id, &meta.category_name).await?;
        categories.push(category);
        ids.push(meta.id);
    }
    let contents = article_content::get_by_article_ids(ids, categories).await?;
    Ok(metas
        .into_iter()
        .zip(contents.into_iter())
        .map(|(meta, content)| Article { meta, content }))
}

pub async fn search_article(
    author_name: Option<String>,
    board_name: Option<String>,
    category: Option<i64>,
    content: HashMap<String, SearchField>,
    end_time: Option<DateTime<Utc>>,
    start_time: Option<DateTime<Utc>>,
    title: Option<String>,
) -> Fallible<impl ExactSizeIterator<Item = Article>> {
    let pool = get_pool();
    let metas = sqlx::query_as!(
        ArticleMeta,
        "
        SELECT * FROM article_metas()
        WHERE ($1 OR board_name = $2)
        AND ($3 OR author_name = $4)
        AND ($5 OR category_id = $6)
        AND ($7 OR create_time < $8)
        AND ($9 OR create_time > $10)
        AND ($11 OR title ~ $12)
        ",
        board_name.is_none(),
        board_name,
        author_name.is_none(),
        author_name.unwrap_or_default(),
        category.is_none(),
        category.unwrap_or_default(),
        end_time.is_none(),
        end_time.unwrap_or(Utc::now()),
        start_time.is_none(),
        start_time.unwrap_or(Utc::now()),
        title.is_none(),
        title.unwrap_or_default()
    )
    .fetch_all(pool)
    .await?;
    // XXX: 用不定長 sql 優化之
    let mut ids: Vec<_> = metas.iter().map(|m| m.id).collect();
    for (name, value) in content.into_iter() {
        match value {
            SearchField::String(value) => {
                ids = sqlx::query!(
                    "
                    SELECT a.id FROM articles a WHERE EXISTS (
                        SELECT 1 FROM article_string_fields f
                        WHERE f.name = $1 AND f.article_id = a.id AND f.value ~ $2
                    ) AND a.id = ANY($3)
                    ",
                    name,
                    value,
                    &ids
                )
                .fetch_all(pool)
                .await?
                .into_iter()
                .map(|rec| rec.id)
                .collect();
            }
            SearchField::Range((from, to)) => {
                ids = sqlx::query!(
                    "
                    SELECT a.id FROM articles a WHERE EXISTS (
                        SELECT 1 FROM article_int_fields f
                        WHERE f.name = $1 AND f.article_id = a.id AND f.value >= $2 AND f.value <= $3
                    ) AND a.id = ANY($4)
                    ",
                    name,
                    from,
                    to,
                    &ids
                )
                .fetch_all(pool)
                .await?
                .into_iter()
                .map(|rec| rec.id)
                .collect();
            }
        }
    }
    let metas = {
        use std::collections::HashSet;
        let set: HashSet<i64> = ids.into_iter().collect();
        let mut filterd_metas = vec![];
        for m in metas.into_iter() {
            if set.contains(&m.id) {
                filterd_metas.push(m);
            }
        }
        filterd_metas
    };
    metas_to_articles(metas).await
}
pub async fn get_meta_by_id(id: i64) -> Fallible<ArticleMeta> {
    let pool = get_pool();
    let meta = sqlx::query_as!(
        ArticleMeta,
        "SELECT * FROM article_metas() WHERE id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(&id.to_string())?;
    Ok(meta)
}

pub async fn get_by_id(id: i64) -> Fallible<Article> {
    let meta = get_meta_by_id(id).await?;
    let category = get_force_category(meta.board_id, &meta.category_name).await?;
    let content = article_content::get_by_article_id(meta.id, &category).await?;
    Ok(Article { meta, content })
}

pub async fn get_by_board_name(
    board_name: &str,
    offset: i64,
    limit: usize,
) -> Fallible<impl ExactSizeIterator<Item = Article>> {
    let pool = get_pool();
    let metas = sqlx::query_as!(
        ArticleMeta,
        "
        SELECT * FROM article_metas()
        WHERE board_name = $1
        ORDER BY create_time DESC
        LIMIT $2 OFFSET $3
        ",
        board_name,
        limit as i64,
        offset
    )
    .fetch_all(pool)
    .await?;

    metas_to_articles(metas).await
}

// 指向 `article_id` 的文章
pub async fn get_bondee_meta(
    article_id: i64,
    category_set: &[String],
) -> Fallible<impl ExactSizeIterator<Item = (Bond, ArticleMeta)>> {
    let pool = get_pool();
    let data = sqlx::query_as!(
        BondAndArticle,
        "
        SELECT DISTINCT
        a.*, abf.article_id as from, abf.value as to, abf.energy as bond_energy, abf.name, abf.id as bond_id
        FROM article_metas() a
        INNER JOIN article_bond_fields abf ON a.id = abf.value
        WHERE abf.article_id = $1
        AND category_name = ANY($2)
        ORDER BY create_time DESC
        ",
        article_id,
        &category_set
    )
    .fetch_all(pool)
    .await?;
    Ok(data.into_iter().map(|d| d.into()))
}

// `article_id` 鍵結到的文章
pub async fn get_bonder_meta(
    article_id: i64,
    category_set: &[String],
) -> Fallible<impl ExactSizeIterator<Item = (Bond, ArticleMeta)>> {
    let pool = get_pool();
    let data = sqlx::query_as!(
        BondAndArticle,
        "
        SELECT DISTINCT
        a.*, abf.article_id as from, abf.value as to, abf.energy as bond_energy, abf.name, abf.id as bond_id
        FROM  article_metas() a
        INNER JOIN article_bond_fields abf ON a.id = abf.article_id
        WHERE abf.value = $1 AND category_name = ANY($2)
        ORDER BY create_time DESC
        ",
        article_id,
        &category_set
    )
    .fetch_all(pool)
    .await?;
    Ok(data.into_iter().map(|d| d.into()))
}

pub async fn get_bonder(
    article_id: i64,
    category_set: &[String],
) -> Fallible<impl ExactSizeIterator<Item = (Bond, Article)>> {
    let iter = get_bonder_meta(article_id, category_set).await?;
    let mut bonds = Vec::<Bond>::with_capacity(iter.len());
    let metas: Vec<_> = iter
        .map(|(bond, meta)| {
            bonds.push(bond);
            meta
        })
        .collect();
    let articles = metas_to_articles(metas).await?;
    Ok(bonds.into_iter().zip(articles))
}

#[derive(Debug)]
pub struct Category {
    pub id: i64,
    pub board_id: i64,
    pub category_name: String,
    pub version: i64,
    pub source: String,
    pub create_time: chrono::DateTime<chrono::Utc>,
}
impl DBObject for Category {
    const TYPE: DataType = DataType::Category;
}

async fn get_newest_category(board_id: i64, category_name: &String) -> Fallible<Category> {
    let pool = get_pool();
    let category = sqlx::query_as!(
        Category,
        "
        SELECT * FROM categories WHERE board_id = $1 AND category_name = $2
        ORDER BY version DESC
        LIMIT 1
        ",
        board_id,
        category_name
    )
    .fetch_one(pool)
    .await?;
    Ok(category)
}

lazy_static! {
    static ref FORCE_CACHE: RwLock<HashMap<i64, Arc<force::Force>>> = RwLock::new(HashMap::new());
}

// NOTE: 實作更新看板力語言的時候，更新資料庫的同時也必須更新快取
async fn get_force(board_id: i64) -> Fallible<Arc<force::Force>> {
    let exist = {
        let cache = FORCE_CACHE.read().unwrap();
        match cache.get(&board_id) {
            None => None,
            Some(category) => Some(category.clone()),
        }
    };
    match exist {
        Some(force) => Ok(force),
        None => {
            let force = Arc::new(force::parse(&board::get_by_id(board_id).await?.force)?);
            FORCE_CACHE.write().unwrap().insert(board_id, force.clone());
            Ok(force)
        }
    }
}

async fn get_force_category(
    board_id: i64,
    category_name: &String,
) -> Fallible<Arc<force::Category>> {
    let force = get_force(board_id).await?;
    match force.categories.get(category_name) {
        Some(category) => Ok(category.clone()),
        None => {
            Err(custom_error::ErrorCode::NotFound(DataType::Category, category_name.clone()).into())
        }
    }
}

pub async fn check_bond(article_id: i64, board_id: i64, category_name: &str) -> Fallible<bool> {
    let meta = get_meta_by_id(article_id).await?;
    Ok(meta.category_name == category_name && meta.board_id == board_id)
}

pub async fn create(
    author_id: i64,
    board_id: i64,
    category_name: String,
    title: String,
    content: String,
) -> Fallible<i64> {
    // TODO: 交易？
    let pool = get_pool();
    let category = get_newest_category(board_id, &category_name).await?;
    let force_category = parse_category(&category.source)?;
    let article_id = sqlx::query!(
        "
        INSERT INTO articles (author_id, board_id, title, category_id)
        VALUES ($1, $2, $3, $4) RETURNING id
        ",
        author_id,
        board_id,
        title,
        category.id,
    )
    .fetch_one(pool)
    .await?
    .id;
    log::debug!("成功創建文章元資料");
    article_content::create(article_id, board_id, &content, force_category).await?;
    Ok(article_id)
}
