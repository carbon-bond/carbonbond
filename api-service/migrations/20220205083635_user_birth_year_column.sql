-- Add migration script here

ALTER TABLE users
ADD birth_year int NOT NULL
DEFAULT (0);
