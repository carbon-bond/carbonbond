-- 草稿
CREATE TABLE drafts (
  id bigserial PRIMARY KEY,
  author_id bigint REFERENCES users (id) NOT NULL,
  board_id bigint REFERENCES boards (id) NOT NULL,
  category_id bigint REFERENCES categories (id),
  title text NOT NULL,
  content text NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW(),
  edit_time timestamptz NOT NULL DEFAULT NOW()
);