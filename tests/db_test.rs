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

#[tokio::test]
async fn user_test() -> Fallible<()> {
    setup().await;
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
    Ok(())
}
