# Secrets & Environments Policy (Duelly)
- No secrets in Git. `.env` lives only on servers; `chmod 600`.
- CI secrets: only SSH deploy creds (`STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`).
- Telegram tokens / JWT / HMAC never pass through CI; rotate periodically.
- Access is least-privilege; logs never contain secrets.
- Separate envs: staging vs prod. No cross-pollination of credentials.
