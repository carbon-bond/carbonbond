ALTER TABLE users
ADD COLUMN api_key_hashed bytea DEFAULT NULL,
ADD COLUMN api_key_tail varchar(5) DEFAULT NULL,
ADD COLUMN is_robot boolean NOT NULL DEFAULT FALSE;

ALTER TYPE notification_kind ADD VALUE 'mention';

CREATE TABLE webhooks (
  id bigserial PRIMARY KEY,
  target_url text NOT NULL,
  secrect varchar(32) NOT NULL DEFAULT ''
);

CREATE TABLE registered_webhook_events (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  event_set notification_kind,
  webhook_id bigint REFERENCES webhooks (id) NOT NULL
);
