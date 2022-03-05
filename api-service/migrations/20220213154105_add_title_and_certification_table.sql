-- 使用者擁有的身份及認證的信箱

CREATE TABLE title_authentication_user  (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  title text NOT NULL DEFAULT '',
  UNIQUE (user_id, title)
);

CREATE INDEX title_authentication_user_index ON title_authentication_user (user_id);

CREATE TABLE title_authentication_unique_id (
  id bigserial PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  unique_id text NOT NULL DEFAULT '',
  UNIQUE (title, unique_id)
);
