# Backup Plan — Stage 9
- Postgres: nightly dump (`pg_dump -Fc`)
- Redis: daily RDB snapshot (`BGSAVE`)
- Archive: `/root/backups/duelly/`
- Rotation: 7 days local, 30 days S3
- Verify checksum after upload
