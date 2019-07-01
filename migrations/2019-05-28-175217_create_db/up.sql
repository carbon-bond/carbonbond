CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  email VARCHAR(40) NOT NULL,
  invitation_credit INT NOT NULL DEFAULT 3,
  password_hashed BYTEA NOT NULL,
  salt BYTEA NOT NULL,
  UNIQUE(email)
);

CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  email VARCHAR(40) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
);

CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  board_name VARCHAR(32) NOT NULL,
  ruling_party_id SERIAL,
  UNIQUE(board_name)
);

CREATE TABLE node_templates (
  id SERIAL PRIMARY KEY,
  board_id SERIAL NOT NULL,
  def VARCHAR(1000) NOT NULL
);

CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  template_id SERIAL,
  board_id SERIAL NOT NULL,
  author_id VARCHAR(20) NOT NULL,
  article_name VARCHAR(50) NOT NULL,
);

CREATE TABLE edges (
  id SERIAL PRIMARY KEY,
  from_node SERIAL NOT NULL,
  to_node SERIAL NOT NULL,
  transfuse INT
);