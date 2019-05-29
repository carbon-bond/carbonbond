table! {
    users (id) {
        id -> Varchar,
        email -> Varchar,
        invitation_credit -> Int4,
        password_bytes -> Bytea,
        salt -> Bytea,
    }
}
