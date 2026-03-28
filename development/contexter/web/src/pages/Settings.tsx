import { createSignal, createResource, Show, type Component } from "solid-js"
import { useNavigate } from "@solidjs/router"
import Nav from "../components/Nav"
import Button from "../components/Button"
import Toast, { showToast } from "../components/Toast"
import { listDocuments, API_BASE } from "../lib/api"
import { auth, getToken, isAuthenticated, setAuth } from "../lib/store"

/* ── progress bar ── */
function ProgressBar(props: { value: number; max: number }) {
  const pct = () => Math.min(100, (props.value / props.max) * 100)
  return (
    <div class="w-full h-1 bg-bg-elevated">
      <div class="h-full bg-accent transition-all" style={{ width: `${pct()}%` }} />
    </div>
  )
}

/* ── usage card with progress bar ── */
function UsageCard(props: {
  label: string
  value: number
  max: number
  loading?: boolean
}) {
  return (
    <div class="border border-border-subtle bg-bg-surface p-6 flex flex-col gap-3">
      <Show
        when={!props.loading}
        fallback={
          <span class="inline-block w-3 h-3 border border-text-tertiary border-t-transparent animate-spin" />
        }
      >
        <span class="text-[24px] font-bold text-text-primary leading-none">
          {props.value} / {props.max}
        </span>
        <ProgressBar value={props.value} max={props.max} />
      </Show>
      <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
        {props.label}
      </span>
    </div>
  )
}

/* ── main page ── */
const Settings: Component = () => {
  const navigate = useNavigate()
  const token = () => getToken() ?? ""

  /* ── documents data ── */
  const [docsData] = createResource(
    () => (isAuthenticated() ? token() : null),
    (t) =>
      t
        ? listDocuments(t)
        : Promise.resolve({ documents: [], totalChunks: 0 }),
  )

  /* ── derived stats ── */
  const docCount = () => docsData()?.documents?.length ?? 0
  const chunkCount = () => docsData()?.totalChunks ?? 0

  /* ── delete all state ── */
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      showToast("Все данные удалены", "success")
      setShowDeleteConfirm(false)
      navigate("/dashboard")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Не удалось удалить — попробуйте ещё раз", "error")
    } finally {
      setDeleting(false)
    }
  }

  /* ── logout ── */
  const handleLogout = () => {
    setAuth(null)
    navigate("/")
  }

  /* ── format last login date ── */
  const lastLogin = () => {
    const now = new Date()
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ]
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
  }

  /* ── truncated user id ── */
  const truncatedId = () => {
    const id = auth()?.userId
    if (!id) return "\u2014"
    return id.length > 10 ? id.slice(0, 10) + "..." : id
  }

  /* ── not authenticated ── */
  if (!isAuthenticated()) {
    return (
      <div class="min-h-screen bg-bg-canvas">
        <Nav variant="app" />
        <div class="w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-24">
          <div class="flex flex-col items-center gap-6 text-center">
            <p class="text-text-secondary text-sm">
              Войдите, чтобы управлять настройками
            </p>
            <Button variant="primary" onClick={() => navigate("/upload")}>
              Войти
            </Button>
          </div>
        </div>
        <Toast />
      </div>
    )
  }

  return (
    <div class="min-h-screen bg-bg-canvas">
      <Nav variant="app" />

      <div class="w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-12">
        {/* ── page header ── */}
        <h1 class="text-[24px] font-bold leading-[1.2] text-text-primary mb-2">
          Настройки
        </h1>
        <p class="text-text-secondary text-xs mb-12">
          Профиль, лимиты и управление данными
        </p>

        {/* ══════════════════════════════════════════════
            section 1: profile
           ══════════════════════════════════════════════ */}
        <section class="mb-16">
          <div class="flex items-baseline justify-between mb-6">
            <h2 class="text-[20px] font-medium leading-[1.2] text-text-primary">
              Профиль
            </h2>
            <span class="text-xs text-text-tertiary">
              Последний вход: {lastLogin()}
            </span>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
                email
              </span>
              <span class="text-sm text-text-primary font-medium">
                {auth()?.email || "\u2014"}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
                id
              </span>
              <span class="text-xs text-text-tertiary">
                {truncatedId()}
              </span>
            </div>
          </div>
        </section>

        {/* ── divider ── */}
        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ══════════════════════════════════════════════
            section 2: usage with progress bars
           ══════════════════════════════════════════════ */}
        <section class="mb-16">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UsageCard
              label="Документы"
              value={docCount()}
              max={50}
              loading={docsData.loading}
            />
            <UsageCard
              label="Фрагменты"
              value={chunkCount()}
              max={500}
              loading={docsData.loading}
            />
            <UsageCard
              label="Запросы"
              value={0}
              max={100}
            />
          </div>
        </section>

        {/* ── divider ── */}
        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ══════════════════════════════════════════════
            section 3: danger zone
           ══════════════════════════════════════════════ */}
        <section>
          <div class="border border-signal-error p-6 flex flex-col gap-6">
            {/* delete all data */}
            <div class="flex flex-col gap-3">
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1">
                  <h3 class="text-sm font-bold text-text-primary">
                    Удалить все данные
                  </h3>
                  <p class="text-xs text-text-secondary">
                    Удалит все файлы и базу знаний. Это нельзя отменить.
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Удалить
                </Button>
              </div>

              {/* confirm dialog */}
              <Show when={showDeleteConfirm()}>
                <div class="border border-signal-error bg-signal-error/5 p-4 flex flex-col gap-4">
                  <p class="text-xs text-text-primary font-bold">
                    Удалить все файлы и базу знаний? Это нельзя отменить.
                  </p>
                  <div class="flex items-center gap-3">
                    <Button
                      variant="danger"
                      onClick={handleDeleteAll}
                      loading={deleting()}
                    >
                      Подтвердить удаление
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </Show>
            </div>

            {/* ── divider inside danger zone ── */}
            <div class="w-full border-t border-signal-error/20" />

            {/* logout */}
            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1">
                <h3 class="text-sm font-bold text-text-primary">
                  Выйти
                </h3>
                <p class="text-xs text-text-secondary">
                  Сессия завершится на этом устройстве
                </p>
              </div>
              <Button variant="ghost" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Toast />
    </div>
  )
}

export default Settings
