import { createSignal, createResource, Show, type Component } from "solid-js"
import { useNavigate } from "@solidjs/router"
import Nav from "../components/Nav"
import Button from "../components/Button"
import Toast, { showToast } from "../components/Toast"
import { listDocuments, API_BASE } from "../lib/api"
import { auth, getToken, isAuthenticated, setAuth } from "../lib/store"
import { t } from "../lib/i18n"

/* ── tier limits (UI display only — no backend enforcement for doc/chunk/query counts) ── */
const TIER_LIMITS = {
  free: { docs: 50, chunks: 500, queries: 100 },
  starter: { docs: 500, chunks: 5000, queries: 1000 },
  pro: { docs: 2500, chunks: 25000, queries: Infinity },
  business: { docs: Infinity, chunks: Infinity, queries: Infinity },
}

type TierKey = keyof typeof TIER_LIMITS

/* ── progress bar ── */
function ProgressBar(props: { value: number; max: number }) {
  const pct = () => props.max === Infinity ? 0 : Math.min(100, (props.value / props.max) * 100)
  return (
    <div class="w-full h-1 bg-bg-elevated">
      <div class="h-full bg-accent transition-all" style={{ width: `${pct()}%` }} />
    </div>
  )
}

/* ── usage card ── */
function UsageCard(props: { label: string; value: number; max: number; loading?: boolean }) {
  return (
    <div class="border border-border-subtle bg-bg-surface p-6 flex flex-col gap-3">
      <Show
        when={!props.loading}
        fallback={<span class="inline-block w-3 h-3 border border-text-tertiary border-t-transparent animate-spin" />}
      >
        <span class="text-[24px] font-bold text-text-primary leading-none">
          {props.value} / {props.max === Infinity ? "∞" : props.max}
        </span>
        <Show when={props.max !== Infinity}>
          <ProgressBar value={props.value} max={props.max} />
        </Show>
      </Show>
      <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
        {props.label}
      </span>
    </div>
  )
}

/* ── profile field ── */
function ProfileField(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div class="flex flex-col gap-1">
      <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
        {props.label}
      </span>
      <span class={`text-[14px] text-text-primary ${props.mono ? "font-mono" : ""}`}>
        {props.value || "—"}
      </span>
    </div>
  )
}

