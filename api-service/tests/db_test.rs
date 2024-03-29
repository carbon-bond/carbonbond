use carbonbond::{
    api::model,
    config,
    custom_error::{DataType, ErrorCode, Fallible},
    db,
    force::{Category, Field, Force},
    redis,
};
// use force::error::{ValidationError, ValidationErrorCode};

async fn setup() {
    env_logger::init();
    std::env::set_var("MODE", "test");
    let mut child = std::process::Command::new("target/debug/dbtool")
        .args(&["reset"])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .unwrap();
    child.wait().unwrap();
    config::init(None);
    db::init().await.unwrap();
    redis::init().await.unwrap();
}

async fn user_test() -> Fallible<(i64, i64)> {
    let user_id = db::user::signup("測試人", "測試密碼", "test_email@test.com").await?;
    let user2_id = db::user::signup("超級測試人", "測試密碼", "test_email2@test.com").await?;

    let user = db::user::get_by_name("測試人").await.unwrap();
    assert_eq!(user_id, user.id);
    assert_eq!("測試人", &user.user_name);

    let code = db::user::get_by_name("測試人2")
        .await
        .unwrap_err()
        .code()
        .unwrap();
    match code {
        ErrorCode::NotFound(DataType::User, s) => (assert_eq!(s, "測試人2")),
        _ => panic!(),
    }

    db::user::login("測試人", "測試密碼")
        .await
        .expect("正確的帳密無法登入");
    db::user::login("測試人", "錯錯錯")
        .await
        .expect_err("錯誤的帳密卻能登入");
    Ok((user_id, user2_id))
}
async fn party_test(chairman_id: i64) -> Fallible<i64> {
    db::party::create("測試無法黨", None, chairman_id).await
}
async fn board_test(ruling_party_id: i64) -> Fallible<i64> {
    let force = Force {
        categories: vec![
            Category {
                name: "分類1".to_owned(),
                fields: vec![Field {
                    name: "欄位1".to_owned(),
                    kind: carbonbond::force::FieldKind::MultiLine,
                }],
            },
            Category {
                name: "分類2".to_owned(),
                fields: vec![Field {
                    name: "欄位2".to_owned(),
                    kind: carbonbond::force::FieldKind::MultiLine,
                }],
            },
        ],
        suggested_tags: Vec::new(),
    };
    let board_id = db::board::create(&model::forum::NewBoard {
        board_name: "測試板".to_string(),
        board_type: model::forum::BoardType::General,
        title: "整合測試測起來！".to_string(),
        detail: "用整合測試確保軟體品質，用戶才能在碳鍵快意論戰，嘴爆笨蛋".to_string(),
        force: force.to_owned(),
        ruling_party_id,
    })
    .await?;

    db::board::create(&model::forum::NewBoard {
        board_name: "測試板2".to_string(),
        board_type: model::forum::BoardType::General,
        title: "整合測試測起來！".to_string(),
        detail: "用整合測試確保軟體品質，用戶才能在碳鍵快意論戰，嘴爆笨蛋".to_string(),
        force: force.to_owned(),
        ruling_party_id,
    })
    .await
    .expect_err("一個政黨創兩個板？");

    Ok(board_id)
}
async fn notification_test(user_id: i64, user2_id: i64) -> Fallible {
    use model::forum::NotificationKind;
    let id = db::notification::create(
        user_id,
        NotificationKind::Follow,
        Some(true),
        Some(user2_id),
        None,
        None,
        None,
    )
    .await?;
    let notifications = db::notification::get_by_user(user_id, false).await?;
    assert_eq!(notifications.len(), 1);

    db::notification::read(&[id], user_id).await?;
    let empty = db::notification::get_by_user(user_id, false).await?;
    assert_eq!(empty.len(), 0);
    let mut notifications = db::notification::get_by_user(user_id, true).await?;
    assert_eq!(notifications.len(), 1);
    let n = notifications.pop().unwrap();
    assert_eq!(n.user2_name, Some("超級測試人".to_owned()));
    assert_eq!(n.read, true);
    assert_eq!(n.kind, NotificationKind::Follow);
    assert_eq!(n.quality, Some(true));

    Ok(())
}

async fn article_test(user_id: i64, board_id: i64) -> Fallible {
    macro_rules! post {
        ($category:expr, $title:expr, $content:expr, $bonds:expr) => {
            db::article::create(
                &model::forum::NewArticle {
                    board_id: board_id,
                    category_name: $category,
                    title: $title,
                    content: $content.to_owned(),
                    bonds: $bonds,
                    draft_id: None,
                    anonymous: false,
                },
                user_id,
            )
        };
    }
    post!(
        "分類1".to_owned(),
        "測試文章".to_owned(),
        "{\"欄位1\": \"測試內文\"}",
        Vec::new()
    )
    .await
    .unwrap();
    let articles = db::article::get_by_board_name(None, "測試板", None, 999).await?;
    assert_eq!(articles.len(), 1, "文章不是一篇");
    Ok(())
}

#[tokio::test]
async fn test_db() -> Fallible<()> {
    setup().await;
    let (user, user2) = user_test().await?;
    println!("結束用戶測試");
    let party = party_test(user).await?;
    println!("結束政黨測試");
    let board = board_test(party).await?;
    println!("結束看板測試");
    notification_test(user, user2).await?;
    println!("結束通知測試");
    article_test(user, board).await?;
    println!("結束文章測試");
    Ok(())
}
