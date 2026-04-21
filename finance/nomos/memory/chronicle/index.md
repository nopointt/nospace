# Nomos Chronicle Index
> Append-only session log index

| # | Date | Orch | Summary |
|---|---|---|---|
| 0 | 2026-03-19 | Satoshi | Project created. Legal + instruments research. Structure L1-L4. |
| 2 | 2026-03-23 | Satoshi | Full trading infra: 4 MCP, Freqtrade Docker, 10 strategies backtested, Remizov ODE research, Contexter=income decision. |
| 3 | 2026-04-21 | Satoshi | Abandoned Docker/Freqtrade. Built Python+CCXT runner (~50MB). 3 strategies + Cramer Mode ported. 7-day paper run started on testnet. |
| 4 | 2026-04-21 | Satoshi | Runner bugfix (position tracker + virtual Cramer + 15-min cooldown). Phase 2 Dashboard specs (6 files, 10 locked decisions D-01..D-10). Testnet balance moved first time. |
| 5 | 2026-04-22 | Satoshi | **Autonomous run.** Phase 2 Waves 0-4: FastAPI backend on Hetzner (api.nomos.contexter.cc, Caddy+LE), runner migrated to docker service (D-11), Vault frontend on CF Pages (nomos.contexter.cc) reusing Contexter design system via Vite alias (D-14), API auth removed as Vault = opensource (D-15). D-12/D-13 for TLS + Caddyfile. Commits 0c7aa69 + 0476584. Waves 5/6 deferred. |
