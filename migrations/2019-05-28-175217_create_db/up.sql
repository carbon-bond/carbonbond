CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  email VARCHAR(40) NOT NULL,
  invitation_credit INT NOT NULL DEFAULT 3,
  password_bytes BYTEA NOT NULL,
  salt BYTEA NOT NULL,
  UNIQUE(email)
)

CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  email VARCHAR(40) NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT Now()
)