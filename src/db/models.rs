use super::schema::*;
use chrono::{DateTime, offset::Utc};

#[derive(Queryable)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub energy: i32,
    pub invitation_credit: i32,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub name: &'a str,
    pub email: &'a str,
    pub invitation_credit: i32,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
}

#[derive(Queryable)]
pub struct Invitation {
    pub id: i64,
    pub code: String,
    pub inviter_name: String,
    pub email: String,
    pub words: String,
    pub create_time: DateTime<Utc>,
    pub is_used: bool,
}

#[derive(Insertable)]
#[table_name = "invitations"]
pub struct NewInvitation<'a> {
    pub code: &'a str,
    pub inviter_name: &'a str,
    pub email: &'a str,
    pub words: &'a str,
}

#[derive(Queryable)]
pub struct Party {
    pub id: i64,
    pub board_id: Option<i64>,
    pub party_name: String,
    pub energy: i32,
    pub chairman_id: i64,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "parties"]
pub struct NewParty<'a> {
    pub board_id: Option<i64>,
    pub party_name: &'a str,
    pub chairman_id: i64,
}

#[derive(Queryable)]
pub struct Board {
    pub id: i64,
    pub board_name: String,
    pub title: String,
    pub detail: String,
    pub ruling_party_id: i64,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "boards"]
pub struct NewBoard<'a> {
    pub board_name: &'a str,
    pub title: &'a str,
    pub detail: &'a str,
    pub ruling_party_id: i64,
}

#[derive(Queryable)]
pub struct Category {
    pub id: i64,
    pub category_name: String,
    pub board_id: i64,
    pub body: String,
    pub is_active: bool,
    pub replacing: Option<i64>,
}

#[derive(Insertable)]
#[table_name = "categories"]
pub struct NewCategory<'a> {
    pub board_id: i64,
    pub category_name: &'a str,
    pub body: String,
}

#[derive(Queryable)]
pub struct Edge {
    pub id: i64,
    pub from_node: i64,
    pub to_node: i64,
    pub transfuse: i16,
}

#[derive(Insertable)]
#[table_name = "edges"]
pub struct NewEdge {
    pub from_node: i64,
    pub to_node: i64,
    pub transfuse: i16,
}

#[derive(Queryable, Debug)]
pub struct Article {
    pub id: i64,
    pub board_id: i64,
    pub root_id: i64,
    pub category_id: i64,
    pub title: String,
    pub author_id: i64,
    pub show_in_list: bool,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "articles"]
pub struct NewArticle<'a> {
    pub board_id: i64,
    pub root_id: i64,
    pub category_id: i64,
    pub author_id: i64,
    pub title: &'a str,
    pub show_in_list: bool,
}

#[derive(Queryable, Debug)]
pub struct ArticleContent {
    pub id: i64,
    pub article_id: i64,
    pub str_content: Vec<String>,
    pub int_content: Vec<i32>,
}

#[derive(Insertable)]
#[table_name = "article_contents"]
pub struct NewArticleContent {
    pub article_id: i64,
    pub str_content: Vec<String>,
    pub int_content: Vec<i32>,
}

#[derive(Queryable)]
pub struct PartyMember {
    pub id: i64,
    pub board_id: Option<i64>,
    pub position: i16,
    pub dedication_ratio: i16,
    pub party_id: i64,
    pub create_time: DateTime<Utc>,
    pub user_id: i64,
}

#[derive(Insertable)]
#[table_name = "party_members"]
pub struct NewPartyMember {
    pub board_id: Option<i64>,
    pub position: i16,
    pub dedication_ratio: i16,
    pub party_id: i64,
    pub user_id: i64,
}

#[derive(Queryable, Debug)]
pub struct DirectChat {
    pub id: i64,
    // 限制 id_1 < id_2
    pub user_id_1: i64,
    pub user_id_2: i64,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "direct_chats"]
pub struct NewDirectChat {
    pub user_id_1: i64,
    pub user_id_2: i64,
}

#[derive(Queryable, Debug)]
pub struct DirectMessage {
    pub id: i64,
    pub direct_chat_id: i64,
    pub sender_id: i64,
    pub content: String,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "direct_messages"]
pub struct NewDirectMessage {
    pub direct_chat_id: i64,
    pub sender_id: i64,
    pub content: String,
}

#[derive(Queryable, Debug)]
pub struct GroupChat {
    pub id: i64,
    pub name: String,
    // 表示是否已被升級爲有頻道的羣組
    // 爲了實作方便，創建 ChatGroup 的時候，會創建一個預設的頻道指向它
    // 也就是說，還沒升級的羣組一樣會有一個頻道，但可以此布林值來判定它是否有被升級過
    pub upgraded: bool,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "group_chats"]
pub struct NewGroupChat {
    pub name: String,
    pub upgraded: bool,
}

#[derive(Queryable, Debug)]
pub struct GroupChatMember {
    pub id: i64,
    pub group_chat_id: i64,
    pub member_id: i64,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "group_chat_members"]
pub struct NewGroupChatMember {
    pub group_chat_id: i64,
    pub member_id: i64,
}

#[derive(Queryable, Debug)]
pub struct ChatChannel {
    pub id: i64,
    pub group_chat_id: i64,
    pub name: String,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "chat_channels"]
pub struct NewChatChannel {
    pub group_chat_id: i64,
    pub name: String,
}

#[derive(Queryable, Debug)]
pub struct ChannelMessage {
    pub id: i64,
    pub chat_channel_id: i64,
    pub sender_id: i64,
    pub content: String,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "channel_messages"]
pub struct NewChannelMessage {
    pub chat_channel_id: i64,
    pub sender_id: i64,
    pub content: String,
}
