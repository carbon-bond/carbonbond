DROP TABLE invitations;
DROP TABLE reset_password;
DROP TABLE party_members;
DROP TABLE edges;
DROP TABLE article_contents;
DROP TABLE articles;
DROP TABLE categories;
DROP TABLE direct_messages;
DROP TABLE direct_chats;
DROP TABLE channel_messages;
DROP TABLE chat_channels;
DROP TABLE group_chat_members;
DROP TABLE group_chats;

ALTER TABLE boards DROP CONSTRAINT boards_ruling_party_key;

DROP TABLE parties;
DROP TABLE boards;

DROP TABLE direct_messages;
DROP TABLE direct_chats;
DROP TABLE group_chat_members;
DROP TABLE channel_messages;
DROP TABLE chat_channels;
DROP TABLE group_chats;

DROP TABLE users;
DROP TABLE images;