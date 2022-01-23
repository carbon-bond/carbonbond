ALTER TABLE user_relations
ADD is_public boolean NOT NULL
DEFAULT (false);

UPDATE user_relations
SET kind = 'follow' WHERE kind = 'openly_follow';

UPDATE user_relations
SET kind = 'hate' WHERE kind = 'openly_hate';

-- In this migration we just deprecate 'openly_follow' and 'openly_hate' while keeping them in ENUM user_relation_kind.
-- Or we could create new ENUM and drop the old one if needed.
-- https://stackoverflow.com/questions/25811017/how-to-delete-an-enum-type-value-in-postgres