/* ── main page ── */
const Settings: Component = () => {
  const navigate = useNavigate()
  const tok = () => getToken() ?? ""

  /* ── billing data — used to resolve current plan tier ── */
  const [billingData] = createResource(
    () => (isAuthenticated() ? tok() : null),
    async (token) => {
      if (!token) return null
      try {
        const res = await fetch(`${API_BASE}/api/billing`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
        if (!res.ok) return null
        return res.json() as Promise<{ tier: string; tierName: string }>
      } catch {
        return null
      }
    },
  )

  /* ── derive limits from actual user tier ── */
  const limits = () => {
    const tier = (billingData()?.tier ?? "free") as TierKey
    return TIER_LIMITS[tier] ?? TIER_LIMITS.free
  }

  /* ── documents data ── */
  const [docsData] = createResource(
    () => (isAuthenticated() ? tok() : null),
    (t) => t ? listDocuments(t) : Promise.resolve({ documents: [], totalChunks: 0 }),
  )

  const docCount = () => docsData()?.documents?.length ?? 0
  const chunkCount = () => docsData()?.totalChunks ?? 0

  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tok()}` },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      showToast(t("toast.allDataDeleted"), "success")
      setShowDeleteConfirm(false)
      navigate("/dashboard")
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("toast.deleteFailed"), "error")
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = () => {
    setAuth(null)
    navigate("/")
  }

  if (!isAuthenticated()) {
    return (
      <div class="min-h-screen bg-bg-canvas">
        <Nav variant="app" />
        <div class="w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-24">
          <div class="flex flex-col items-center gap-6 text-center">
            <p class="text-[14px] text-text-secondary">{t("settings.loginRequired")}</p>
            <Button variant="primary" onClick={() => navigate("/login")}>{t("nav.login")}</Button>
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
        {/* page header */}
        <h1 class="text-[24px] font-bold leading-[1.2] text-text-primary mb-2">
          {t("settings.title")}
        </h1>
        <p class="text-[14px] text-text-secondary mb-12">
          {t("settings.subtitle")}
        </p>

        {/* ── section 1: profile ── */}
        <section class="mb-16">
          <h2 class="text-[20px] font-medium leading-[1.2] text-text-primary mb-6">
            {t("settings.profile")}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
                {t("settings.name")}
              </span>
              <Show
                when={auth()?.name}
                fallback={
                  <span class="text-[14px] text-text-disabled italic">{t("settings.namePlaceholder")}</span>
                }
              >
                <span class="text-[14px] text-text-primary">{auth()!.name}</span>
              </Show>
            </div>
            <ProfileField label="EMAIL" value={auth()?.email ?? "—"} />
            <ProfileField label="ID" value={auth()?.userId || auth()?.apiToken?.slice(0, 16) + "..." || "—"} mono />
          </div>
        </section>

        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ── section 2: plan & usage ── */}
        <section class="mb-16">
          <h2 class="text-[20px] font-medium leading-[1.2] text-text-primary mb-6">
            {t("settings.planTitle")}
          </h2>

          {/* current plan */}
          <div class="flex items-center gap-4 mb-8">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
                {t("settings.currentPlan")}
              </span>
              <span class="text-[16px] font-bold text-accent">
                {billingData()?.tierName ?? t("settings.free")}
              </span>
            </div>
            <Button variant="primary" onClick={() => navigate("/#pricing")}>
              {t("settings.upgrade")}
            </Button>
          </div>

          {/* usage cards */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <UsageCard label={t("settings.documents")} value={docCount()} max={limits().docs} loading={docsData.loading} />
            <UsageCard label={t("settings.chunks")} value={chunkCount()} max={limits().chunks} loading={docsData.loading} />
            <UsageCard label={t("settings.queries")} value={0} max={limits().queries} />
          </div>

          <p class="text-[12px] text-text-tertiary leading-[1.5]">
            {t("settings.betaNote")}
          </p>
        </section>

        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ── section 3: support ── */}
        <section class="mb-16">
          <h2 class="text-[20px] font-medium leading-[1.2] text-text-primary mb-4">
            {t("settings.support")}
          </h2>
          <p class="text-[14px] text-text-secondary">
            {t("settings.supportDesc")}{" "}
            <a href="mailto:nopoint@contexter.cc" class="text-accent hover:underline">nopoint@contexter.cc</a>
            {" · "}
            <a href="https://t.me/nopointsovereign" target="_blank" rel="noopener" class="text-accent hover:underline">Telegram @nopointsovereign</a>
          </p>
        </section>

        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ── section 4: danger zone ── */}
        <section>
          <div class="border border-signal-error p-6 flex flex-col gap-6">
            <div class="flex flex-col gap-3">
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1">
                  <h3 class="text-[14px] font-bold text-text-primary">{t("settings.deleteAllTitle")}</h3>
                  <p class="text-[14px] text-text-secondary">{t("settings.deleteAllDesc")}</p>
                </div>
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  {t("common.delete")}
                </Button>
              </div>
              <Show when={showDeleteConfirm()}>
                <div class="border border-signal-error bg-signal-error/5 p-4 flex flex-col gap-4">
                  <p class="text-[14px] text-text-primary font-bold">{t("settings.deleteConfirm")}</p>
                  <div class="flex items-center gap-3">
                    <Button variant="danger" onClick={handleDeleteAll} loading={deleting()}>
                      {t("settings.confirmDelete")}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              </Show>
            </div>
            <div class="w-full border-t border-signal-error/20" />
            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1">
                <h3 class="text-[14px] font-bold text-text-primary">{t("settings.logoutTitle")}</h3>
                <p class="text-[14px] text-text-secondary">{t("settings.logoutDesc")}</p>
              </div>
              <Button variant="ghost" onClick={handleLogout}>{t("settings.logoutTitle")}</Button>
            </div>
          </div>
        </section>
      </div>

      <Toast />
    </div>
  )
}

export default Settings
