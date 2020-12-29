use carbonbond::{
    api::model,
    config,
    custom_error::{BondError, DataType, Error, ErrorCode, Fallible},
    db,
};
use force::error::{ValidationError, ValidationErrorCode};

async fn setup() {
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
    env_logger::init();
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
    let force = "
大文章 {
    文本 內文
}
小留言 @ [衛星] {
    鍵結[大文章] 本體
}";
    db::board::create(&model::NewBoard {
        board_name: "測試板".to_string(),
        title: "整合測試測起來！".to_string(),
        detail: "用整合測試確保軟體品質，用戶才能在碳鍵快意論戰，嘴爆笨蛋".to_string(),
        force: force.to_owned(),
        ruling_party_id,
    })
    .await
}
async fn notification_test(user_id: i64, user2_id: i64) -> Fallible {
    use model::NotificationKind;
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
    let post = |category: &str, title: &str, content: &str| {
        db::article::create(
            user_id,
            board_id,
            category.to_owned(),
            title.to_owned(),
            content.to_owned(),
        )
    };
    let big_id = post("大文章", "測試大文章", "{\"內文\": \"測試內文\"}")
        .await
        .unwrap();
    let satellite_id = post(
        "小留言",
        "會通過",
        &format!(
            "{{ \"本體\": {{ \"target_article\": {}, \"energy\": 1 }} }}",
            big_id
        ),
    )
    .await
    .unwrap();
    let res = post(
        "小留言",
        "會通過才有鬼",
        &format!(
            "{{ \"本體\": {{ \"target_article\": {}, \"energy\": 1 }} }}",
            satellite_id
        ),
    )
    .await;

    fn unwrap_bond_err<T>(res: Result<T, Error>) -> BondError {
        if let Err(Error::LogicError {
            code:
                ErrorCode::ForceValidate(ValidationError {
                    code: ValidationErrorCode::Other(e),
                    ..
                }),
            ..
        }) = res
        {
            return e;
        }
        panic!();
    }

    match unwrap_bond_err(res) {
        BondError::TargetViolateCategory => (),
        _ => panic!(),
    }

    let res = post(
        "小留言",
        "會通過才有鬼2",
        &format!("{{ \"本體\": {{ \"target_article\": 99999, \"energy\": 1 }} }}"),
    )
    .await;
    match unwrap_bond_err(res) {
        BondError::TargetNotFound => (),
        _ => panic!(),
    }

    let articles =
        db::article::get_by_board_name("測試板", 0, 999, &model::FamilyFilter::None).await?;
    assert_eq!(articles.len(), 2, "文章不是兩篇！？");
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
