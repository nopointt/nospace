import { createSignal, For, Show, type Component } from "solid-js"
import { t, lang, toggleLang } from "../lib/i18n"
import Logo from "../components/Logo"
import SupportersLeaderboard from "../components/SupportersLeaderboard"
import { Check, ChevronDown, ChevronUp, HelpCircle } from "lucide-solid"

// ─── Tooltip ────────────────────────────────────────────────────────────────

const Tip: Component<{ text: string; children: any }> = (props) => {
  const [show, setShow] = createSignal(false)
  return (
    <span
      class="relative inline-flex items-center cursor-help"
      style={{ gap: "3px" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow((v) => !v)}
    >
      <span class="border-b border-dashed border-text-disabled">{props.children}</span>
      <HelpCircle size={12} class="text-text-disabled shrink-0" stroke-width={2} />
      <Show when={show()}>
        <span class="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[240px] bg-black text-white text-[12px] leading-[1.5] px-3 py-2 pointer-events-none">
          {props.text}
        </span>
      </Show>
    </span>
  )
}

// ─── Container ───────────────────────────────────────────────────────────────

const Container: Component<{ class?: string; children: any }> = (props) => (
  <div class={`max-w-[1280px] mx-auto px-6 md:px-16 ${props.class ?? ""}`}>
    {props.children}
  </div>
)

// ─── Nav ─────────────────────────────────────────────────────────────────────

const SupportersNav: Component = () => (
  <nav
    class="sticky top-0 z-[100] w-full bg-bg-canvas border-b border-border-subtle"
    style={{ height: "56px" }}
  >
    <div class="max-w-[1280px] mx-auto px-6 md:px-16 w-full h-full flex items-center justify-between">
      <a href="/" class="flex items-center shrink-0">
        <Logo size="md" />
      </a>

      <div class="hidden md:flex items-center" style={{ gap: "32px" }}>
        <a href="#tiers" class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]">
          {t("supporters.nav.tiers")}
        </a>
        <a href="#tasks" class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]">
          {t("supporters.nav.tasks")}
        </a>
        <a href="#leaderboard" class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]">
          {t("supporters.nav.leaderboard")}
        </a>
        <a href="#faq" class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]">
          {t("supporters.nav.faq")}
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
          href="/"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          {t("supporters.nav.back")}
        </a>
        <a
          href="#join"
          class="bg-accent text-white text-[14px] font-medium px-5 py-2 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms]"
        >
          {t("supporters.nav.join")}
        </a>
      </div>
    </div>
  </nav>
)

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HeroSection: Component = () => (
  <section class="py-16 md:py-24 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <div class="grid grid-cols-1 lg:grid-cols-12" style={{ gap: "0px" }}>
        <div class="lg:col-span-8 flex flex-col" style={{ gap: "24px" }}>
          <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium">
            {t("supporters.hero.label")}
          </p>
          <h1
            class="text-[48px] md:text-[64px] font-bold text-black leading-[1.0]"
            style={{ "letter-spacing": "-0.04em" }}
          >
            {t("supporters.hero.heading")}
          </h1>
          <p class="text-[16px] text-text-secondary leading-[1.5] max-w-[560px]">
            {t("supporters.hero.sub")}
          </p>
          <div class="flex items-center flex-wrap" style={{ gap: "12px" }}>
            <a
              href="#join"
              class="bg-accent text-white text-[14px] font-medium px-6 py-3 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms]"
            >
              {t("supporters.hero.cta")}
            </a>
            <a
              href="#tiers"
              class="border border-border-default text-black text-[14px] font-medium px-6 py-3 hover:bg-bg-surface transition-colors duration-[80ms]"
            >
              {t("supporters.hero.learnMore")}
            </a>
          </div>
        </div>
        <div class="lg:col-span-4 flex items-end justify-start lg:justify-end pt-12 lg:pt-0">
          <div class="border border-border-default p-8 bg-bg-surface">
            <p
              class="text-[48px] font-bold text-black leading-none font-mono"
              style={{ "letter-spacing": "-0.04em" }}
            >
              8 / 100
            </p>
            <p class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary mt-3 font-medium">
              {t("supporters.hero.spotsTaken")}
            </p>
          </div>
        </div>
      </div>
    </Container>
  </section>
)

// ─── How It Works ─────────────────────────────────────────────────────────────

