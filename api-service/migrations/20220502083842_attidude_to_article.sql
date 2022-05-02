CREATE TABLE attitude_to_articles (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  article_id bigint REFERENCES articles (id) NOT NULL,
  attitude BOOLEAN NOT NULL,
  UNIQUE (user_id, article_id)
);

ALTER TABLE articles
ADD good bigint NOT NULL DEFAULT (0),
ADD bad bigint NOT NULL DEFAULT (0);