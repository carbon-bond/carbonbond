use crate::api::model::forum::Graph;
use crate::custom_error::Fallible;
use crate::db;
use std::collections::HashMap;

pub async fn query_graph(
    viewer_id: Option<i64>,
    count: usize,
    article_id: i64,
    category_set: Option<&[String]>,
) -> Fallible<Graph> {
    log::debug!(
        "詢問鳥瞰圖，中心點為 {}，分類為 {:?}",
        article_id,
        category_set,
    );
    let mut articles_to_expand = vec![article_id];
    let mut nodes = HashMap::new();
    let mut edges = HashMap::new();
    let meta = db::article::get_meta_by_id(article_id, viewer_id).await?;

    if category_set.map_or(false, |c| !c.contains(&meta.category)) {
        return Ok(Default::default());
    }
    nodes.insert(meta.id, meta);

    while articles_to_expand.len() > 0 && nodes.len() < count {
        log::trace!("對 {:?} 搜索", articles_to_expand);
        let mut articles_next = vec![];
        for id in articles_to_expand.into_iter() {
            let (bondee, bonder) = tokio::join!(
                db::article::get_bondee_meta(viewer_id, id, category_set),
                db::article::get_bonder_meta(viewer_id, id, category_set)
            );
            let (bondee, bonder) = (bondee?, bonder?);
            macro_rules! insert {
                ($iter:ident) => {
                    for (bond, meta) in $iter {
                        log::trace!("與 {} 相關 {:?}-{:?}", id, bond, meta);
                        edges.insert(bond.id, bond);
                        nodes.entry(meta.id).or_insert_with(|| {
                            articles_next.push(meta.id);
                            meta
                        });
                    }
                };
            }
            insert!(bondee);
            insert!(bonder);
        }
        articles_to_expand = articles_next;
    }
    Ok(Graph {
        edges: edges.into_iter().map(|(_, v)| v).collect(),
        nodes: nodes.into_iter().map(|(_, v)| v).collect(),
    })
}
