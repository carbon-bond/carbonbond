// 時間都以 uint64 來表示 unix time

/// 每個請求／回應之前都會有一個 Meta 結構
/// 用以讓接收者者知道 "接下來的請求是什麼型別/是要回應哪一個請求"
/// 也才能夠反序列化該訊息
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ClientSendMeta {
    #[prost(int64, tag="1")]
    pub id: i64,
}
pub mod client_send_meta {
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
    #[repr(i32)]
    pub enum Direction {
        Request = 0,
        Response = 1,
    }
    /// 若爲 response ，不需要看 Type
    /// 由它對應的 request 便可知曉
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
    #[repr(i32)]
    pub enum Type {
        Send = 0,
        History = 1,
        RecentChat = 2,
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ServerSendMeta {
    #[prost(int64, tag="1")]
    pub id: i64,
}
pub mod server_send_meta {
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
    #[repr(i32)]
    pub enum Direction {
        Request = 0,
        Response = 1,
    }
    /// 若爲 response ，不需要看 Type
    /// 由它對應的 request 便可知曉
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
    #[repr(i32)]
    pub enum Type {
        Incoming = 0,
    }
}
/// 常用結構
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Message {
    /// 每則訊息在它所屬的聊天室／頻道中都有一個獨一無二的 id
    #[prost(int64, tag="1")]
    pub id: i64,
    #[prost(int64, tag="2")]
    pub sender_id: i64,
    #[prost(string, tag="3")]
    pub content: std::string::String,
    #[prost(uint64, tag="4")]
    pub time: u64,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ChannelLocation {
    #[prost(bool, tag="1")]
    pub is_upgraded: bool,
    #[prost(int64, tag="2")]
    pub channel_id: i64,
}
/// 以下 API 由伺服器端發出
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Incoming {
    #[prost(message, optional, tag="3")]
    pub message: ::std::option::Option<Message>,
    #[prost(oneof="incoming::Location", tags="1, 2")]
    pub location: ::std::option::Option<incoming::Location>,
}
pub mod incoming {
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Location {
        #[prost(message, tag="1")]
        ChannelLocation(super::ChannelLocation),
        #[prost(int64, tag="2")]
        DirectReceiverId(i64),
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IncomingResponse {
    #[prost(bool, tag="1")]
    pub ok: bool,
    #[prost(string, tag="2")]
    pub reason: std::string::String,
}
// 以下 API 由客戶端主動發出

/// websocket 一連通就發出
/// 獲取時間在 before_time 之前的 number 個對話
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct RecentChat {
    #[prost(int64, tag="1")]
    pub number: i64,
    #[prost(uint64, tag="2")]
    pub before_time: u64,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct RecentChatResponse {
    #[prost(bool, tag="1")]
    pub ok: bool,
    #[prost(string, tag="2")]
    pub reason: std::string::String,
    #[prost(message, repeated, tag="3")]
    pub chats: ::std::vec::Vec<recent_chat_response::ChatAbstract>,
}
pub mod recent_chat_response {
    /// 一個聊天室的摘要
    /// 用來顯示最近對話
    #[derive(Clone, PartialEq, ::prost::Message)]
    pub struct ChatAbstract {
        #[prost(oneof="chat_abstract::Info", tags="1, 2, 3")]
        pub info: ::std::option::Option<chat_abstract::Info>,
    }
    pub mod chat_abstract {
        #[derive(Clone, PartialEq, ::prost::Message)]
        pub struct DirectChat {
            #[prost(int64, tag="1")]
            pub direct_chat_id: i64,
            #[prost(string, tag="2")]
            pub latest_message: std::string::String,
        }
        #[derive(Clone, PartialEq, ::prost::Message)]
        pub struct GroupChat {
            #[prost(int64, tag="1")]
            pub group_chat_id: i64,
            #[prost(string, tag="2")]
            pub latest_message: std::string::String,
        }
        #[derive(Clone, PartialEq, ::prost::Message)]
        pub struct UpgradedGroupChat {
            #[prost(int64, tag="1")]
            pub group_chat_id: i64,
            #[prost(string, repeated, tag="2")]
            pub channel_names: ::std::vec::Vec<std::string::String>,
        }
        #[derive(Clone, PartialEq, ::prost::Oneof)]
        pub enum Info {
            #[prost(message, tag="1")]
            SimpleChat(DirectChat),
            #[prost(message, tag="2")]
            GroupChat(GroupChat),
            #[prost(message, tag="3")]
            UpgradedGroupChat(UpgradedGroupChat),
        }
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Send {
    #[prost(int64, tag="1")]
    pub id: i64,
    #[prost(string, tag="4")]
    pub content: std::string::String,
    #[prost(oneof="send::Location", tags="2, 3")]
    pub location: ::std::option::Option<send::Location>,
}
pub mod send {
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Location {
        #[prost(message, tag="2")]
        ChannelLocation(super::ChannelLocation),
        #[prost(int64, tag="3")]
        DirectReceiverId(i64),
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SendResponse {
    #[prost(bool, tag="1")]
    pub ok: bool,
    #[prost(string, tag="2")]
    pub reason: std::string::String,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct History {
    /// 若 before_id = -1 ，則代表請求最新的對話
    /// 每個對話都有自己的 id ，我們要拿的是在此 before_id 之前的 number 個對話
    #[prost(int64, tag="3")]
    pub before_id: i64,
    #[prost(int64, tag="4")]
    pub number: i64,
    #[prost(oneof="history::Location", tags="1, 2")]
    pub location: ::std::option::Option<history::Location>,
}
pub mod history {
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Location {
        #[prost(message, tag="1")]
        ChannelLocation(super::ChannelLocation),
        #[prost(int64, tag="2")]
        DirectReceiverId(i64),
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HistoryResponse {
    #[prost(bool, tag="1")]
    pub ok: bool,
    #[prost(string, tag="2")]
    pub reason: std::string::String,
    #[prost(message, repeated, tag="3")]
    pub messages: ::std::vec::Vec<Message>,
}
