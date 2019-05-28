table! {
    users (id) {
        id -> Varchar,
        invitation_credit -> Int4,
        password_bytes -> Bytea,
        salt -> Bytea,
    }
}
