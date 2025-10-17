CREATE EXTENSION IF NOT EXISTS "pgcrypto";
INSERT INTO "User"("id","createdAt","telegramId","username","firstName","lastName")
VALUES
  (gen_random_uuid(), now(), 1001, 'seedA', NULL, NULL),
  (gen_random_uuid(), now(), 1002, 'seedB', NULL, NULL)
ON CONFLICT ("telegramId") DO NOTHING;
