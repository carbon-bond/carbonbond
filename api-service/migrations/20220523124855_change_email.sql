CREATE TABLE change_email (
  id bigserial PRIMARY KEY,
  token varchar(32) NOT NULL,
  user_id bigint REFERENCES users (id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW(),
  is_used boolean NOT NULL DEFAULT FALSE,
  email text
);