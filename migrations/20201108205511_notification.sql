CREATE TYPE notification_kind AS ENUM (
  'follow',
  'hate'
);

CREATE TABLE notifications (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  user2_id bigint REFERENCES users (id),
  board_id bigint REFERENCES boards (id),
  article_id bigint REFERENCES boards (id),
  kind notification_kind NOT NULL,
  quality bool, -- NULL 表中性，true 表捷報，false 表惡耗
  read bool NOT NULL DEFAULT FALSE,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

