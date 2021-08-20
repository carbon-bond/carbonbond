DROP TABLE invitations;
DROP TABLE signup_invitations;

-- 邀請額度
CREATE TABLE invitation_credits (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id) NOT NULL,
  event_name TEXT NOT NULL,
  credit int NOT NULL,
  create_time timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE signup_tokens
ADD COLUMN inviter_id bigint REFERENCES users (id), -- 發出邀請者的 id ，若自行註冊，其值爲 NULL
ADD COLUMN is_used boolean NOT NULL DEFAULT FALSE;
