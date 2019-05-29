CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  email VARCHAR(40) NOT NULL,
  invitation_credit INT NOT NULL DEFAULT 3,
  password_bytes BYTEA NOT NULL,
  salt BYTEA NOT NULL,
  UNIQUE(email)
)
