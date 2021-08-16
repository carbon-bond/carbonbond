CREATE SCHEMA chat;

CREATE TABLE chat.direct_chats (
  id bigserial PRIMARY KEY,
  user_id_1 bigint REFERENCES users (id) NOT NULL,
  user_id_2 bigint REFERENCES users (id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE chat.direct_messages (
  id bigserial PRIMARY KEY,
  direct_chat_id bigint REFERENCES chat.direct_chats (id) NOT NULL,
  sender_id bigint REFERENCES users (id) NOT NULL,
  content text NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
  -- read_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat.group_chats (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  upgraded boolean NOT NULL DEFAULT FALSE,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE chat.group_chat_members (
  id bigserial PRIMARY KEY,
  group_chat_id bigint REFERENCES chat.group_chats (id) NOT NULL,
  member_id bigint REFERENCES users (id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE chat.chat_channels (
  id bigserial PRIMARY KEY,
  group_chat_id bigint REFERENCES chat.group_chats (id) NOT NULL,
  name text NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE chat.channel_messages (
  id bigserial PRIMARY KEY,
  chat_channel_id bigint REFERENCES chat.chat_channels (id) NOT NULL,
  sender_id bigint REFERENCES users (id) NOT NULL,
  content text NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

