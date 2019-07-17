CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  email VARCHAR(40) NOT NULL,
  energy INT NOT NULL DEFAULT 0,
  invitation_credit INT NOT NULL DEFAULT 3,
  password_hashed BYTEA NOT NULL,
  salt BYTEA NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now(),
  UNIQUE(email)
);

CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  email VARCHAR(40) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE boards (
  id BIGSERIAL PRIMARY KEY,
  board_name VARCHAR(32) NOT NULL,
  title VARCHAR(50) NOT NULL,
  detail VARCHAR(500) NOT NULL,
  ruling_party_id BIGSERIAL NOT NULL, -- 這行有沒有辦法 reference parties(id)?
  create_time TIMESTAMP NOT NULL DEFAULT Now(),
  UNIQUE(board_name)
);

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  category_name VARCHAR(10) NOT NULL,
  board_id BIGSERIAL REFERENCES boards(id) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  replacing BIGINT REFERENCES categories (id)
  -- BIGSERIAL 無法為 NULL，所以用 BIGINT
);

CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGSERIAL REFERENCES boards(id) NOT NULL,
  root_id BIGINT NOT NULL, -- 應該要 ref 自己
  category_id BIGSERIAL REFERENCES categories(id) NOT NULL,
  title VARCHAR(50) NOT NULL,
  author_id VARCHAR(20) REFERENCES users(id) NOT NULL,
  category_name VARCHAR(7) NOT NULL, -- 加速查找用
  show_in_list BOOLEAN NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE text_cols (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGSERIAL REFERENCES articles(id) NOT NULL,
  c1 TEXT,
  c2 TEXT,
  c3 TEXT,
  c4 TEXT
);
CREATE TABLE array_cols (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGSERIAL REFERENCES articles(id) NOT NULL,
  c1 TEXT[1024],
  c2 TEXT[1024],
  c3 TEXT[1024],
  c4 TEXT[1024]
);

CREATE TABLE edges (
  id BIGSERIAL PRIMARY KEY,
  from_node BIGSERIAL REFERENCES articles(id) NOT NULL,
  to_node BIGSERIAL REFERENCES articles(id) NOT NULL,
  transfuse SMALLINT NOT NULL
);

CREATE TABLE parties (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT REFERENCES boards(id),
  party_name VARCHAR(20) NOT NULL,
  energy INT NOT NULL DEFAULT 0,
  chairman_id VARCHAR(20) REFERENCES users(id) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE party_members (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT REFERENCES boards(id),
  power SMALLINT NOT NULL, -- 0~3 的整數，表示該人在黨中的地位
  dedication_ratio SMALLINT NOT NULL, -- 10~100的整數，表示該人奉獻鍵能的比率
  party_id BIGSERIAL REFERENCES parties(id) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now(),
  user_id VARCHAR(20) REFERENCES users(id) NOT NULL
);