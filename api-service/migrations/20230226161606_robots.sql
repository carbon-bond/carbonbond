ALTER TABLE users
ADD COLUMN api_key_hashed bytea DEFAULT NULL,
ADD COLUMN api_key_tail varchar(5) DEFAULT NULL,
ADD COLUMN is_robot boolean NOT NULL DEFAULT FALSE;

ALTER TYPE notification_kind ADD VALUE 'mention';

CREATE TABLE webhooks (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  target_url text NOT NULL,
  secret varchar(32) NOT NULL DEFAULT '',
  create_time timestamptz NOT NULL DEFAULT NOW()
  -- event_set notification_kind,
);