const HowItWorksSection: Component = () => {
  const steps = () => [
    {
      num: "01",
      title: t("supporters.how.s1.title"),
      desc: t("supporters.how.s1.desc"),
    },
    {
      num: "02",
      title: t("supporters.how.s2.title"),
      desc: t("supporters.how.s2.desc"),
    },
    {
      num: "03",
      title: t("supporters.how.s3.title"),
      desc: t("supporters.how.s3.desc"),
    },
  ]

  return (
    <section class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
          {t("supporters.how.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("supporters.how.title")}
        </h2>
        <div
          class="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "1px", background: "var(--color-border-subtle)" }}
        >
          <For each={steps()}>
            {(step) => (
              <div class="bg-bg-canvas p-8 flex flex-col" style={{ gap: "16px" }}>
                <span
                  class="text-[48px] font-bold text-text-disabled leading-none font-mono"
                  style={{ "letter-spacing": "-0.04em" }}
                >
                  {step.num}
                </span>
                <h3 class="text-[16px] font-bold text-black">{step.title}</h3>
                <p class="text-[14px] text-text-tertiary leading-[1.5]">{step.desc}</p>
              </div>
            )}
          </For>
        </div>
      </Container>
    </section>
  )
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

const TiersSection: Component = () => {
  const tiers = () => [
    {
      id: "diamond",
      label: t("supporters.tiers.diamond.label"),
      range: t("supporters.tiers.diamond.range"),
      revShare: "0.40%",
      perPerson: "0.040%",
      earnRate: "2.0x",
      storage: t("supporters.tiers.diamond.storage"),
      founderAccess: t("supporters.tiers.diamond.founder"),
      highlight: true,
    },
    {
      id: "gold",
      label: t("supporters.tiers.gold.label"),
      range: t("supporters.tiers.gold.range"),
      revShare: "0.30%",
      perPerson: "0.015%",
      earnRate: "1.5x",
      storage: t("supporters.tiers.gold.storage"),
      founderAccess: t("supporters.tiers.gold.founder"),
      highlight: false,
    },
    {
      id: "silver",
      label: t("supporters.tiers.silver.label"),
      range: t("supporters.tiers.silver.range"),
      revShare: "0.20%",
      perPerson: "0.0067%",
      earnRate: "1.25x",
      storage: t("supporters.tiers.silver.storage"),
      founderAccess: t("supporters.tiers.silver.founder"),
      highlight: false,
    },
    {
      id: "bronze",
      label: t("supporters.tiers.bronze.label"),
      range: t("supporters.tiers.bronze.range"),
      revShare: "0.10%",
      perPerson: "0.0025%",
      earnRate: "1.0x",
      storage: t("supporters.tiers.bronze.storage"),
      founderAccess: t("supporters.tiers.bronze.founder"),
      highlight: false,
    },
  ]

  return (
    <section id="tiers" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
          {t("supporters.tiers.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("supporters.tiers.title")}
        </h2>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "1px", background: "var(--color-border-subtle)" }}
        >
          <For each={tiers()}>
            {(tier) => (
              <div
                class={`bg-bg-canvas p-6 flex flex-col${tier.highlight ? " border-t-2 border-accent" : ""}`}
                style={{ gap: "20px" }}
              >
                <div class="flex flex-col" style={{ gap: "4px" }}>
                  <span
                    class={`text-[12px] uppercase tracking-[0.15em] font-medium${tier.highlight ? " text-accent" : " text-text-tertiary"}`}
                  >
                    {tier.label}
                  </span>
                  <span class="text-[12px] text-text-disabled">{tier.range}</span>
                </div>

                <div class="flex flex-col" style={{ gap: "12px" }}>
                  <div class="flex flex-col" style={{ gap: "2px" }}>
                    <span class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
                      {t("supporters.tiers.revShare")}
                    </span>
                    <span
                      class="text-[24px] font-bold text-black font-mono leading-none"
                      style={{ "letter-spacing": "-0.02em" }}
                    >
                      {tier.revShare}
                    </span>
                    <span class="text-[12px] text-text-tertiary">
                      <Tip text={t("supporters.tip.perPerson")}>{tier.perPerson} {t("supporters.tiers.perPerson")}</Tip>
                    </span>
                  </div>

                  <div class="border-t border-border-subtle pt-3 flex flex-col" style={{ gap: "8px" }}>
                    <div class="flex justify-between items-baseline">
                      <Tip text={t("supporters.tip.earnRate")}><span class="text-[12px] text-text-tertiary">{t("supporters.tiers.earnRate")}</span></Tip>
                      <span class="text-[14px] font-bold text-black font-mono">{tier.earnRate}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                      <span class="text-[12px] text-text-tertiary">{t("supporters.tiers.storage")}</span>
                      <span class="text-[12px] font-medium text-black text-right">{tier.storage}</span>
                    </div>
                    <div class="flex flex-col" style={{ gap: "4px" }}>
                      <span class="text-[12px] text-text-tertiary">{t("supporters.tiers.founderAccess")}</span>
                      <span class="text-[12px] font-medium text-black">{tier.founderAccess}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        <p class="mt-6 text-[12px] text-text-tertiary">
          {t("supporters.tiers.note")}
        </p>
      </Container>
    </section>
  )
}

// ─── What You Get ─────────────────────────────────────────────────────────────

const BenefitsSection: Component = () => {
  const benefits = () => [
    t("supporters.benefits.b1"),
    t("supporters.benefits.b2"),
    t("supporters.benefits.b3"),
    t("supporters.benefits.b4"),
    t("supporters.benefits.b5"),
    t("supporters.benefits.b6"),
    t("supporters.benefits.b7"),
  ]

  return (
    <section class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <div class="grid grid-cols-1 lg:grid-cols-12" style={{ gap: "40px" }}>
          <div class="lg:col-span-4">
            <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
              {t("supporters.benefits.label")}
            </p>
            <h2
              class="text-[32px] font-bold text-black leading-[1.2]"
              style={{ "letter-spacing": "-0.04em" }}
            >
              {t("supporters.benefits.title")}
            </h2>
            <p class="text-[14px] text-text-tertiary leading-[1.5] mt-4">
              {t("supporters.benefits.sub")}
            </p>
          </div>
          <div class="lg:col-span-8">
            <div
              class="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: "1px", background: "var(--color-border-subtle)" }}
            >
              <For each={benefits()}>
                {(benefit) => (
                  <div class="bg-bg-canvas p-5 flex items-start" style={{ gap: "12px" }}>
                    <Check size={14} class="text-accent shrink-0 mt-0.5" stroke-width={2} />
                    <span class="text-[14px] text-text-secondary leading-[1.5]">{benefit}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

const LeaderboardSection: Component = () => (
  <section id="leaderboard" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
        {t("supporters.leaderboard.label")}
      </p>
      <h2
        class="text-[32px] font-bold text-black mb-12 leading-[1.2]"
        style={{ "letter-spacing": "-0.04em" }}
      >
        {t("supporters.leaderboard.title")}
      </h2>
      <SupportersLeaderboard />
    </Container>
  </section>
)

// ─── Tasks ────────────────────────────────────────────────────────────────────

const TasksSection: Component = () => {
  const tasks = () => [
    {
      title: t("supporters.tasks.bug.title"),
      tokens: t("supporters.tasks.bug.tokens"),
    },
    {
      title: t("supporters.tasks.referralSignup.title"),
      tokens: t("supporters.tasks.referralSignup.tokens"),
    },
    {
      title: t("supporters.tasks.referralPaid.title"),
      tokens: t("supporters.tasks.referralPaid.tokens"),
    },
    {
      title: t("supporters.tasks.social.title"),
      tokens: t("supporters.tasks.social.tokens"),
    },
    {
      title: t("supporters.tasks.beta.title"),
      tokens: t("supporters.tasks.beta.tokens"),
    },
    {
      title: t("supporters.tasks.testimonial.title"),
      tokens: t("supporters.tasks.testimonial.tokens"),
    },
  ]

  return (
    <section id="tasks" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <div class="grid grid-cols-1 lg:grid-cols-12" style={{ gap: "40px" }}>
          <div class="lg:col-span-4">
            <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
              {t("supporters.tasks.label")}
            </p>
            <h2
              class="text-[32px] font-bold text-black leading-[1.2]"
              style={{ "letter-spacing": "-0.04em" }}
            >
              {t("supporters.tasks.title")}
            </h2>
            <p class="text-[14px] text-text-tertiary leading-[1.5] mt-4">
              {t("supporters.tasks.sub")}
            </p>
            <div class="mt-6 border border-border-default p-4 bg-bg-surface">
              <p class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium mb-1">
                {t("supporters.tasks.cap.label")}
              </p>
              <p class="text-[24px] font-bold text-black font-mono" style={{ "letter-spacing": "-0.02em" }}>
                50
              </p>
              <p class="text-[12px] text-text-tertiary">{t("supporters.tasks.cap.desc")}</p>
            </div>
          </div>
          <div class="lg:col-span-8">
            <div
              class="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: "1px", background: "var(--color-border-subtle)" }}
            >
              <For each={tasks()}>
                {(task) => (
                  <div class="bg-bg-canvas p-5 flex justify-between items-start" style={{ gap: "12px" }}>
                    <span class="text-[14px] text-text-secondary leading-[1.4]">{task.title}</span>
                    <span class="text-[14px] font-bold text-black font-mono shrink-0">{task.tokens}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Join / Payment ───────────────────────────────────────────────────────────

const JoinSection: Component = () => {
  const [copied, setCopied] = createSignal(false)

  const handleCopyCard = () => {
    navigator.clipboard.writeText("4405 6397 1071 3882").then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section id="join" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
          {t("supporters.join.label")}
        </p>
        <h2
          class="text-[32px] font-bold text-black mb-3 leading-[1.2]"
          style={{ "letter-spacing": "-0.04em" }}
        >
          {t("supporters.join.title")}
        </h2>
        <p class="text-[14px] text-text-tertiary leading-[1.5] mb-12 md:mb-16 max-w-[560px]">
          {t("supporters.join.sub")}
        </p>

        <div
          class="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "1px", background: "var(--color-border-subtle)" }}
        >
          {/* Card (LemonSqueezy) */}
          <div class="bg-bg-canvas p-8 flex flex-col" style={{ gap: "16px" }}>
            <div class="flex flex-col" style={{ gap: "6px" }}>
              <span class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium">
                {t("supporters.join.card.label2")}
              </span>
              <h3 class="text-[20px] font-bold text-black">{t("supporters.join.card.title2")}</h3>
            </div>
            <p class="text-[14px] text-text-tertiary leading-[1.5]">
              {t("supporters.join.card.desc2")}
            </p>
            <a
              href="https://pay.contexter.cc/checkout/buy/40f7293e-52e1-4237-9572-dd82c89588ed?embed=1"
              class="lemonsqueezy-button mt-auto bg-accent text-white text-[14px] font-medium px-5 py-2.5 text-center hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms]"
            >
              {t("supporters.join.card.cta")}
            </a>
          </div>

          {/* Bank transfer */}
          <div class="bg-bg-canvas p-8 flex flex-col" style={{ gap: "16px" }}>
            <div class="flex flex-col" style={{ gap: "6px" }}>
              <span class="text-[12px] uppercase tracking-[0.15em] text-text-tertiary font-medium">
                {t("supporters.join.bank.label")}
              </span>
              <h3 class="text-[20px] font-bold text-black">{t("supporters.join.bank.title")}</h3>
            </div>
            <div class="flex flex-col" style={{ gap: "8px" }}>
              <div class="flex flex-col" style={{ gap: "2px" }}>
                <span class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
                  {t("supporters.join.bank.cardLabel")}
                </span>
                <div class="flex items-center" style={{ gap: "8px" }}>
                  <span class="text-[16px] font-bold text-black font-mono tracking-[0.08em]">
                    4405 6397 1071 3882
                  </span>
                  <button
                    onClick={handleCopyCard}
                    class="text-[12px] text-accent hover:underline cursor-pointer"
                  >
                    {copied() ? t("common.copied") : t("preorder.copyNumber")}
                  </button>
                </div>
              </div>
              <div class="flex flex-col" style={{ gap: "2px" }}>
                <span class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
                  {t("supporters.join.bank.bankLabel")}
                </span>
                <span class="text-[12px] text-text-secondary">Halyk Bank, Kazakhstan</span>
              </div>
              <div class="flex flex-col" style={{ gap: "2px" }}>
                <span class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
                  {t("supporters.join.bank.beneficiaryLabel")}
                </span>
                <span class="text-[12px] text-text-secondary">Gulbakhyt Onaibayeva</span>
              </div>
              <div class="flex flex-col" style={{ gap: "2px" }}>
                <span class="text-[12px] uppercase tracking-[0.12em] text-text-tertiary font-medium">
                  SWIFT
                </span>
                <span class="text-[12px] text-black font-mono font-bold">HSBKKZKX</span>
              </div>
            </div>
          </div>

          {/* Crypto */}
          <div class="bg-bg-surface p-8 flex flex-col" style={{ gap: "16px" }}>
            <div class="flex flex-col" style={{ gap: "6px" }}>
              <span class="text-[12px] uppercase tracking-[0.15em] text-text-tertiary font-medium">
                {t("supporters.join.crypto.label")}
              </span>
              <h3 class="text-[20px] font-bold text-text-secondary">{t("supporters.join.crypto.title")}</h3>
            </div>
            <p class="text-[14px] text-text-tertiary leading-[1.5]">
              {t("supporters.join.crypto.desc")}
            </p>
          </div>
        </div>

        {/* After payment note */}
        <div class="mt-8 border border-border-subtle p-6 bg-bg-surface">
          <p class="text-[14px] text-text-secondary leading-[1.5]">
            {t("supporters.join.afterPayment")}{" "}
            <a href="mailto:nopoint@contexter.cc" class="text-accent hover:underline">
              nopoint@contexter.cc
            </a>{" "}
            {t("supporters.join.or")}{" "}
            <a
              href="https://t.me/nopointsovereign"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent hover:underline"
            >
              @nopointsovereign
            </a>
            .
          </p>
          <p class="text-[12px] text-text-tertiary mt-3">
            {t("supporters.join.subNote")}
          </p>
        </div>
      </Container>
    </section>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FAQItem: Component<{ q: string; a: string }> = (props) => {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="border-b border-border-subtle last:border-b-0">
      <button
        class="w-full text-left py-5 flex items-center justify-between cursor-pointer"
        style={{ gap: "16px" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span class="text-[14px] font-medium text-black leading-[1.4]">{props.q}</span>
        <span class="shrink-0 text-text-tertiary">
          <Show when={open()} fallback={<ChevronDown size={16} stroke-width={2} />}>
            <ChevronUp size={16} stroke-width={2} />
          </Show>
        </span>
      </button>
      <Show when={open()}>
        <p class="pb-5 text-[14px] text-text-tertiary leading-[1.5]">{props.a}</p>
      </Show>
    </div>
  )
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

const FAQSection: Component = () => {
  const items = () => [
    { q: t("supporters.faq.q1"), a: t("supporters.faq.a1") },
    { q: t("supporters.faq.q2"), a: t("supporters.faq.a2") },
    { q: t("supporters.faq.q3"), a: t("supporters.faq.a3") },
    { q: t("supporters.faq.q4"), a: t("supporters.faq.a4") },
    { q: t("supporters.faq.q5"), a: t("supporters.faq.a5") },
  ]

  return (
    <section id="faq" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
      <Container>
        <div class="grid grid-cols-1 lg:grid-cols-12" style={{ gap: "40px" }}>
          <div class="lg:col-span-4">
            <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
              {t("supporters.faq.label")}
            </p>
            <h2
              class="text-[32px] font-bold text-black leading-[1.2] lg:sticky lg:top-24"
              style={{ "letter-spacing": "-0.04em" }}
            >
              {t("supporters.faq.title")}
            </h2>
          </div>
          <div class="lg:col-span-8">
            <For each={items()}>
              {(item) => <FAQItem q={item.q} a={item.a} />}
            </For>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const SupportersFooter: Component = () => (
  <footer class="bg-black border-t border-black">
    <Container class="py-10 md:py-12">
      <div class="grid grid-cols-1 md:grid-cols-12" style={{ gap: "40px" }}>
        <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
          <Logo size="md" variant="inverted" />
          <p class="text-xs text-text-tertiary">One memory. Every AI.</p>
          <p class="text-[12px] text-text-tertiary mt-4">
            {t("supporters.footer.copy")}
          </p>
        </div>
        <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
          <span class="text-xs uppercase tracking-[0.12em] text-white font-medium">
            {t("supporters.footer.product")}
          </span>
          <a
            href="/"
            class="text-[14px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
          >
            {t("supporters.footer.home")}
          </a>
          <a
            href="/#pricing"
            class="text-[14px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
          >
            {t("supporters.footer.pricing")}
          </a>
        </div>
        <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
          <span class="text-xs uppercase tracking-[0.12em] text-white font-medium">
            {t("supporters.footer.legal")}
          </span>
          <a
            href="/privacy"
            class="text-[14px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
          >
            {t("landing.footer.privacy")}
          </a>
          <a
            href="/terms"
            class="text-[14px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
          >
            {t("landing.footer.terms")}
          </a>
        </div>
      </div>
    </Container>
  </footer>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

const Supporters: Component = () => (
  <div class="min-h-screen bg-bg-canvas">
    <SupportersNav />
    <HeroSection />
    <HowItWorksSection />
    <TiersSection />
    <BenefitsSection />
    <LeaderboardSection />
    <TasksSection />
    <JoinSection />
    <FAQSection />
    <SupportersFooter />
  </div>
)

export default Supporters
