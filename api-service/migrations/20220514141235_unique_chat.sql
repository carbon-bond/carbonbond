ALTER TABLE chat.direct_chats
ADD UNIQUE (user_id_1, user_id_2, article_id);

CREATE UNIQUE INDEX unique_direct_chats ON chat.direct_chats (user_id_1, user_id_2)
WHERE article_id IS NULL;

ALTER TABLE chat.direct_chats
ADD CHECK (user_id_1 < user_id_2);