# Disk Cleanup Guide — /nospace Workspace
> Last updated: 2026-03-19

## Principles
- Data, logic, and code are deleted LAST (lowest priority for cleanup)
- Build artifacts (node_modules, target/, dist/, .venv/) are deleted FIRST (highest priority, fully regenerable)
- Package manager caches (.bun/, .cargo/registry/, npm-cache/) are safe to clean
- Docker images can be removed if stack is not in active use (re-pull with docker-compose pull)
- NEVER delete .git/ directories
- NEVER delete memory files (nospace/development/*/memory/)
- NEVER delete .claude/ or .tlos/ directories

## Protected Files (NEVER DELETE)
- `nospace/development/harkly/branches/feat-cx-osint-pipeline/output/reviews/` — scraped research data, irreplaceable
- All source code (src/, lib/)
- All git repositories (.git/)
- All memory/knowledge files
- .ssh/ directory
- .claude/ and .tlos/ directories

## Priority Order (delete first → last)
1. Windows temp files (AppData/Local/Temp/)
2. Docker build cache (docker builder prune -f)
3. Docker stopped containers (docker container prune -f)
4. node_modules/ directories (regenerate with bun install / npm install)
5. Rust target/ directories (regenerate with cargo build)
6. Python .venv/ directories (regenerate with uv sync / pip install)
7. Package manager caches (.bun/install/cache/, AppData/Local/npm-cache/, .cargo/registry/)
8. Browser binary caches (.cache/puppeteer/)
9. ML model caches (.cache/whisper/) — re-downloads on demand
10. Docker images (docker image rm) — re-pull needed before running stack
11. Orphan Docker volumes (docker volume prune) — verify not mapped first
12. Large data files — ASK USER before deleting
13. Source code — NEVER delete without explicit user approval

## Quick Commands (Windows cmd)

### Check disk space
```cmd
wmic logicaldisk where "DeviceID='C:'" get size,freespace /format:value
```

### Clean temp files
```cmd
rmdir /s /q "%TEMP%\5ym40xmx" 2>nul
rmdir /s /q "%TEMP%\DiagOutputDir" 2>nul
```

### Clean Docker
```cmd
docker builder prune -f
docker container prune -f
docker system df
```

### Clean node_modules (find all)
```bash
find /c/Users/noadmin -type d -name "node_modules" -maxdepth 5 2>/dev/null
```

### Clean Rust targets
```bash
find /c/Users/noadmin -type d -name "target" -maxdepth 5 2>/dev/null | grep -v node_modules
```

### Clean package caches
```cmd
npm cache clean --force
rmdir /s /q "%USERPROFILE%\.bun\install\cache"
cargo cache --autoclean
```

## Size Reference (as of 2026-03-19)
| Item | Typical Size | Regen Command |
|---|---|---|
| harkly-shell/src-tauri/target/ | 3.4 GB | cargo build |
| harkly-saas/node_modules | 861 MB | bun install |
| .bun/install/cache | 914 MB | auto on next bun install |
| .cache/puppeteer/ | 674 MB | auto on next puppeteer use |
| .cache/whisper/medium.pt | 1.5 GB | auto on next whisper use |
| Docker tLOS stack images | ~13.7 GB | docker-compose pull |
| AppData/Local/Temp/ (installer junk) | ~3 GB | safe to delete anytime |
| npm-cache | 362 MB | npm cache clean --force |
| .cargo/registry + git | ~1 GB | cargo cache --autoclean |

## Agent Audit Protocol
When a disk-audit agent runs, it should:
1. Report total/free disk space
2. List all items by size (largest first)
3. Mark each as: YES (safe) / CAREFUL / ASK USER / NEVER DELETE
4. Mark `feat-cx-osint-pipeline/output/reviews/` as NEVER DELETE
5. Do NOT execute any deletion commands
6. Present commands for user to run manually
