ALTER TABLE chat.direct_chats
ADD article_id bigint REFERENCES articles (id) NULL
DEFAULT (NULL);