use crate::api::model::Graph;
use crate::custom_error::Fallible;
use crate::db;
use std::collections::{HashMap, HashSet};

pub async fn query_graph(
    count: usize,
    article_id: i64,
    category_set: &[String],
) -> Fallible<Graph> {
    let mut articles_to_expand = vec![article_id];
    let mut nodes = HashMap::new();
    let mut edges = HashSet::new();
    let meta = db::article::get_meta_by_id(article_id).await?;
    if category_set.contains(&meta.category_name) {
        nodes.insert(meta.id, meta);
    } else {
        return Ok(Default::default());
    }
    while articles_to_expand.len() > 0 && nodes.len() < count {
        log::trace!("對 {:?} 搜索", articles_to_expand);
        let mut articles_next = vec![];
        for id in articles_to_expand.into_iter() {
            let bondee = db::article::get_bondee_meta(id, &category_set).await?;
            let bonder = db::article::get_bonder_meta(id, &category_set).await?;
            macro_rules! insert {
                ($meta:ident) => {
                    nodes.entry($meta.id).or_insert_with(|| {
                        articles_next.push($meta.id);
                        $meta
                    });
                };
            }

            for meta in bondee.into_iter() {
                edges.insert((meta.id, id));
                insert!(meta);
            }
            for meta in bonder.into_iter() {
                edges.insert((id, meta.id));
                insert!(meta);
            }
        }
        articles_to_expand = articles_next;
    }
    Ok(Graph {
        nodes: nodes.into_iter().map(|(_, v)| v).collect(),
        edges: edges.into_iter().collect(),
    })
}
