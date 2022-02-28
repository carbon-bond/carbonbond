ALTER TABLE articles
ADD fields TEXT NOT NULL,
ADD category TEXT NOT NULL;

ALTER TABLE drafts
DROP COLUMN category_id,
ADD bonds TEXT NOT NULL,
ADD category TEXT;

ALTER TABLE article_bond_fields
RENAME TO article_bonds;

-- ALTER TABLE article_bonds
-- DROP COLUMN name;