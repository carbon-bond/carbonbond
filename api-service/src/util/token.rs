use crate::custom_error::Fallible;
use rand::{distributions::Alphanumeric, Rng};

pub fn generate_token() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect::<String>()
}

// 回傳 (salt, hash)
pub fn generate_password_hash(password: &str) -> Fallible<(Vec<u8>, Vec<u8>)> {
    let salt = rand::thread_rng().gen::<[u8; 16]>();
    let hash = argon2::hash_raw(password.as_bytes(), &salt, &argon2::Config::default())?;
    Ok((salt.to_vec(), hash))
}
