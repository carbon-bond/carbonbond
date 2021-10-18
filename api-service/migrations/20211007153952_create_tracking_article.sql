-- 追蹤
CREATE TABLE tracking_articles (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  article_id bigint REFERENCES articles (id) NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, article_id)
);
