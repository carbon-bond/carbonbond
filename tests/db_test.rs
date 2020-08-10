use carbonbond::{
    api::model,
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
    let user_id = db::user::signup("測試人", "測試密碼", "test_email@test.com").await?;

    let user = db::user::get_by_name("測試人").await.unwrap();
    assert_eq!(user_id, user.id);
    assert_eq!("測試人", &user.user_name);

    let code = db::user::get_by_name("測試人2")
        .await
        .unwrap_err()
        .code()
        .unwrap();
    assert_eq!(
        code,
        ErrorCode::NotFound(DataType::User, "測試人2".to_owned())
    );

    db::user::login("測試人", "測試密碼")
        .await
        .expect("正確的帳密無法登入");
    db::user::login("測試人", "錯錯錯")
        .await
        .expect_err("錯誤的帳密卻能登入");
    Ok(user_id)
}
async fn party_test(chairman_id: i64) -> Fallible<i64> {
    db::party::create("測試無法黨", None, chairman_id).await
}
async fn board_test(ruling_party_id: i64) -> Fallible<i64> {
    db::board::create(&model::NewBoard {
        board_name: "測試板".to_string(),
        title: "整合測試測起來！".to_string(),
        detail: "用整合測試確保軟體品質，用戶才能在碳鍵快意論戰，嘴爆笨蛋".to_string(),
        force: "".to_owned(),
        ruling_party_id,
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
