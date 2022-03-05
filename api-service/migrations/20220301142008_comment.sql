-- 留言
CREATE TABLE comments (
  id bigserial PRIMARY KEY,
  author_id bigint REFERENCES users (id) NOT NULL,
  content text NOT NULL,
  article_id bigint REFERENCES articles (id) NOT NULL,
  attached_comment_id  bigint REFERENCES comments(id),
  create_time timestamptz NOT NULL DEFAULT NOW(),
  edit_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX comments_article_index ON comments (article_id);