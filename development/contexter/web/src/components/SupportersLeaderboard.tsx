import { createResource, For, Show, type Component } from "solid-js"
import { t } from "../lib/i18n"
import ErrorState from "./ErrorState"
import { getSupportersLeaderboard, type SupporterTier } from "../lib/api"

// ─── Tier helpers ─────────────────────────────────────────────────────────────

export function tierColor(tier: SupporterTier): string {
  if (tier === "diamond") return "text-accent"
  if (tier === "gold") return "text-[#B8860B]"
  if (tier === "silver") return "text-text-tertiary"
  if (tier === "bronze") return "text-text-secondary"
  return "text-text-disabled"
}

export function tierLabel(tier: SupporterTier): string {
  if (tier === "diamond") return t("supporters.tiers.diamond.label")
  if (tier === "gold") return t("supporters.tiers.gold.label")
  if (tier === "silver") return t("supporters.tiers.silver.label")
  if (tier === "bronze") return t("supporters.tiers.bronze.label")
  return t("supporters.tiers.pending.label")
}

const LEADERBOARD_GRID = "64px 1fr 120px 100px"

// ─── Subcomponents ────────────────────────────────────────────────────────────

const LeaderboardHeader: Component = () => (
  <div
    class="grid border-b border-border-default bg-bg-surface"
    style={{ "grid-template-columns": LEADERBOARD_GRID }}
  >
    <div class="px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
      {t("supporters.leaderboard.col.rank")}
    </div>
    <div class="px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
      {t("supporters.leaderboard.col.name")}
    </div>
    <div class="px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
      {t("supporters.leaderboard.col.tier")}
    </div>
    <div class="px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium text-right">
      {t("supporters.leaderboard.col.tokens")}
    </div>
  </div>
)

const LeaderboardSkeletonRow: Component = () => (
  <div
    class="grid border-b border-border-subtle last:border-b-0"
    style={{ "grid-template-columns": LEADERBOARD_GRID }}
  >
    <div class="px-4 py-3">
      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "32px" }} />
    </div>
    <div class="px-4 py-3">
      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "60%" }} />
    </div>
    <div class="px-4 py-3">
      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "56px" }} />
    </div>
    <div class="px-4 py-3 flex justify-end">
      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "40px" }} />
    </div>
  </div>
)

const LeaderboardEmpty: Component = () => (
  <div class="py-10 px-4 text-center">
    <p class="text-[14px] text-text-primary font-medium">
      {t("supporters.leaderboard.empty.title")}
    </p>
    <p class="text-[12px] text-text-tertiary mt-2">
      {t("supporters.leaderboard.empty.sub")}
    </p>
    <a
      href="#join"
      class="inline-block mt-4 text-[12px] text-accent hover:underline font-medium"
    >
      {t("supporters.leaderboard.empty.cta")}
    </a>
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

const SupportersLeaderboard: Component = () => {
  const [data, { refetch }] = createResource(() => getSupportersLeaderboard())

  const spotsLeft = (): number | null => {
    const d = data()
    if (!d) return null
    return Math.max(0, 100 - d.totalCount)
  }

  return (
    <div class="border border-border-default">
      <LeaderboardHeader />

      {/* Loading state: 8 skeleton rows */}
      <Show when={data.loading}>
        <For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
          {() => <LeaderboardSkeletonRow />}
        </For>
      </Show>

      {/* Error state */}
      <Show when={!data.loading && data.error}>
        <ErrorState
          message={t("supporters.leaderboard.error")}
          onRetry={() => refetch()}
        />
      </Show>

      {/* Empty state: no supporters yet */}
      <Show when={!data.loading && !data.error && data() && data()!.supporters.length === 0}>
        <LeaderboardEmpty />
      </Show>

      {/* Data rows */}
      <Show when={!data.loading && !data.error && data() && data()!.supporters.length > 0}>
        <For each={data()!.supporters}>
          {(s) => (
            <div
              class="grid border-b border-border-subtle last:border-b-0 hover:bg-bg-surface transition-colors duration-[80ms]"
              style={{ "grid-template-columns": LEADERBOARD_GRID }}
            >
              <div class="px-4 py-3 text-[14px] font-bold text-black font-mono">#{s.rank}</div>
              <div class="px-4 py-3 text-[14px] text-text-primary truncate">{s.displayName}</div>
              <div class={`px-4 py-3 text-[12px] font-medium ${tierColor(s.tier)}`}>{tierLabel(s.tier)}</div>
              <div class="px-4 py-3 text-[14px] font-bold text-black font-mono text-right">{s.tokens}</div>
            </div>
          )}
        </For>
      </Show>

      {/* Remaining spots footer (only when data loaded and some spots remain) */}
      <Show when={!data.loading && !data.error && data() && data()!.supporters.length > 0 && (spotsLeft() ?? 0) > 0}>
        <div class="py-6 px-4 text-center border-t border-border-subtle">
          <p class="text-[12px] text-text-tertiary">
            {spotsLeft()} {t("supporters.leaderboard.spotsLeft")}
          </p>
          <a
            href="#join"
            class="inline-block mt-3 text-[12px] text-accent hover:underline font-medium"
          >
            {t("supporters.leaderboard.empty.cta")}
          </a>
        </div>
      </Show>

      {/* Sold out footer */}
      <Show when={!data.loading && !data.error && data() && (spotsLeft() ?? 1) === 0 && data()!.supporters.length > 0}>
        <div class="py-6 px-4 text-center border-t border-border-subtle">
          <p class="text-[12px] text-text-tertiary font-medium">
            {t("supporters.leaderboard.soldOut")}
          </p>
        </div>
      </Show>
    </div>
  )
}

export default SupportersLeaderboard
