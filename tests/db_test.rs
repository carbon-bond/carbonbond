use carbonbond::{
    config,
    custom_error::{DataType, ErrorCode, Fallible},
    db,
};

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
}

async fn user_test() -> Fallible<i64> {
    let user_id = db::user::create(&db::user::User {
        name: "測試人".to_string(),
        email: "test_email@test.com".to_string(),
        sentence: "一句話".to_string(),
        password_hashed: vec![1, 2, 3],
        salt: vec![4, 5, 6],
        ..Default::default()
    })
    .await?;

    let user = db::user::get_by_name("測試人").await.unwrap();
    assert_eq!(user_id, user.id);
    assert!(user.create_time.is_some());
    assert_eq!(user.password_hashed, vec![1, 2, 3]);
    assert_eq!(user.salt, vec![4, 5, 6]);

    let code = db::user::get_by_name("測試人2")
        .await
        .err()
        .unwrap()
        .code()
        .unwrap();
    assert_eq!(
        code,
        ErrorCode::NotFound(DataType::User, "測試人2".to_owned())
    );
    Ok(user_id)
}
async fn party_test(chairman_id: i64) -> Fallible<i64> {
    db::party::create(&db::party::Party {
        party_name: "測試無法黨".to_string(),
        chairman_id,
        ..Default::default()
    })
    .await
}
async fn board_test(ruling_party_id: i64) -> Fallible<i64> {
    db::board::create(&db::board::Board {
        board_name: "測試板".to_string(),
        title: "整合測試測起來！".to_string(),
        detail: "用整合測試確保軟體品質，用戶才能在碳鍵快意論戰，嘴爆笨蛋".to_string(),
        ruling_party_id,
        ..Default::default()
    })
    .await
}

#[tokio::test]
async fn test_db() -> Fallible<()> {
    setup().await;
    let user = user_test().await?;
    let party = party_test(user).await?;
    let _board = board_test(party).await?;
    Ok(())
}
