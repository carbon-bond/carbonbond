ALTER TABLE articles
ADD anonymous boolean NOT NULL
DEFAULT (false);

ALTER TABLE drafts
ADD anonymous boolean NOT NULL
DEFAULT (false);