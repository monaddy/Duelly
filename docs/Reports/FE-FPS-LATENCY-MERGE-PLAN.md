# DUELLY — Merge Plan (Frontend FPS/Latency PR)

**Repo:** monaddy/Duelly  
**Base:** main  
**Feature Branch:** feat/fps-latency-observability-stub  
**PR Link:** https://github.com/monaddy/Duelly/pull/new/feat/fps-latency-observability-stub  

## Recommended Merge (GitHub UI)
1) Open PR: https://github.com/monaddy/Duelly/pull/new/feat/fps-latency-observability-stub
2) Ensure checks pass; confirm status: **APPROVED**.
3) Merge strategy: **Squash & merge** (preferred) or **Merge commit**.
4) Delete remote branch after merge (checkbox in UI).

## CLI (if needed; run locally in repo)
```bash
git fetch origin
git checkout main
git pull --ff-only
git merge --no-ff origin/feat/fps-latency-observability-stub -m "feat(fe): FPS overlay & latency observability"
git push origin main
git push origin :feat/fps-latency-observability-stub   # delete remote feature branch
```

## Post-Merge
- Update staging build and verify `?dev=1` overlay + p95 logs.
- Close any HOLD_FOR_APPROVAL gates for FE Stage 5.
