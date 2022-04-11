ALTER TABLE comments
ADD anonymous boolean NOT NULL
DEFAULT (false);
