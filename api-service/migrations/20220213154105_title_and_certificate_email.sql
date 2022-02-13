-- 使用者有擁有的身份及認證的信箱

CREATE TABLE title_authentication  (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  title text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  UNIQUE (user_id, title)
);
