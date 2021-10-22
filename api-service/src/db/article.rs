use super::{article_content, get_pool, DBObject};
use crate::api::model::{
    Article, ArticleMeta, BondArticleMeta, Edge, FamilyFilter, Favorite, FavoriteArticleMeta,
    SearchField,
};
use crate::custom_error::{self, DataType, ErrorCode, Fallible};
use crate::db::board;
use chrono::{DateTime, Utc};
use force;
use force::parse_category;
use lazy_static::lazy_static;
use serde_json::Value;
use sqlx::PgConnection;
use std::borrow::Cow;
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::RwLock;

// XXX: 密切關注 sqlx user defined macro
macro_rules! metas {
    ($structure:path, $select:literal, $remain:literal, $is_black_list:expr, $family_filter:expr, $($arg:expr),*) => {
        sqlx::query_as!(
            $structure,
            "WITH metas AS (SELECT
                articles.*,
                users.user_name AS author_name,
                boards.board_name,
                categories.category_name,
                categories.source AS category_source,
                categories.families AS category_families
            FROM
                articles
                INNER JOIN users ON articles.author_id = users.id
                INNER JOIN boards ON articles.board_id = boards.id
                INNER JOIN categories ON articles.category_id = categories.id
            WHERE ($1 AND NOT categories.families && $2)
                OR (NOT $1 AND categories.families && $2)
                )
            SELECT "
                + $select
                + " metas.id,
                metas.energy,
                board_id,
                board_name,
                category_id,
                category_name,
                category_source,
                title,
                author_id,
                author_name,
                digest AS digest_content,
                digest_truncated,
                category_families,
                metas.create_time,
                anonymous FROM metas "
                + $remain,
            $is_black_list,
            $family_filter,
            $($arg),*
        )
    };
}

macro_rules! to_meta {
    ($data: expr, $viewer_id: expr) => {
        ArticleMeta {
            id: $data.id,
            energy: $data.energy,
            board_id: $data.board_id,
            board_name: $data.board_name,
            category_id: $data.category_id,
            category_name: $data.category_name,
            category_source: $data.category_source,
            category_families: $data.category_families,
            title: $data.title,
            author: if $data.anonymous && $viewer_id == Some($data.author_id) {
                crate::api::model::Author::MyAnonymous
            } else if $data.anonymous {
                crate::api::model::Author::Anonymous
            } else {
                crate::api::model::Author::NamedAuthor {
                    name: $data.author_name,
                    id: $data.author_id,
                }
            },
            create_time: $data.create_time,
            digest: crate::api::model::ArticleDigest {
                content: $data.digest_content,
                truncated: $data.digest_truncated,
            },
            stat: Default::default(),
            personal_meta: Default::default(),
        }
    };
}

pub fn to_favorite(data: FavoriteArticleMeta, viewer_id: Option<i64>) -> Favorite {
    Favorite {
        create_time: data.favorite_create_time,
        meta: to_meta!(data, viewer_id),
    }
}
fn to_bond_and_meta(data: BondArticleMeta, viewer_id: Option<i64>) -> (Edge, ArticleMeta) {
    (
        Edge {
            from: data.from,
            to: data.to,
            energy: data.bond_energy,
            name: data.bond_name,
            tag: data.bond_tag,
            id: data.bond_id,
        },
        to_meta!(data, viewer_id),
    )
}

const EMPTY_SET: &[String] = &[];

