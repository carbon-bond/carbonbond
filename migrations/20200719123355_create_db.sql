-- 圖片
CREATE TABLE images (
  id bigserial PRIMARY KEY,
  raw_data bytea NOT NULL
);

-- 使用者
CREATE TABLE users (
  id bigserial PRIMARY KEY,
  user_name text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  sentence text NOT NULL DEFAULT '',
  introduction text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  job text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  avatar bigint REFERENCES images (id) NULL,
  password_hashed bytea NOT NULL,
  salt bytea NOT NULL,
  energy bigint NOT NULL DEFAULT 0,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

-- 註冊用
CREATE TABLE signup_tokens (
  token text NOT NULL PRIMARY KEY,
  email text NOT NULL UNIQUE,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_index ON users (email);

-- 註冊邀請
CREATE TABLE invitations (
  id bigserial PRIMARY KEY,
  code varchar(32) NOT NULL,
  inviter_name text NOT NULL,
  email text NOT NULL,
  words text NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW(),
  is_used boolean NOT NULL DEFAULT FALSE
);

CREATE INDEX invitations_create_time_index ON invitations (create_time);

CREATE TABLE reset_password (
  id bigserial PRIMARY KEY,
  code varchar(32) NOT NULL,
  user_id bigint REFERENCES users (id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW(),
  is_used boolean NOT NULL DEFAULT FALSE
);

-- 看板
CREATE TABLE boards (
  id bigserial PRIMARY KEY,
  board_name text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  force text NOT NULL DEFAULT '',
  ruling_party_id bigint NOT NULL, -- 等 parties 表建立後設定爲 foreign key
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX boards_board_name_index ON boards (board_name);

CREATE INDEX boards_title_index ON boards (title);

CREATE INDEX boards_create_time_index ON boards (create_time);

-- 類別定義
CREATE TABLE categories (
  id bigserial PRIMARY KEY,
  board_id bigint REFERENCES boards (id) NOT NULL,
  category_name text NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  source text NOT NULL,
  families text[] NOT NULL DEFAULT '{}',
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX categories_category_name_index ON categories (category_name);

-- 文章
CREATE TABLE articles (
  id bigserial PRIMARY KEY,
  author_id bigint REFERENCES users (id) NOT NULL,
  board_id bigint REFERENCES boards (id) NOT NULL,
  category_id bigint REFERENCES categories (id) NOT NULL,
  title text NOT NULL,
  digest text NOT NULL DEFAULT '',
  energy int NOT NULL DEFAULT 0,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX articles_create_time_name_index ON articles (create_time);

-- 文章內容
CREATE TABLE article_string_fields (
  id bigserial PRIMARY KEY,
  article_id bigint REFERENCES articles (id) NOT NULL,
  name text NOT NULL,
  value text NOT NULL
);

CREATE TABLE article_int_fields (
  id bigserial PRIMARY KEY,
  article_id bigint REFERENCES articles (id) NOT NULL,
  name text NOT NULL,
  value bigint NOT NULL
);

CREATE TABLE article_bond_fields (
  id bigserial PRIMARY KEY,
  article_id bigint REFERENCES articles (id) NOT NULL,
  name text NOT NULL,
  energy smallint NOT NULL DEFAULT 0,
  value bigint REFERENCES articles (id) NOT NULL
);

-- 政黨
CREATE TABLE parties (
  id bigserial PRIMARY KEY,
  board_id bigint REFERENCES boards (id),
  party_name text NOT NULL UNIQUE,
  energy int NOT NULL DEFAULT 0,
  ruling boolean NOT NULL DEFAULT FALSE,
  -- chairman_id BIGINT REFERENCES users(id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX parties_party_name_index ON parties (party_name);

CREATE INDEX parties_create_time_index ON parties (create_time);

ALTER TABLE boards
  ADD CONSTRAINT boards_ruling_party_key FOREIGN KEY (ruling_party_id) REFERENCES parties (id);

CREATE TABLE subscribed_boards (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id),
  board_id bigint REFERENCES boards (id),
  create_time timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, board_id)
);

-- 政黨成員
CREATE TABLE party_members (
  id bigserial PRIMARY KEY,
  -- board_id BIGINT REFERENCES boards(id),
  -- position SMALLINT NOT NULL, -- 0~3 的整數，表示該人在黨中的地位
  -- dedication_ratio SMALLINT NOT NULL, -- 10~100的整數，表示該人奉獻鍵能的比率
  party_id bigint REFERENCES parties (id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW(),
  user_id bigint REFERENCES users (id) NOT NULL
);

CREATE INDEX party_members_create_time_index ON party_members (create_time);

CREATE TYPE user_relation_kind AS ENUM (
  'follow',
  'hate',
  'openly_hate'
);

CREATE TABLE user_relations (
  id bigserial PRIMARY KEY,
  from_user bigint REFERENCES users (id) NOT NULL,
  to_user bigint REFERENCES users (id) NOT NULL,
  kind user_relation_kind NOT NULL,
  UNIQUE (from_user, to_user)
);

-- 收藏
CREATE TABLE favorite_articles (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  article_id bigint REFERENCES articles (id) NOT NULL,
  UNIQUE (user_id, article_id)
);

