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
        board_id -> Int8,
        root_id -> Int8,
        category_id -> Int8,
        title -> Varchar,
        author_id -> Varchar,
        category_name -> Varchar,
        show_in_list -> Bool,
        create_time -> Timestamp,
    }
}

table! {
    boards (id) {
        id -> Int8,
        board_name -> Varchar,
        ruling_party_id -> Int8,
        create_time -> Timestamp,
    }
}

table! {
    categories (id) {
        id -> Int8,
        category_name -> Varchar,
        board_id -> Int8,
        body -> Varchar,
        is_active -> Bool,
        replacing -> Nullable<Int8>,
    }
}

table! {
    edges (id) {
        id -> Int8,
        from_node -> Int8,
        to_node -> Int8,
        transfuse -> Int2,
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
    parties (id) {
        id -> Int8,
        board_id -> Nullable<Int8>,
        party_name -> Varchar,
        energy -> Int4,
        chairman_id -> Varchar,
        create_time -> Timestamp,
    }
}

table! {
    party_members (id) {
        id -> Int8,
        board_id -> Nullable<Int8>,
        power -> Int2,
        dedication_ratio -> Int2,
        party_id -> Int8,
        create_time -> Timestamp,
        user_id -> Varchar,
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
        energy -> Int4,
        invitation_credit -> Int4,
        password_hashed -> Bytea,
        salt -> Bytea,
        create_time -> Timestamp,
    }
}

joinable!(array_cols -> articles (article_id));
joinable!(articles -> boards (board_id));
joinable!(articles -> categories (category_id));
joinable!(articles -> users (author_id));
joinable!(categories -> boards (board_id));
joinable!(parties -> boards (board_id));
joinable!(parties -> users (chairman_id));
joinable!(party_members -> boards (board_id));
joinable!(party_members -> parties (party_id));
joinable!(party_members -> users (user_id));
joinable!(text_cols -> articles (article_id));

allow_tables_to_appear_in_same_query!(
    array_cols,
    articles,
    boards,
    categories,
    edges,
    invitations,
    parties,
    party_members,
    text_cols,
    users,
);
