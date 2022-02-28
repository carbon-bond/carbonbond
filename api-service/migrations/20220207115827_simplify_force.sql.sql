ALTER TABLE articles
DROP COLUMN category_id,
ADD fields TEXT NOT NULL,
ADD category TEXT NOT NULL;

ALTER TABLE drafts
DROP COLUMN category_id,
ADD bonds TEXT NOT NULL,
ADD category TEXT;

ALTER TABLE article_bond_fields
RENAME TO article_bonds;

DROP TABLE categories;

-- ALTER TABLE article_bonds
-- DROP COLUMN name;