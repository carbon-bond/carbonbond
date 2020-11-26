use crate::api::model::ArticleMeta;
use crate::custom_error::Fallible;
use crate::db;
use std::collections::HashSet;

async fn query_related(article_id: i64, category_set: &[String]) -> Fallible<Vec<ArticleMeta>> {
    let mut metas = db::article::get_bondee_meta(article_id, &category_set).await?;
    let mut metas2 = db::article::get_bonder_meta(article_id, &category_set).await?;
    metas.append(&mut metas2); // XXX: 能不能省一次 DB
    Ok(metas)
}

pub async fn query_graph(
    count: usize,
    article_id: i64,
    category_set: &[String],
) -> Fallible<Vec<ArticleMeta>> {
    let mut seen = HashSet::<i64>::new();
    let mut articles_to_expand = vec![article_id];
    let mut graph = vec![];
    while articles_to_expand.len() > 0 && graph.len() < count {
        log::trace!("對 {:?} 搜索", articles_to_expand);
        let mut articles_next = vec![];
        for id in articles_to_expand.into_iter() {
            let metas = query_related(id, category_set).await?;
            log::trace!("{} 搜到關聯 {:?}", id, metas);
            for meta in metas.into_iter() {
                if !seen.contains(&meta.id) {
                    seen.insert(meta.id);
                    articles_next.push(meta.id);
                    graph.push(meta);
                }
            }
        }
        articles_to_expand = articles_next;
    }
    Ok(graph)
}
