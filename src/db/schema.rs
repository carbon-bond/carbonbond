table! {
    articles (id) {
        id -> Int4,
        template_id -> Int4,
        board_id -> Int4,
        author_id -> Varchar,
        article_name -> Varchar,
    }
}

table! {
    boards (id) {
        id -> Int4,
        board_name -> Varchar,
        ruling_party_id -> Int4,
    }
}

table! {
    edges (id) {
        id -> Int4,
        from_node -> Int4,
        to_node -> Int4,
        transfuse -> Nullable<Int4>,
    }
}

table! {
    invitations (id) {
        id -> Int4,
        code -> Varchar,
        email -> Varchar,
        create_time -> Timestamp,
    }
}

table! {
    node_templates (id) {
        id -> Int4,
        board_id -> Int4,
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
