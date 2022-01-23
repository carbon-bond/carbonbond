-- Add migration script here
ALTER TABLE signup_tokens
ADD gender text NOT NULL
DEFAULT ('other');

ALTER TABLE signup_tokens
ADD birth_year int NOT NULL
DEFAULT (1900);

ALTER TABLE signup_tokens
ADD license_id text NOT NULL
DEFAULT ('');
