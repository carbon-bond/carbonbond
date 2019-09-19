table! {
    article_contents (id) {
        id -> Int8,
        article_id -> Int8,
        str_content -> Array<Text>,
        int_content -> Array<Int4>,
    }
}

table! {
    articles (id) {
        id -> Int8,
        board_id -> Int8,
        root_id -> Int8,
        category_id -> Int8,
        title -> Text,
        author_id -> Int8,
        show_in_list -> Bool,
        create_time -> Timestamptz,
    }
}

table! {
    boards (id) {
        id -> Int8,
        board_name -> Text,
        title -> Text,
        detail -> Text,
        ruling_party_id -> Int8,
        create_time -> Timestamptz,
    }
}

table! {
    categories (id) {
        id -> Int8,
        category_name -> Text,
        board_id -> Int8,
        body -> Text,
        is_active -> Bool,
        replacing -> Nullable<Int8>,
    }
}

table! {
    channel_messages (id) {
        id -> Int8,
        chat_channel_id -> Int8,
        sender_id -> Int8,
        content -> Text,
        create_time -> Timestamp,
    }
}

table! {
    chat_channels (id) {
        id -> Int8,
        group_chat_id -> Int8,
        name -> Text,
        create_time -> Timestamp,
    }
}

table! {
    direct_chats (id) {
        id -> Int8,
        user_id_1 -> Int8,
        user_id_2 -> Int8,
        create_time -> Timestamp,
    }
}

table! {
    direct_messages (id) {
        id -> Int8,
        direct_chat_id -> Int8,
        sender_id -> Int8,
        content -> Text,
        create_time -> Timestamp,
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
    group_chat_members (id) {
        id -> Int8,
        group_chat_id -> Int8,
        member_id -> Int8,
        create_time -> Timestamp,
    }
}

table! {
    group_chats (id) {
        id -> Int8,
        name -> Text,
        upgraded -> Bool,
        create_time -> Timestamp,
    }
}

table! {
    invitations (id) {
        id -> Int8,
        code -> Varchar,
        inviter_name -> Text,
        email -> Text,
        words -> Text,
        create_time -> Timestamptz,
        is_used -> Bool,
    }
}

table! {
    parties (id) {
        id -> Int8,
        board_id -> Nullable<Int8>,
        party_name -> Text,
        energy -> Int4,
        chairman_id -> Int8,
        create_time -> Timestamptz,
    }
}

table! {
    party_members (id) {
        id -> Int8,
        board_id -> Nullable<Int8>,
        position -> Int2,
        dedication_ratio -> Int2,
        party_id -> Int8,
        create_time -> Timestamptz,
        user_id -> Int8,
    }
}

table! {
    reset_password (id) {
        id -> Int8,
        code -> Varchar,
        user_id -> Int8,
        create_time -> Timestamptz,
        is_used -> Bool,
    }
}

table! {
    users (id) {
        id -> Int8,
        name -> Text,
        email -> Text,
        energy -> Int4,
        invitation_credit -> Int4,
        password_hashed -> Bytea,
        salt -> Bytea,
        create_time -> Timestamptz,
    }
}

joinable!(article_contents -> articles (article_id));
joinable!(articles -> boards (board_id));
joinable!(articles -> categories (category_id));
joinable!(articles -> users (author_id));
joinable!(categories -> boards (board_id));
joinable!(channel_messages -> chat_channels (chat_channel_id));
joinable!(channel_messages -> users (sender_id));
joinable!(chat_channels -> group_chats (group_chat_id));
joinable!(direct_messages -> direct_chats (direct_chat_id));
joinable!(direct_messages -> users (sender_id));
joinable!(group_chat_members -> group_chats (group_chat_id));
joinable!(group_chat_members -> users (member_id));
joinable!(parties -> users (chairman_id));
joinable!(party_members -> boards (board_id));
joinable!(party_members -> parties (party_id));
joinable!(party_members -> users (user_id));
joinable!(reset_password -> users (user_id));

allow_tables_to_appear_in_same_query!(
    article_contents,
    articles,
    boards,
    categories,
    channel_messages,
    chat_channels,
    direct_chats,
    direct_messages,
    edges,
    group_chat_members,
    group_chats,
    invitations,
    parties,
    party_members,
    reset_password,
    users,
);
