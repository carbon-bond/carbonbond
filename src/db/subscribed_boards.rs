use super::{get_pool, DBObject};
use crate::api::model::BoardOverview;
use crate::custom_error::{DataType, Fallible};

impl DBObject for BoardOverview {
    const TYPE: DataType = DataType::Board;
}

pub async fn subscribe(user_id: i64, board_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO subscribed_boards (user_id, board_id) VALUES ($1, $2)",
        user_id,
        board_id,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_subscribed_boards(user_id: i64) -> Fallible<Vec<BoardOverview>> {
    let pool = get_pool();
    let records = sqlx::query!(
        "
    SELECT boards.board_name, boards.title, boards.id FROM subscribed_boards
    LEFT JOIN boards on boards.id = subscribed_boards.board_id
    WHERE subscribed_boards.user_id = $1
    ",
        user_id
    )
    .fetch_all(pool)
    .await?;
    let boards: Vec<BoardOverview> = records
        .into_iter()
        .map(|r| BoardOverview {
            id: r.id,
            board_name: r.board_name,
            title: r.title,
            popularity: 0, // XXX: 正確填入
        })
        .collect();
    Ok(boards)
}
