-- 使用者
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  energy INT NOT NULL DEFAULT 0,
  invitation_credit INT NOT NULL DEFAULT 3,
  password_hashed BYTEA NOT NULL,
  salt BYTEA NOT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_index ON users(email);

-- 註冊邀請
CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  inviter_id BIGINT REFERENCES users(id),
  email TEXT NOT NULL,
  words TEXT NOT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX invitations_create_time_index ON invitations(create_time);

-- 看板
CREATE TABLE boards (
  id BIGSERIAL PRIMARY KEY,
  board_name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  ruling_party_id BIGINT NOT NULL,       -- 等 parties 表建立後設定爲 foreign key
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX boards_board_name_index ON boards(board_name);
CREATE INDEX boards_title_index ON boards(title);
CREATE INDEX boards_create_time_index ON boards(create_time);

-- 類別定義
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  board_id BIGINT REFERENCES boards(id) NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  replacing BIGINT REFERENCES categories (id)
);

CREATE INDEX categories_category_name_index ON categories(category_name);

-- 文章
CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT REFERENCES boards(id) NOT NULL,
  root_id BIGINT NOT NULL, -- 應該要 ref 自己
  category_id BIGINT REFERENCES categories(id) NOT NULL,
  title TEXT NOT NULL,
  author_id BIGINT REFERENCES users(id) NOT NULL,
  show_in_list BOOLEAN NOT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX articles_create_time_name_index ON articles(create_time);

-- 文章內容
CREATE TABLE article_contents (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT REFERENCES articles(id) NOT NULL,
  str_content TEXT[15] NOT NULL,
  int_content INT[15] NOT NULL
);

-- 連接關係
CREATE TABLE edges (
  id BIGSERIAL PRIMARY KEY,
  from_node BIGINT REFERENCES articles(id) NOT NULL,
  to_node BIGINT REFERENCES articles(id) NOT NULL,
  transfuse SMALLINT NOT NULL
);

-- 政黨
CREATE TABLE parties (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT REFERENCES boards(id),
  party_name TEXT NOT NULL UNIQUE,
  energy INT NOT NULL DEFAULT 0,
  chairman_id BIGINT REFERENCES users(id) NOT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX parties_party_name_index ON parties(party_name);
CREATE INDEX parties_create_time_index ON parties(create_time);
ALTER TABLE boards ADD CONSTRAINT boards_ruling_party_key FOREIGN KEY (ruling_party_id) REFERENCES parties(id);

-- 政黨成員
CREATE TABLE party_members (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT REFERENCES boards(id),
  position SMALLINT NOT NULL, -- 0~3 的整數，表示該人在黨中的地位
  dedication_ratio SMALLINT NOT NULL, -- 10~100的整數，表示該人奉獻鍵能的比率
  party_id BIGINT REFERENCES parties(id) NOT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT REFERENCES users(id) NOT NULL
);

CREATE INDEX party_members_create_time_index ON party_members(create_time);

CREATE TABLE direct_chats (
  id BIGSERIAL PRIMARY KEY,
  user_id_1 BIGINT REFERENCES users(id) NOT NULL,
  user_id_2 BIGINT REFERENCES users(id) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE direct_messages (
  id BIGSERIAL PRIMARY KEY,
  direct_chat_id BIGINT REFERENCES direct_chats(id) NOT NULL,
  sender_id BIGINT REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE group_chats (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  upgraded BOOLEAN NOT NULL DEFAULT false,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE group_chat_members (
  id BIGSERIAL PRIMARY KEY,
  group_chat_id BIGINT REFERENCES group_chats(id) NOT NULL,
  member_id BIGINT REFERENCES users(id) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE chat_channels (
  id BIGSERIAL PRIMARY KEY,
  group_chat_id BIGINT REFERENCES group_chats(id) NOT NULL,
  name TEXT NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE channel_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_channel_id BIGINT REFERENCES chat_channels(id) NOT NULL,
  sender_id BIGINT REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);
