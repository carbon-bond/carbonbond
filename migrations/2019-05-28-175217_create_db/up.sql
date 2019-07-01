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
  ruling_party_id BIGSERIAL,
  UNIQUE(board_name)
);

CREATE TABLE node_templates (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGSERIAL NOT NULL,
  def VARCHAR(1000) NOT NULL
);

CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGSERIAL,
  board_id BIGSERIAL NOT NULL,
  author_id VARCHAR(20) NOT NULL,
  article_name VARCHAR(50) NOT NULL
);

CREATE TABLE edges (
  id BIGSERIAL PRIMARY KEY,
  from_node BIGSERIAL NOT NULL,
  to_node BIGSERIAL NOT NULL,
  transfuse INT
);