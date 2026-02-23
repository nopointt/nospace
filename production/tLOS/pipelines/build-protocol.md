# REPRODUCIBLE BUILD PROTOCOL
> Pipeline: tLOS Kernel & Actors
> Enforcer: DevOps Lead + Release Swarm
> Tags: [build, reproducible, consensus, tLOS, wasm]

---

## § 1 — Обоснование 

В децентрализованной сети tLOS консенсус строится на криптографических хэшах бинарников (WASM-компонентов). Если исходный код одинаковый, но у двух разработчиков получились разные хэши — сеть рассинхронизируется (Netsplit).

Сборка ДОЛЖНА быть детерминированной (Reproducible Build). 

## § 2 — Требования к окружению (The Snapshot)

Сборка происходит только в фиксированном окружении, параметры которого записываются в `reproducibility.lock` для каждого релиза. Зависеть от локальной среды сборщика ЗАПРЕЩЕНО.

- **Rust Version:** `nightly-2026-02-15` (жестко зафиксирована)
- **Target:** `wasm32-wasip2`
- **Wasmtime Version:** `17.0.0`
- **Compiler Flags:**
  - `codegen-units = 1`
  - `lto = "fat"`
  - `panic = "abort"`
  - `strip = "debuginfo"`

## § 3 — Протокол сборки (Build Swarm)

1. **Clean Workspace:** Сборщик вытягивает код во временную RAM-mount директорию. Использование кэша `target/` от предыдущих сборок запрещено.
2. **Lock Verification:** Проверка `Cargo.lock`. Если хэши зависимостей не совпадают с ожидаемыми — остановка сборки.
3. **Compilation:** Выполнение флагов из § 2.
4. **WASM Opt:** Прогон через `wasm-opt -Oz --enable-reference-types --enable-bulk-memory`. Версия `wasm-opt` фиксируется в `.lock`.
5. **WASM Strip:** Удаление кастомных секций (имен локальных путей, timestamps), которые могут нарушить детерминированность.

## § 4 — Генерация Артефактов

В директорию `/production/tLOS/artifacts/core-v<X.Y.Z>/` складывается:

1. Скомпилированный бинарник (`tlos-kernel.wasm`).
2. Файл `checksums.sha256`, содержащий SHA-256 хэш бинарника.
3. Файл `reproducibility.lock` — полный дамп `rustc -Vv`, флагов ОС сборщика и версий утилит, чтобы любой узел в P2P сети мог воспроизвести этот `.wasm` и сверить SHA-256.

## § 5 — Sanity Check

DevOps Lead ОБЯЗАН:
1. Запросить у второго (изолированного) сборщика повторную компиляцию по `reproducibility.lock`.
2. Сверить `checksums.sha256`.
3. Только при строгом равенстве `1 == 2` релиз считается готовым к публикации.

---

## § 6 — Security Gates (LLM03: Supply Chain Mitigation)

Security gates выполняются **до** компиляции (§3) и являются блокирующими. Провал любого gate = остановка сборки + эскалация к DevOps Lead.

### Gate 1 — Dependency Audit (cargo audit)

```bash
# Выполняется в изолированной сборочной среде перед cargo build
cargo audit --deny warnings --deny unmaintained --deny unsound

# Результат пишется в артефакты
cargo audit --json > /production/tLOS/artifacts/core-v<X.Y.Z>/audit-report.json
```

- ЗАПРЕЩЕНО игнорировать (`--ignore`) advisory без ADR, одобренного Senior Architect.
- Unmaintained crates блокируют сборку наравне с уязвимостями.
- Advisory database обновляется при каждом запуске (online fetch или pre-pulled snapshot с верифицированным хэшем).

### Gate 2 — Base Image Digest Pin

Docker-образ сборочной среды ДОЛЖЕН быть зафиксирован по digest, не по тегу:

```dockerfile
# ПРАВИЛЬНО — immutable, верифицируемо
FROM rust:1.77.0@sha256:<verified-digest>

# ЗАПРЕЩЕНО — тег мутабелен, может быть подменён
FROM rust:nightly-slim
```

- Digest вносится в `reproducibility.lock` рядом с версиями Rust и wasm-opt.
- Обновление digest = новый ADR или запись в episodic-log + повторный Sanity Check (§5).

### Gate 3 — SBOM Generation

```bash
# Генерация Software Bill of Materials при каждом релизе
cargo cyclonedx --format json --output /production/tLOS/artifacts/core-v<X.Y.Z>/sbom.json
```

SBOM публикуется вместе с артефактом. Позволяет узлам сети tLOS верифицировать состав бинарника.

### Gate Failure Protocol

```
Gate fail → DevOps Lead получает alert
          → Сборка останавливается (exit non-zero)
          → Запись в /memory/logs/system/build-gate-fail-<date>.md
          → Деплой заблокирован до устранения
```
