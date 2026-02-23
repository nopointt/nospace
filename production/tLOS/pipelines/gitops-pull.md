# AGENTIC GITOPS PROTOCOL (Pull-based architecture)
# Architecture: Continuous Agentic & Continuous Deployment (CACD)
# Scope: /production/*/manifests/
# Enforcer: DevOps Lead + DStorage Archivists
---

## § 1 — Фундаментальный разрыв (The Airgap)

CI/CD конвейер (сборка) **ФИЗИЧЕСКИ ОТДЕЛЕН** от инфраструктуры (раздачи). 
Сборщики (Build Swarm) имеют доступ к базам кода и компилятору, но **НЕ ИМЕЮТ ПРАВА ПУША** на сервера tLOS или в Web3 Mainnet. 
Это архитектурная аксиома Agentic Runtime (ARK) 2026 года.

## § 2 — Инверсия контроля (Pull-model)

Вместо `git push` или `ftp upload` мы используем Pull-модель.

1. **Build Phase (Внутри изолированного контура):**
   - Build Swarm производит `tlos-kernel.wasm`.
   - DevOps Lead верифицирует хэши.
   - DStorage Archivist заливает артефакт в Arweave (децентрализованное хранилище). Арвейв возвращает CID (Content Identifier).
   - DevOps Lead записывает этот CID в файл манифеста: `/production/tLOS/manifests/d-storage/arweave-cids.yaml`.
   - На этом работа DevOps Lead ЗАКАНЧИВАЕТСЯ. Он никуда ничего не деплоит.

2. **Deploy Phase (Снаружи):**
   - Узлы реле tLOS (Release Relays) или конечные устройства (tLOS Mac) подписаны на изменения папки `/manifests/`.
   - Как только они видят новый `arweave-cids.yaml`, они сами, по своей инициативе (PULL), скачивают файл по CID, проверяют подпись DevOps Lead и перезагружают ядро. 

## § 3 — Формат Манифеста

Манифесты — это единственный Source of Truth для продакшена.
Если `/production` удален — сеть нельзя обновить, пока не будет восстановлен стейт.

**Файл: `/manifests/d-storage/arweave-cids.yaml`**
```yaml
releases:
  - version: "v1.2.0"
    component: "tlos-kernel"
    cid: "ar://BxH7...Yx9z"
    sha256: "e3b0c442...855"
    signed_by: "devops-lead_key_id_44"
    timestamp: "2026-02-22T12:00:00Z"
    status: "active"
```

## § 4 — Rollback (Автоматический откат)

Если SRE Lead фиксирует `P0 Incident` (Падение сети, рассинхрон) сразу после обновления манифеста:
1. SRE Lead мгновенно меняет статус проблемного CID на `status: "revoked"` в манифесте.
2. Ноды по pull-протоколу видят revoke и **АВТОМАТИЧЕСКИ** откатываются на предыдущий `active` CID из истории манифеста.
3. Участие человека не требуется. Скорость реакции — 60 секунд.
