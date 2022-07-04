CREATE TABLE claim_title_tokens (
  user_id bigint REFERENCES users (id) NOT NULL,
  token text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  license_id text NOT NULL,
  email text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX claim_title_tokens_token_index ON claim_title_tokens(token);

ALTER TABLE signup_tokens
DROP COLUMN gender,
DROP COLUMN birth_year,
DROP COLUMN license_id;