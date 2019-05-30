table! {
    invitations (id) {
        id -> Int4,
        code -> Varchar,
        email -> Varchar,
        create_time -> Timestamp,
    }
}

table! {
    users (id) {
        id -> Varchar,
        email -> Varchar,
        invitation_credit -> Int4,
        password_bytes -> Bytea,
        salt -> Bytea,
    }
}

allow_tables_to_appear_in_same_query!(invitations, users,);
