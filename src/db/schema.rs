table! {
    articles (id) {
        id -> Int8,
        template_id -> Int8,
        board_id -> Int8,
        author_id -> Varchar,
        article_name -> Varchar,
    }
}

table! {
    boards (id) {
        id -> Int8,
        board_name -> Varchar,
        ruling_party_id -> Int8,
    }
}

table! {
    edges (id) {
        id -> Int8,
        from_node -> Int8,
        to_node -> Int8,
        transfuse -> Nullable<Int4>,
    }
}

table! {
    invitations (id) {
        id -> Int8,
        code -> Varchar,
        email -> Varchar,
        create_time -> Timestamp,
    }
}

table! {
    node_templates (id) {
        id -> Int8,
        board_id -> Int8,
        def -> Varchar,
    }
}

table! {
    users (id) {
        id -> Varchar,
        email -> Varchar,
        invitation_credit -> Int4,
        password_hashed -> Bytea,
        salt -> Bytea,
    }
}

allow_tables_to_appear_in_same_query!(
    articles,
    boards,
    edges,
    invitations,
    node_templates,
    users,
);
