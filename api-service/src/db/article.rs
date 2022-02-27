use super::{article_content, get_pool, DBObject};
use crate::api::model::forum::{
    Article, ArticleMeta, ArticleMetaWithBonds, BondArticleMeta, Edge, FamilyFilter, NewArticle,
    SearchField,
};
use crate::custom_error::{DataType, ErrorCode, Fallible};
use crate::service;
use chrono::{DateTime, Utc};
use force;
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
                fields,
                board_id,
                board_name,
                category,
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
            category: $data.category,
            category_id: $data.category_id,
            category_name: $data.category_name,
            category_source: $data.category_source,
            category_families: $data.category_families,
            title: $data.title,
            fields: serde_json::from_str(&$data.fields).unwrap(),
            author: if $data.anonymous && $viewer_id == Some($data.author_id) {
                crate::api::model::forum::Author::MyAnonymous
            } else if $data.anonymous {
                crate::api::model::forum::Author::Anonymous
            } else {
                crate::api::model::forum::Author::NamedAuthor {
                    name: $data.author_name,
                    id: $data.author_id,
                }
            },
            create_time: $data.create_time,
            digest: crate::api::model::forum::ArticleDigest {
                content: $data.digest_content,
                truncated: $data.digest_truncated,
            },
            stat: Default::default(),
            personal_meta: Default::default(),
        }
    };
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
    let mut ids = Vec::new();
    for meta in &metas {
        ids.push(meta.id);
    }
    let contents = article_content::get_by_article_ids(ids).await?;
    Ok(metas
        .into_iter()
        .zip(contents.into_iter())
        .map(|(meta, content)| Article {
            meta,
            content,
            bonds: vec![],
        }))
}

pub async fn add_bond_to_metas(
    metas: Vec<ArticleMeta>,
    viewer_id: Option<i64>,
) -> Fallible<Vec<ArticleMetaWithBonds>> {
    let mut ids = Vec::new();
    for meta in &metas {
        ids.push(meta.id);
    }
    let bonds = article_content::get_bonds_by_article_ids(ids, viewer_id).await?;
    Ok(metas
        .into_iter()
        .zip(bonds.into_iter())
        .map(|(meta, bonds)| ArticleMetaWithBonds { meta, bonds })
        .collect())
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
        crate::api::model::forum::PrimitiveArticleMeta,
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
        crate::api::model::forum::PrimitiveArticleMeta,
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
        crate::api::model::forum::PrimitiveArticleMeta,
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
    let content = article_content::get_by_article_id(meta.id).await?;
    Ok(Article {
        meta,
        content,
        bonds: vec![],
    })
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
        crate::api::model::forum::PrimitiveArticleMeta,
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
    let metas = metas.into_iter().map(move |d| to_meta!(d, viewer_id));
    Ok(metas)
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
        crate::api::model::forum::BondArticleMeta,
        "
        DISTINCT ab.article_id as from, ab.value as to,
        ab.energy as bond_energy, ab.name as bond_name, ab.id as bond_id, ab.tag as bond_tag, 
        ",
        "
        INNER JOIN article_bonds ab on metas.id = ab.value
        WHERE ab.article_id = $3
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
        crate::api::model::forum::BondArticleMeta,
        "
        DISTINCT ab.article_id as from, ab.value as to,
        ab.energy as bond_energy, ab.name as bond_name, ab.id as bond_id, ab.tag as bond_tag, 
        ",
        "
        INNER JOIN article_bonds ab ON metas.id = ab.article_id
        WHERE ab.value = $3
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

pub async fn get_category(board_id: i64, category: &str) -> Fallible<crate::force::Category> {
    let pool = get_pool();
    let force = sqlx::query!(
        "
        SELECT force FROM boards WHERE id = $1
        ",
        board_id,
    )
    .fetch_one(pool)
    .await?
    .force;
    let force: crate::force::Force = serde_json::from_str(&force).unwrap();
    for c in force.categories {
        if c.name == category {
            return Ok(c);
        }
    }
    Err(ErrorCode::NotFound(DataType::Category, category.to_string()).into())
}

lazy_static! {
    static ref FORCE_CACHE: RwLock<HashMap<i64, Arc<force::Force>>> = RwLock::new(HashMap::new());
}

pub async fn create(new_article: &NewArticle, author_id: i64) -> Fallible<i64> {
    let content: Value = serde_json::from_str(&new_article.content).map_err(|err| {
        ErrorCode::ParsingJson
            .context("文章內容反序列化失敗")
            .context(err)
    })?;

    let category = get_category(new_article.board_id, &new_article.category_name).await?;
    let mut conn = get_pool().begin().await?;
    let article_id = sqlx::query!(
        "
        INSERT INTO articles (author_id, board_id, title, category_id, anonymous, category, fields)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        ",
        author_id,
        new_article.board_id,
        new_article.title,
        1, // FIXME: 捨棄 category 表格
        new_article.anonymous,
        new_article.category_name,
        serde_json::to_string(&category.fields).unwrap()
    )
    .fetch_one(&mut conn)
    .await?
    .id;
    log::debug!("成功創建文章元資料");

    if let Some(draft_id) = new_article.draft_id {
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
        Cow::Borrowed(&content),
        &new_article.bonds,
        &category,
    )
    .await?;

    conn.commit().await?;
    service::hot_articles::set_hot_article_score(article_id).await?;
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
