-- Add migration script here

ALTER TABLE chat.direct_chats
ADD read_time_1 timestamptz NOT NULL DEFAULT NOW(),
ADD read_time_2 timestamptz NOT NULL DEFAULT NOW(),
ADD last_message bigint REFERENCES chat.direct_messages (id) NULL;
