ALTER TABLE articles
ADD fields TEXT NOT NULL,
ADD category TEXT NOT NULL;

ALTER TABLE article_bond_fields
RENAME TO article_bonds;

-- ALTER TABLE article_bonds
-- DROP COLUMN name;