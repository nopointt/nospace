import { createResource, createSignal, Show, type Component } from "solid-js"
import { t } from "../lib/i18n"
import Button from "./Button"
import {
  getSupporterMe,
  activateFreeze,
  type SupporterMeResponse,
  type SupporterMeSupporter,
  type SupporterTier,
  type SupporterStatus,
} from "../lib/api"
import { tierColor, tierLabel } from "./SupportersLeaderboard"

// ─── Status helpers ──────────────────────────────────────────────────────────

function statusClasses(status: SupporterStatus): string {
  if (status === "active") return "border-signal-success text-signal-success"
  if (status === "warning") return "border-accent text-accent"
  if (status === "frozen") return "border-border-default text-text-tertiary"
  if (status === "quarantined") return "border-signal-error text-signal-error"
  return "border-border-default text-text-tertiary"
}

function statusLabel(status: SupporterStatus): string {
  return t(`supporters.status.pill.${status}`)
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────

const FreezeConfirmDialog: Component<{
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}> = (props) => (
  <div class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
    <div class="bg-bg-canvas border border-border-default p-6 max-w-[440px] w-full mx-4 flex flex-col gap-4">
      <p class="text-[14px] font-medium text-text-primary">
        {t("supporters.status.freezeConfirmTitle")}
      </p>
      <p class="text-[12px] text-text-tertiary leading-[1.5]">
        {t("supporters.status.freezeConfirm")}
      </p>
      <div class="flex items-center gap-3 justify-end">
        <Button variant="ghost" onClick={props.onCancel} disabled={props.loading}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" onClick={props.onConfirm} disabled={props.loading}>
          {t("supporters.status.freezeButton")}
        </Button>
      </div>
    </div>
  </div>
)

// ─── Card body ───────────────────────────────────────────────────────────────

const SupporterCardBody: Component<{
  data: SupporterMeSupporter
  onFreezeSuccess: () => void
}> = (props) => {
  const [showConfirm, setShowConfirm] = createSignal(false)
  const [freezing, setFreezing] = createSignal(false)
  const [freezeError, setFreezeError] = createSignal<string | null>(null)

  const rankLabel = () => {
    if (props.data.rank === null) return t("supporters.status.rankPending")
    return `#${props.data.rank}`
  }

  const canFreeze = () =>
    (props.data.status === "active" || props.data.status === "warning") &&
    props.data.freezeEnd === null

  async function handleFreeze() {
    setFreezing(true)
    setFreezeError(null)
    try {
      await activateFreeze()
      setShowConfirm(false)
      props.onFreezeSuccess()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg.toLowerCase().includes("year") || msg.includes("409")) {
        setFreezeError(t("supporters.status.freezeErrorAnnual"))
      } else {
        setFreezeError(t("supporters.status.freezeErrorGeneric"))
      }
    } finally {
      setFreezing(false)
    }
  }

  return (
    <div class="border border-border-default bg-bg-canvas p-6 flex flex-col" style={{ gap: "16px" }}>
      <Show when={showConfirm()}>
        <FreezeConfirmDialog
          onConfirm={handleFreeze}
          onCancel={() => setShowConfirm(false)}
          loading={freezing()}
        />
      </Show>

      {/* Header */}
      <div class="flex items-start justify-between" style={{ gap: "16px" }}>
        <div class="flex flex-col" style={{ gap: "4px" }}>
          <span class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium">
            {t("supporters.status.label")}
          </span>
          <span class="text-[32px] font-bold text-black font-mono leading-none" style={{ "letter-spacing": "-0.02em" }}>
            {rankLabel()}
          </span>
        </div>
        <span
          class={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-medium uppercase tracking-[0.08em] ${statusClasses(props.data.status)}`}
        >
          {statusLabel(props.data.status)}
        </span>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-2 border-t border-border-subtle pt-4" style={{ gap: "16px" }}>
        <div class="flex flex-col" style={{ gap: "4px" }}>
          <span class="text-[10px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
            {t("supporters.status.tier")}
          </span>
          <span class={`text-[14px] font-bold ${tierColor(props.data.tier as SupporterTier)}`}>
            {tierLabel(props.data.tier as SupporterTier)}
          </span>
        </div>
        <div class="flex flex-col" style={{ gap: "4px" }}>
          <span class="text-[10px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
            {t("supporters.status.tokens")}
          </span>
          <span class="text-[14px] font-bold text-black font-mono">{props.data.tokens}</span>
        </div>
      </div>

      {/* Status messages */}
      <Show when={props.data.status === "warning"}>
        <div class="border border-accent p-3 text-[12px] text-accent leading-[1.5]">
          {t("supporters.status.warning")}
        </div>
      </Show>
      <Show when={props.data.status === "frozen" && props.data.freezeEnd}>
        <div class="border border-border-default p-3 text-[12px] text-text-tertiary leading-[1.5]">
          {t("supporters.status.frozen", { date: formatDate(props.data.freezeEnd) })}
        </div>
      </Show>
      <Show when={props.data.status === "quarantined"}>
        <div class="border border-signal-error p-3 text-[12px] text-signal-error leading-[1.5]">
          {t("supporters.status.quarantined")}
        </div>
      </Show>
      <Show when={props.data.status === "exiting"}>
        <div class="border border-border-default p-3 text-[12px] text-text-tertiary leading-[1.5]">
          {t("supporters.status.exiting")}
        </div>
      </Show>

      {/* Freeze error */}
      <Show when={freezeError()}>
        <div class="text-[12px] text-signal-error">{freezeError()}</div>
      </Show>

      {/* Freeze button */}
      <Show when={canFreeze()}>
        <div class="flex justify-start">
          <Button
            variant="secondary"
            onClick={() => setShowConfirm(true)}
            disabled={freezing()}
          >
            {t("supporters.status.freezeButton")}
          </Button>
        </div>
      </Show>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

const SupporterStatusCard: Component = () => {
  const [data, { refetch }] = createResource(() => getSupporterMe())

  // Render nothing while loading, on error, or if user is not a supporter
  // (Dashboard is core UX — the card is supplementary).
  const isSupporter = (res: SupporterMeResponse | undefined): res is SupporterMeSupporter =>
    !!res && res.isSupporter === true

  return (
    <Show when={!data.loading && !data.error && isSupporter(data())}>
      <SupporterCardBody
        data={data() as SupporterMeSupporter}
        onFreezeSuccess={() => refetch()}
      />
    </Show>
  )
}

export default SupporterStatusCard
