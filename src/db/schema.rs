table! {
    array_cols (id) {
        id -> Int8,
        article_id -> Int8,
        c1 -> Nullable<Array<Text>>,
        c2 -> Nullable<Array<Text>>,
        c3 -> Nullable<Array<Text>>,
        c4 -> Nullable<Array<Text>>,
    }
}

table! {
    articles (id) {
        id -> Int8,
        title -> Varchar,
        root_id -> Int8,
        author_id -> Varchar,
        template_id -> Int8,
        board_id -> Int8,
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
        transfuse -> Int4,
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
        is_active -> Bool,
        replacing -> Nullable<Int8>,
    }
}

table! {
    parties (id) {
        id -> Int8,
        board_id -> Nullable<Int8>,
        party_name -> Varchar,
    }
}

table! {
    text_cols (id) {
        id -> Int8,
        article_id -> Int8,
        c1 -> Nullable<Text>,
        c2 -> Nullable<Text>,
        c3 -> Nullable<Text>,
        c4 -> Nullable<Text>,
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

joinable!(array_cols -> articles (article_id));
joinable!(articles -> boards (board_id));
joinable!(articles -> node_templates (template_id));
joinable!(articles -> users (author_id));
joinable!(node_templates -> boards (board_id));
joinable!(parties -> boards (board_id));
joinable!(text_cols -> articles (article_id));

allow_tables_to_appear_in_same_query!(
    array_cols,
    articles,
    boards,
    edges,
    invitations,
    node_templates,
    parties,
    text_cols,
    users,
);
