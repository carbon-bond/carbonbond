table! {
    users (id) {
        id -> Varchar,
        recommend_credit -> Int4,
        password_bytes -> Bytea,
        salt -> Bytea,
    }
}
