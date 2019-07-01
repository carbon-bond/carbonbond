CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  email VARCHAR(40) NOT NULL,
  invitation_credit INT NOT NULL DEFAULT 3,
  password_hashed BYTEA NOT NULL,
  salt BYTEA NOT NULL,
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
  ruling_party_id BIGSERIAL NOT NULL, -- 這行有沒有辦法 reference parties(id)?
  UNIQUE(board_name)
);

CREATE TABLE node_templates (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGSERIAL REFERENCES boards(id) NOT NULL,
  def VARCHAR(1000) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  replacing BIGINT REFERENCES node_templates (id)
  -- BIGSERIAL 無法為 NULL，所以用 BIGINT
);

CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGSERIAL REFERENCES node_templates(id) NOT NULL,
  board_id BIGSERIAL REFERENCES boards(id) NOT NULL,
  author_id VARCHAR(20) REFERENCES users(id) NOT NULL,
  article_name VARCHAR(50) NOT NULL
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
  transfuse INT NOT NULL
);

CREATE TABLE parties (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGSERIAL REFERENCES boards(id),
  party_name VARCHAR(20) NOT NULL
);