fn filter_tuple(filter: &FamilyFilter) -> (bool, &[String]) {
    match filter {
        FamilyFilter::BlackList(f) => (true, f),
        FamilyFilter::WhiteList(f) => (false, f),
        FamilyFilter::None => (true, EMPTY_SET),
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
    viewer_id: Option<i64>,
    author_name: Option<String>,
    board_name: Option<String>,
    category: Option<i64>,
    content: HashMap<String, SearchField>,
    end_time: Option<DateTime<Utc>>,
    start_time: Option<DateTime<Utc>>,
    title: Option<String>,
) -> Fallible<Vec<ArticleMeta>> {
    let pool = get_pool();
    let metas: Vec<ArticleMeta> = metas!(
        crate::api::model::PrimitiveArticleMeta,
        "",
        "
        WHERE ($3 OR board_name = $4)
        AND ($5 OR (author_name = $6 AND (anonymous = false OR author_id = $7)))
        AND ($8 OR category_id = $9)
        AND ($10 OR create_time < $11)
        AND ($12 OR create_time > $13)
        AND ($14 OR title ~ $15)
        ORDER BY create_time DESC
        ",
        true,
        EMPTY_SET,
        board_name.is_none(),
        board_name,
        author_name.is_none(),
        author_name.unwrap_or_default(),
        viewer_id,
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
    .await?
    .into_iter()
    .map(|d| to_meta!(d, viewer_id))
    .collect();
    // // XXX: 用不定長 sql 優化之
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
    Ok(metas)
}

pub async fn get_meta_by_id(id: i64, viewer_id: Option<i64>) -> Fallible<ArticleMeta> {
    let pool = get_pool();
    let meta = metas!(
        crate::api::model::PrimitiveArticleMeta,
        "",
        "WHERE id = $3",
        true,
        EMPTY_SET,
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(ErrorCode::NotFound(DataType::Article, id.to_string()).to_err())?;
    Ok(to_meta!(meta, viewer_id))
}

pub async fn get_meta_by_ids(ids: Vec<i64>, viewer_id: Option<i64>) -> Fallible<Vec<ArticleMeta>> {
    let pool = get_pool();
    let metas = metas!(
        crate::api::model::PrimitiveArticleMeta,
        "",
        "WHERE id = ANY($3) ORDER BY create_time DESC",
        true,
        EMPTY_SET,
        &ids[..]
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|d| to_meta!(d, viewer_id))
    .collect();
    Ok(metas)
}

pub async fn get_by_id(id: i64, viewer_id: Option<i64>) -> Fallible<Article> {
    let meta = get_meta_by_id(id, viewer_id).await?;
    let category = get_force_category(meta.board_id, &meta.category_name).await?;
    let content = article_content::get_by_article_id(meta.id, &category).await?;
    Ok(Article { meta, content })
}

pub async fn get_author_by_id(id: i64) -> Fallible<i64> {
    let pool = get_pool();
    let author_id = sqlx::query!(
        "
        SELECT author_id FROM articles WHERE id = $1
        ",
        id,
    )
    .fetch_one(pool)
    .await?
    .author_id;
    Ok(author_id)
}

pub async fn get_by_board_name(
    viewer_id: Option<i64>,
    board_name: &str,
    max_id: Option<i64>,
    limit: usize,
    family_filter: &FamilyFilter,
) -> Fallible<impl ExactSizeIterator<Item = ArticleMeta>> {
    let pool = get_pool();
    let family_filter = filter_tuple(family_filter);
    let metas = metas!(
        crate::api::model::PrimitiveArticleMeta,
        "",
        "
        WHERE board_name = $3 AND ($5 OR id < $6)
        ORDER BY create_time DESC
        LIMIT $4
        ",
        family_filter.0,
        family_filter.1,
        board_name,
        limit as i64,
        max_id.is_none(),
        max_id.unwrap_or_default()
    )
    .fetch_all(pool)
    .await?;
    Ok(metas.into_iter().map(move |d| to_meta!(d, viewer_id)))
}

// `article_id` 指向的文章
pub async fn get_bondee_meta(
    viewer_id: Option<i64>,
    article_id: i64,
    category_set: Option<&[String]>,
    family_filter: &FamilyFilter,
) -> Fallible<impl ExactSizeIterator<Item = (Edge, ArticleMeta)>> {
    let pool = get_pool();
    let family_filter = filter_tuple(family_filter);
    let data = metas!(
        crate::api::model::BondArticleMeta,
        "
        DISTINCT abf.article_id as from, abf.value as to,
        abf.energy as bond_energy, abf.name as bond_name, abf.id as bond_id, abf.tag as bond_tag, 
        ",
        "
        INNER JOIN article_bond_fields abf on metas.id = abf.value
        WHERE abf.article_id = $3
        AND ($4 OR category_name = ANY($5))
        ORDER BY create_time DESC
        ",
        family_filter.0,
        family_filter.1,
        article_id,
        category_set.is_none(),
        category_set.unwrap_or(EMPTY_SET)
    )
    .fetch_all(pool)
    .await?;
    Ok(data
        .into_iter()
        .map(move |d| to_bond_and_meta(d, viewer_id)))
}

// 指向 `article_id` 的文章
pub async fn get_bonder_meta(
    viewer_id: Option<i64>,
    article_id: i64,
    category_set: Option<&[String]>,
    family_filter: &FamilyFilter,
) -> Fallible<impl ExactSizeIterator<Item = (Edge, ArticleMeta)>> {
    let pool = get_pool();
    let family_filter = filter_tuple(family_filter);
    let data = metas!(
        crate::api::model::BondArticleMeta,
        "
        DISTINCT abf.article_id as from, abf.value as to,
        abf.energy as bond_energy, abf.name as bond_name, abf.id as bond_id, abf.tag as bond_tag, 
        ",
        "
        INNER JOIN article_bond_fields abf ON metas.id = abf.article_id
        WHERE abf.value = $3
        AND ($4 OR category_name = ANY($5))
        ORDER BY create_time DESC
        ",
        family_filter.0,
        family_filter.1,
        article_id,
        category_set.is_none(),
        category_set.unwrap_or(EMPTY_SET)
    )
    .fetch_all(pool)
    .await?;
    Ok(data
        .into_iter()
        .map(move |d| to_bond_and_meta(d, viewer_id)))
}

pub async fn get_bonder(
    viewer_id: Option<i64>,
    article_id: i64,
    category_set: Option<&[String]>,
    family_filter: &FamilyFilter,
) -> Fallible<impl ExactSizeIterator<Item = (Edge, Article)>> {
    let iter = get_bonder_meta(viewer_id, article_id, category_set, family_filter).await?;
    let mut bonds = Vec::<Edge>::with_capacity(iter.len());
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
    pub families: Vec<String>,
    pub create_time: chrono::DateTime<chrono::Utc>,
}
impl DBObject for Category {
    const TYPE: DataType = DataType::Category;
}

pub async fn get_newest_category(board_id: i64, category_name: &str) -> Fallible<Category> {
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

// FIXME: 實作更新看板力語言的時候，更新資料庫的同時也必須更新快取
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

pub async fn create(
    author_id: i64,
    board_id: i64,
    category_name: &str,
    title: &str,
    content: String,
    draft_id: Option<i64>,
    anonymous: bool,
) -> Fallible<i64> {
    let content: Value = serde_json::from_str(&content).map_err(|err| {
        ErrorCode::ParsingJson
            .context("文章內容反序列化失敗")
            .context(err)
    })?;

    let category = get_newest_category(board_id, category_name).await?;
    let force_category = parse_category(&category.source)?;
    let mut conn = get_pool().begin().await?;
    let article_id = sqlx::query!(
        "
        INSERT INTO articles (author_id, board_id, title, category_id, anonymous)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
        ",
        author_id,
        board_id,
        title,
        category.id,
        anonymous,
    )
    .fetch_one(&mut conn)
    .await?
    .id;
    log::debug!("成功創建文章元資料");

    if let Some(draft_id) = draft_id {
        sqlx::query!(
            "
        DELETE FROM drafts
        WHERE id = $1
        ",
            draft_id
        )
        .execute(&mut conn)
        .await?;
    }

    article_content::create(
        &mut conn,
        article_id,
        board_id,
        Cow::Borrowed(&content),
        &force_category,
    )
    .await?;

    let digest = crate::util::create_article_digest(content, force_category)?;
    sqlx::query!(
        "UPDATE articles SET digest = $1, digest_truncated = $2 where id = $3",
        digest.content,
        digest.truncated,
        article_id
    )
    .execute(&mut conn)
    .await?;

    conn.commit().await?;
    Ok(article_id)
}

pub(super) async fn update_energy(conn: &mut PgConnection, id: i64, energy: i16) -> Fallible {
    sqlx::query!(
        "UPDATE articles SET energy = energy + $1 WHERE id = $2",
        energy as i32,
        id
    )
    .execute(conn)
    .await?;
    Ok(())
}
