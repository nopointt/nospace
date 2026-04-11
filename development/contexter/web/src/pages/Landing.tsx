import { createSignal, For, Show, type Component } from "solid-js"
import { useNavigate } from "@solidjs/router"
import Logo from "../components/Logo"
import AuthModal from "../components/AuthModal"
import { isAuthenticated } from "../lib/store"
import { t, lang, toggleLang } from "../lib/i18n"
import {
  RefreshCw,
  Lock,
  Paperclip,
  Frown,
  Upload,
  Link,
  MessageSquare,
  Layers,
  FileStack,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-solid"

// ─── Shared container ───────────────────────────────────────────────────────
// Replaces all hardcoded style={{ "max-width": "1280px", margin: "0 auto", padding: "0 64px" }}
// with a responsive Tailwind class pattern.

const Container: Component<{ class?: string; children: any }> = (props) => (
  <div class={`max-w-[1280px] mx-auto px-6 md:px-16 ${props.class ?? ""}`}>
    {props.children}
  </div>
)

// ─── Nav ───────────────────────────────────────────────────────────────────

const LandingNav: Component<{ onCTA: () => void }> = (props) => (
  <nav
    class="sticky top-0 z-[100] w-full bg-bg-canvas border-b border-border-subtle"
    style={{ height: "56px" }}
  >
    <div class="max-w-[1280px] mx-auto px-6 md:px-16 w-full h-full flex items-center justify-between">
      <a href="/" class="flex items-center shrink-0">
        <Logo size="md" />
      </a>

      <div class="hidden md:flex items-center" style={{ gap: "32px" }}>
        <a
          href="#how"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          {t("landing.nav.how")}
        </a>
        <a
          href="#features"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          {t("landing.nav.features")}
        </a>
        <a
          href="#pricing"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          {t("landing.nav.pricing")}
        </a>
        <a
          href="#faq"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          {t("landing.nav.faq")}
        </a>
        <a
          href="/supporters"
          class="text-[14px] text-accent hover:text-accent-hover transition-colors duration-[80ms] font-medium"
        >
          {t("landing.nav.supporters")}
        </a>
      </div>

      <div class="flex items-center shrink-0" style={{ gap: "8px" }}>
        <button
          onClick={toggleLang}
          class="text-[12px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms] bg-transparent border border-border-subtle px-2 py-0.5 cursor-pointer"
        >
          {lang() === "en" ? "RU" : "EN"}
        </button>
        <a
          href="https://t.me/nopointsovereign"
          target="_blank"
          rel="noopener"
          class="text-accent text-[14px] font-medium px-5 py-2 border border-accent bg-transparent hover:bg-accent hover:text-white transition-colors duration-[80ms]"
        >
          {t("landing.nav.contact")}
        </a>
        <button
          onClick={props.onCTA}
          class="bg-accent text-white text-[14px] font-medium px-5 py-2 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms]"
        >
          {t("landing.nav.cta")}
        </button>
      </div>
    </div>
  </nav>
)

// ─── Trust logos ──────────────────────────────────────────────────────────

const AI_LOGOS = [
  { name: "ChatGPT", color: "#10A37F" },
  { name: "Claude", color: "#D97706" },
  { name: "Gemini", color: "#4285F4" },
  { name: "Perplexity", color: "#20B2AA" },
  { name: "Cursor", color: "#333333" },
]

const TrustBar: Component = () => (
  <div
    class="w-full border-b border-border-subtle py-5 md:py-6 bg-bg-canvas"
  >
    <Container>
      <p
        class="text-center text-sm font-medium text-black mb-4 md:mb-5 uppercase tracking-[0.04em]"
      >
        {t("landing.trust")}
      </p>
      <div class="flex items-center justify-center flex-wrap" style={{ gap: "20px" }}>
        <For each={AI_LOGOS}>
          {(logo) => (
            <div class="flex items-center" style={{ gap: "8px" }}>
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" fill={logo.color} />
              </svg>
              <span class="text-[14px] md:text-[16px] font-medium text-text-secondary">
                {logo.name}
              </span>
            </div>
          )}
        </For>
      </div>
    </Container>
  </div>
)

// ─── Pain cards ────────────────────────────────────────────────────────────

const PainSection: Component = () => {
  const painItems = () => [
    {
      Icon: RefreshCw,
      title: t("landing.pain1.title"),
      text: t("landing.pain1.text"),
    },
    {
      Icon: Lock,
      title: t("landing.pain2.title"),
      text: t("landing.pain2.text"),
    },
    {
      Icon: Paperclip,
      title: t("landing.pain3.title"),
      text: t("landing.pain3.text"),
    },
    {
      Icon: Frown,
      title: t("landing.pain4.title"),
      text: t("landing.pain4.text"),
    },
  ]

  return (
    <section class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <h2
          class="text-[32px] font-bold text-black mb-3 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("landing.pain.title")}
        </h2>
        <p class="text-[16px] text-text-tertiary mb-12 md:mb-16">
          {t("landing.pain.sub")}
        </p>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "1px", background: "var(--color-border-subtle)" }}
        >
          <For each={painItems()}>
            {(item) => (
              <div
                class="bg-bg-canvas p-6 md:p-8 flex flex-col"
                style={{ gap: "16px" }}
              >
                <item.Icon size={24} class="text-accent" stroke-width={1.5} />
                <p class="text-[16px] font-bold text-black">
                  {item.title}
                </p>
                <p class="text-[14px] md:text-[16px] text-text-secondary leading-[1.5]">
                  {item.text}
                </p>
              </div>
            )}
          </For>
        </div>
      </Container>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────

const HowSection: Component = () => {
  const steps = () => [
    {
      num: "01",
      title: t("landing.how.s1.title"),
      Icon: Upload,
      desc: t("landing.how.s1.desc"),
    },
    {
      num: "02",
      title: t("landing.how.s2.title"),
      Icon: Link,
      desc: t("landing.how.s2.desc"),
    },
    {
      num: "03",
      title: t("landing.how.s3.title"),
      Icon: MessageSquare,
      desc: t("landing.how.s3.desc"),
    },
  ]

  return (
    <section id="how" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p
          class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3"
        >
          {t("landing.how.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("landing.how.title")}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1px", background: "var(--color-border-subtle)" }}>
          <For each={steps()}>
            {(step) => (
              <div class="bg-bg-canvas p-8 md:p-10 flex flex-col" style={{ gap: "24px" }}>
                <div class="flex items-start justify-between">
                  <span
                    class="text-[48px] font-bold text-text-disabled leading-none"
                  >
                    {step.num}
                  </span>
                  <step.Icon size={28} class="text-accent" stroke-width={1.5} />
                </div>
                <h3 class="text-[20px] md:text-[24px] font-bold text-black leading-[1.2]">
                  {step.title}
                </h3>
                <p class="text-[14px] md:text-[16px] text-text-tertiary leading-[1.5]">
                  {step.desc}
                </p>
              </div>
            )}
          </For>
        </div>
      </Container>
    </section>
  )
}

// ─── Value props ──────────────────────────────────────────────────────────

const FeaturesSection: Component = () => {
  const valueCards = () => [
    {
      Icon: Layers,
      title: t("landing.feat1.title"),
      desc: t("landing.feat1.desc"),
    },
    {
      Icon: FileStack,
      title: t("landing.feat2.title"),
      desc: t("landing.feat2.desc"),
    },
    {
      Icon: Sparkles,
      title: t("landing.feat3.title"),
      desc: t("landing.feat3.desc"),
    },
  ]

  return (
    <section id="features" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p
          class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3"
        >
          {t("landing.feat.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("landing.feat.title")}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3" style={{ gap: "24px" }}>
          <For each={valueCards()}>
            {(card) => (
              <div
                class="border border-border-subtle p-6 md:p-8 flex flex-col"
                style={{ gap: "20px" }}
              >
                <div
                  class="flex items-center justify-center bg-bg-surface"
                  style={{ width: "48px", height: "48px" }}
                >
                  <card.Icon size={22} class="text-accent" stroke-width={1.5} />
                </div>
                <h3 class="text-[16px] font-bold text-black leading-[1.2]">
                  {card.title}
                </h3>
                <p class="text-[14px] text-text-tertiary leading-[1.5]">
                  {card.desc}
                </p>
              </div>
            )}
          </For>
        </div>
      </Container>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────

const PricingSection: Component<{ onCTA: () => void }> = (props) => {
  const navigate = useNavigate()

  const tiers = () => [
    {
      label: t("landing.pricing.free.label"),
      price: t("landing.pricing.free.price"),
      pricePer: null,
      priceSub: t("landing.pricing.free.priceSub"),
      features: [
        t("landing.pricing.free.f1"),
        t("landing.pricing.free.f2"),
        t("landing.pricing.free.f3"),
        t("landing.pricing.free.f4"),
        t("landing.pricing.free.f5"),
      ],
      cta: t("landing.pricing.free.cta"),
      href: "/register",
      highlight: false,
    },
    {
      label: t("landing.pricing.starter.label"),
      price: t("landing.pricing.starter.price"),
      pricePer: t("landing.pricing.starter.pricePer"),
      priceSub: null,
      features: [
        t("landing.pricing.starter.f1"),
        t("landing.pricing.starter.f2"),
        t("landing.pricing.starter.f3"),
        t("landing.pricing.starter.f4"),
        t("landing.pricing.starter.f5"),
        t("landing.pricing.starter.f6"),
      ],
      cta: t("landing.pricing.starter.cta"),
      href: "https://pay.contexter.cc/checkout/buy/104ceab1-30fc-4b30-9b96-1053e4c7e6bc",
      highlight: false,
    },
    {
      label: t("landing.pricing.pro.label"),
      price: t("landing.pricing.pro.price"),
      pricePer: t("landing.pricing.pro.pricePer"),
      priceSub: null,
      features: [
        t("landing.pricing.pro.f1"),
        t("landing.pricing.pro.f2"),
        t("landing.pricing.pro.f3"),
        t("landing.pricing.pro.f4"),
        t("landing.pricing.pro.f5"),
        t("landing.pricing.pro.f6"),
        t("landing.pricing.pro.f7"),
      ],
      cta: t("landing.pricing.pro.cta"),
      href: "https://pay.contexter.cc/checkout/buy/08f48e34-bcb3-45a8-a49b-fca3faa15a26",
      highlight: true,
    },
  ]

  return (
    <section id="pricing" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
          {t("landing.pricing.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("landing.pricing.title")}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1px", background: "var(--color-border-subtle)" }}>
          <For each={tiers()}>
            {(tier) => (
              <div
                class={`bg-bg-canvas p-8 md:p-10 flex flex-col${tier.highlight ? " border-l-2 border-accent" : ""}`}
                style={{ gap: "32px" }}
              >
                <div class="flex flex-col" style={{ gap: "8px" }}>
                  <span
                    class={`text-[12px] uppercase tracking-[0.15em] font-medium${tier.highlight ? " text-accent" : " text-text-tertiary"}`}
                  >
                    {tier.label}
                  </span>
                  <div class="flex items-baseline" style={{ gap: "4px" }}>
                    <span
                      class="text-[48px] font-bold text-black leading-none"
                      style={{ "letter-spacing": "-0.04em" }}
                    >
                      {tier.price}
                    </span>
                    <Show when={tier.pricePer}>
                      <span class="text-[16px] text-text-tertiary">{tier.pricePer}</span>
                    </Show>
                  </div>
                  <Show when={tier.priceSub}>
                    <span class="text-[14px] text-text-tertiary">{tier.priceSub}</span>
                  </Show>
                </div>

                <div class="flex flex-col" style={{ gap: "12px" }}>
                  <For each={tier.features}>
                    {(feat) => (
                      <div class="flex items-center" style={{ gap: "10px" }}>
                        <Check size={14} class="text-accent shrink-0" stroke-width={2} />
                        <span class="text-[14px] text-text-secondary">{feat}</span>
                      </div>
                    )}
                  </For>
                </div>

                <a
                  href={tier.href}
                  class={`lemonsqueezy-button mt-auto text-[14px] font-medium px-6 py-3 text-center transition-colors duration-[80ms]${tier.highlight ? " bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed" : " border border-border-subtle text-black hover:bg-bg-surface active:bg-bg-elevated"}`}
                >
                  {tier.cta}
                </a>
              </div>
            )}
          </For>
        </div>

        <p class="mt-8 text-center text-[14px] text-text-secondary">
          {t("landing.pricing.business")}{" "}
          <a href="mailto:nopoint@contexter.cc" class="text-accent hover:underline">nopoint@contexter.cc</a>
          {" · "}
          <a href="https://t.me/nopointsovereign" target="_blank" rel="noopener" class="text-accent hover:underline">Telegram</a>
        </p>
      </Container>
    </section>
  )
}

// ─── Pre-launch: Beta ─────────────────────────────────────────────────────

const BetaSection: Component = () => {
  const limits = () => [
    t("landing.prelaunch.limit1"),
    t("landing.prelaunch.limit2"),
    t("landing.prelaunch.limit3"),
  ]

  return (
    <section id="prelaunch-beta" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <div class="grid grid-cols-1 md:grid-cols-[7fr_5fr]" style={{ gap: "32px" }}>
          <div class="flex flex-col" style={{ gap: "16px" }}>
            <span class="text-[10px] font-bold uppercase tracking-[0.04em] bg-accent text-white px-2.5 py-1 w-fit inline-block">
              {t("landing.prelaunch.badge")}
            </span>
            <h2 class="text-[32px] font-bold text-black leading-[1.2]" style={{ "letter-spacing": "-0.04em" }}>
              {t("landing.prelaunch.title")}
            </h2>
            <p class="text-[14px] text-text-secondary leading-[1.5] max-w-[60ch]">
              {t("landing.prelaunch.desc")}
            </p>
          </div>
          <div class="flex flex-col justify-center" style={{ gap: "12px" }}>
            <span class="text-[10px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              {t("landing.prelaunch.limitsLabel")}
            </span>
            <For each={limits()}>
              {(limit) => (
                <div class="flex items-start" style={{ gap: "8px" }}>
                  <span class="text-[12px] font-bold text-accent shrink-0 leading-[1.5]">—</span>
                  <span class="text-[12px] text-text-secondary leading-[1.5]">{limit}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Supporters Teaser ───────────────────────────────────────────────────

const SupportersTeaser: Component = () => (
  <section id="supporters" class="py-16 md:py-20 bg-bg-surface border-b border-border-subtle">
    <Container>
      <div class="grid grid-cols-1 md:grid-cols-[7fr_5fr]" style={{ gap: "48px" }}>
        <div class="flex flex-col" style={{ gap: "20px" }}>
          <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium">
            {t("landing.supporters.label")}
          </p>
          <h2 class="text-[32px] font-bold text-black leading-[1.2]" style={{ "letter-spacing": "-0.04em" }}>
            {t("landing.supporters.title")}
          </h2>
          <p class="text-[14px] text-text-secondary leading-[1.5] max-w-[60ch]">
            {t("landing.supporters.desc")}
          </p>
          <a
            href="/supporters"
            class="text-[14px] font-medium bg-accent text-white px-8 py-3 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms] w-fit"
          >
            {t("landing.supporters.cta")}
          </a>
        </div>
        <div class="flex flex-col justify-center" style={{ gap: "16px" }}>
          <div class="border border-border-default p-6 bg-bg-canvas">
            <span class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">{t("landing.supporters.spots")}</span>
            <p class="text-[40px] font-bold text-black font-mono leading-none mt-2" style={{ "letter-spacing": "-0.04em" }}>8 / 100</p>
          </div>
          <div class="flex flex-col" style={{ gap: "8px" }}>
            <div class="flex items-start" style={{ gap: "8px" }}>
              <span class="text-[12px] font-bold text-accent shrink-0 leading-[1.5]">—</span>
              <span class="text-[12px] text-text-secondary leading-[1.5]">{t("landing.supporters.perk1")}</span>
            </div>
            <div class="flex items-start" style={{ gap: "8px" }}>
              <span class="text-[12px] font-bold text-accent shrink-0 leading-[1.5]">—</span>
              <span class="text-[12px] text-text-secondary leading-[1.5]">{t("landing.supporters.perk2")}</span>
            </div>
            <div class="flex items-start" style={{ gap: "8px" }}>
              <span class="text-[12px] font-bold text-accent shrink-0 leading-[1.5]">—</span>
              <span class="text-[12px] text-text-secondary leading-[1.5]">{t("landing.supporters.perk3")}</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  </section>
)

// ─── Before / After ───────────────────────────────────────────────────────

const BeforeAfterSection: Component = () => {
  const comparisonRows = () => [
    [t("landing.ba.b1"), t("landing.ba.a1")],
    [t("landing.ba.b2"), t("landing.ba.a2")],
    [t("landing.ba.b3"), t("landing.ba.a3")],
    [t("landing.ba.b4"), t("landing.ba.a4")],
    [t("landing.ba.b5"), t("landing.ba.a5")],
    [t("landing.ba.b6"), t("landing.ba.a6")],
  ]

  return (
    <section class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("landing.ba.title")}
        </h2>

        <div class="border border-border-subtle bg-bg-canvas">
          <div
            class="grid grid-cols-2 border-b border-border-subtle bg-bg-surface"
          >
            <div
              class="px-4 py-3 md:px-8 md:py-4 text-xs md:text-[12px] uppercase tracking-[0.12em] font-medium text-text-disabled"
            >
              {t("landing.ba.without")}
            </div>
            <div
              class="px-4 py-3 md:px-8 md:py-4 text-xs md:text-[12px] uppercase tracking-[0.12em] font-medium text-accent border-l border-border-subtle"
            >
              {t("landing.ba.with")}
            </div>
          </div>

          <For each={comparisonRows()}>
            {(row, i) => (
              <div
                class="grid grid-cols-2 border-b border-border-subtle last:border-b-0"
                style={{ background: i() % 2 === 0 ? "var(--color-bg-canvas)" : "var(--color-bg-canvas)" }}
              >
                <div class="px-4 py-4 md:px-8 md:py-5 flex items-start gap-2 md:gap-3 border-r border-border-subtle">
                  <X size={14} class="text-text-disabled shrink-0 mt-0.5" stroke-width={2} />
                  <span class="text-[12px] md:text-[14px] text-text-tertiary leading-[1.5]">
                    {row[0]}
                  </span>
                </div>
                <div class="px-4 py-4 md:px-8 md:py-5 flex items-start gap-2 md:gap-3">
                  <Check size={14} class="text-accent shrink-0 mt-0.5" stroke-width={2} />
                  <span class="text-[12px] md:text-[14px] text-black font-medium leading-[1.5]">
                    {row[1]}
                  </span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Container>
    </section>
  )
}

// ─── Roadmap ──────────────────────────────────────────────────────────────

const RoadmapSection: Component = () => {
  const phases = () => [
    {
      label: t("roadmap.now"),
      title: t("roadmap.nowDesc"),
      features: [
        t("roadmap.now.f1"),
        t("roadmap.now.f2"),
        t("roadmap.now.f3"),
        t("roadmap.now.f4"),
        t("roadmap.now.f5"),
      ],
      isNow: true,
    },
    {
      label: t("roadmap.q2"),
      title: t("roadmap.q2Desc"),
      features: [
        t("roadmap.q2.f1"),
        t("roadmap.q2.f2"),
        t("roadmap.q2.f3"),
        t("roadmap.q2.f4"),
        t("roadmap.q2.f5"),
        t("roadmap.q2.f6"),
        t("roadmap.q2.f7"),
        t("roadmap.q2.f8"),
      ],
      isNow: false,
    },
    {
      label: t("roadmap.q3"),
      title: t("roadmap.q3Desc"),
      features: [
        t("roadmap.q3.f1"),
        t("roadmap.q3.f2"),
        t("roadmap.q3.f3"),
        t("roadmap.q3.f4"),
        t("roadmap.q3.f5"),
        t("roadmap.q3.f6"),
      ],
      isNow: false,
    },
  ]

  return (
    <section id="roadmap" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
          {t("roadmap.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("roadmap.title")}
        </h2>

        <div
          class="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "1px", background: "var(--color-border-subtle)" }}
        >
          <For each={phases()}>
            {(phase) => (
              <div
                class={`bg-bg-canvas p-8 md:p-10 flex flex-col${phase.isNow ? " border-l-2 border-accent" : ""}`}
                style={{ gap: "24px" }}
              >
                <div class="flex flex-col" style={{ gap: "8px" }}>
                  <span
                    class={`text-[12px] uppercase tracking-[0.15em] font-medium${phase.isNow ? " text-accent" : " text-text-tertiary"}`}
                  >
                    {phase.label}
                  </span>
                  <h3
                    class="text-[18px] md:text-[20px] font-bold text-black leading-[1.2]"
                    style={{ "letter-spacing": "-0.03em" }}
                  >
                    {phase.title}
                  </h3>
                </div>

                <div class="flex flex-col" style={{ gap: "12px" }}>
                  <For each={phase.features}>
                    {(feat) => (
                      <div class="flex items-start" style={{ gap: "10px" }}>
                        <Show
                          when={phase.isNow}
                          fallback={
                            <span class="text-accent text-[14px] font-bold leading-[1.5] shrink-0">—</span>
                          }
                        >
                          <Check size={14} class="text-accent shrink-0 mt-[3px]" stroke-width={2} />
                        </Show>
                        <span class="text-[14px] text-text-secondary leading-[1.5]">{feat}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </Container>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────

const FAQItem: Component<{ q: string; a: string }> = (props) => {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="border-b border-border-subtle last:border-b-0">
      <button
        class="w-full flex items-center justify-between px-0 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span class="text-[16px] font-medium text-black pr-8">
          {props.q}
        </span>
        <Show
          when={open()}
          fallback={<ChevronDown size={18} class="text-text-tertiary shrink-0" stroke-width={1.5} />}
        >
          <ChevronUp size={18} class="text-accent shrink-0" stroke-width={1.5} />
        </Show>
      </button>
      <Show when={open()}>
        <p class="pb-5 text-[14px] md:text-[16px] text-text-secondary leading-[1.5]">
          {props.a}
        </p>
      </Show>
    </div>
  )
}

const FAQSection: Component = () => {
  const faqItems = () => [
    { q: t("landing.faq1.q"), a: t("landing.faq1.a") },
    { q: t("landing.faq2.q"), a: t("landing.faq2.a") },
    { q: t("landing.faq3.q"), a: t("landing.faq3.a") },
    { q: t("landing.faq4.q"), a: t("landing.faq4.a") },
    { q: t("landing.faq5.q"), a: t("landing.faq5.a") },
  ]

  return (
    <section id="faq" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <div class="grid grid-cols-1 lg:grid-cols-12" style={{ gap: "40px" }}>
          <div class="lg:col-span-4">
            <h2
              class="text-[32px] font-bold text-black leading-[1.2] lg:sticky lg:top-24"
              style={{ "letter-spacing": "-0.04em" }}
            >
              {t("landing.faq.title")}
            </h2>
          </div>
          <div class="lg:col-span-8">
            <For each={faqItems()}>
              {(item) => <FAQItem q={item.q} a={item.a} />}
            </For>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────

const FinalCTA: Component<{ onCTA: () => void }> = (props) => (
  <section class="py-16 md:py-24 bg-black">
    <div
      class="flex flex-col items-center text-center max-w-[800px] mx-auto px-6 md:px-8"
    >
      <h2
        class="text-[32px] md:text-[48px] font-bold text-white leading-[1.2] mb-5"
        style={{ "letter-spacing": "-0.04em" }}
      >
        {t("landing.cta.h2a")}<br />{t("landing.cta.h2b")}
      </h2>
      <p class="text-[16px] text-text-disabled leading-[1.5] mb-8 md:mb-10">
        {t("landing.cta.sub")}
      </p>
      <button
        onClick={props.onCTA}
        class="bg-bg-canvas text-black text-[16px] font-medium px-8 py-4 hover:bg-bg-surface active:bg-bg-elevated transition-colors duration-[80ms] mb-4"
      >
        {t("landing.nav.cta")}
      </button>
      <p class="text-xs text-text-secondary">
        {t("landing.hero.noCc")}
      </p>
    </div>
  </section>
)

// ─── Footer ───────────────────────────────────────────────────────────────

const Footer: Component = () => {
  const footerProductLinks = () => [
    { label: t("landing.nav.how"), href: "#how" },
    { label: t("landing.nav.features"), href: "#features" },
    { label: t("landing.nav.pricing"), href: "#pricing" },
    { label: t("landing.nav.faq"), href: "#faq" },
  ]

  const footerCompanyLinks = () => [
    { label: t("landing.footer.privacy"), href: "/privacy" },
    { label: t("landing.footer.terms"), href: "/terms" },
  ]

  return (
    <footer class="bg-black border-t border-black">
      <Container class="py-10 md:py-12">
        <div class="grid grid-cols-1 md:grid-cols-12" style={{ gap: "40px" }}>
          <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
            <Logo size="md" variant="inverted" />
            <p class="text-xs text-text-tertiary">
              One memory. Every AI.
            </p>
            <p class="text-[12px] text-text-tertiary mt-4">
              © 2026 Contexter
            </p>
          </div>

          <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
            <span class="text-xs uppercase tracking-[0.12em] text-white font-medium">
              {t("landing.footer.product")}
            </span>
            <For each={footerProductLinks()}>
              {(link) => (
                <a
                  href={link.href}
                  class="text-[14px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
                >
                  {link.label}
                </a>
              )}
            </For>
          </div>

          <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
            <span class="text-xs uppercase tracking-[0.12em] text-white font-medium">
              {t("landing.footer.company")}
            </span>
            <For each={footerCompanyLinks()}>
              {(link) => (
                <a
                  href={link.href}
                  class="text-[14px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
                >
                  {link.label}
                </a>
              )}
            </For>
          </div>
        </div>
      </Container>
    </footer>
  )
}

// ─── Hero section ─────────────────────────────────────────────────────────

const HeroSection: Component<{ onCTA: () => void }> = (props) => (
  <section class="py-16 md:py-24 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <div
        class="flex flex-col items-center text-center max-w-[720px] mx-auto"
        style={{ gap: "24px" }}
      >
        <span
          class="text-xs md:text-[12px] font-medium uppercase tracking-[0.2em] text-accent"
        >
          {t("landing.hero.tag")}
        </span>

        <h1
          class="text-[32px] md:text-[48px] font-bold text-black leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("landing.hero.h1a")}<br />
          {t("landing.hero.h1b")}
        </h1>

        <p
          class="text-[16px] text-text-secondary leading-[1.5] max-w-[560px]"
        >
          {t("landing.hero.desc")}
        </p>

        <div class="flex flex-col items-center" style={{ gap: "12px" }}>
          <div class="flex items-center" style={{ gap: "12px" }}>
            <a
              href="https://t.me/nopointsovereign"
              target="_blank"
              rel="noopener"
              class="text-accent text-[16px] font-medium px-8 py-4 border border-accent bg-transparent hover:bg-accent hover:text-white transition-colors duration-[80ms]"
            >
              {t("landing.nav.contact")}
            </a>
            <button
              onClick={props.onCTA}
              class="bg-accent text-white text-[16px] font-medium px-8 py-4 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms]"
            >
              {t("landing.nav.cta")}
            </button>
          </div>
          <span class="text-xs text-text-secondary">
            {t("landing.hero.noCc")}
          </span>
        </div>
      </div>
    </Container>
  </section>
)

// ─── Root Page ────────────────────────────────────────────────────────────

const Landing: Component = () => {
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = createSignal(false)

  const handleCTA = () => {
    if (isAuthenticated()) {
      navigate("/app")
    } else {
      setAuthOpen(true)
    }
  }



  return (
    <div
      class="min-h-screen bg-bg-canvas"
    >
      <LandingNav onCTA={handleCTA} />

      <HeroSection onCTA={handleCTA} />

      <TrustBar />

      <PainSection />

      <HowSection />

      <FeaturesSection />

      <BeforeAfterSection />

      <PricingSection onCTA={handleCTA} />

      <BetaSection />
      <SupportersTeaser />

      <RoadmapSection />

      <FAQSection />

      <FinalCTA onCTA={handleCTA} />

      <Footer />

      <AuthModal
        open={authOpen()}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => navigate("/app")}
      />
    </div>
  )
}

export default Landing
