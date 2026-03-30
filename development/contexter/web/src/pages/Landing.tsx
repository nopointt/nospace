import { createSignal, For, Show, type Component } from "solid-js"
import { useNavigate } from "@solidjs/router"
import Logo from "../components/Logo"
import AuthModal from "../components/AuthModal"
import { isAuthenticated } from "../lib/store"
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
    <div class="max-w-[1280px] mx-auto px-6 md:px-16 w-full h-full flex items-center relative">
      <a href="/" class="flex items-center">
        <Logo size="md" />
      </a>

      <div class="hidden md:flex items-center absolute left-1/2 -translate-x-1/2" style={{ gap: "32px" }}>
        <a
          href="#how"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          Как это работает
        </a>
        <a
          href="#features"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          Возможности
        </a>
        <a
          href="#pricing"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          Цены
        </a>
        <a
          href="#faq"
          class="text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
        >
          FAQ
        </a>
      </div>

      <button
        onClick={props.onCTA}
        class="bg-accent text-white text-[14px] font-medium px-5 py-2 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms] ml-auto"
      >
        Попробовать бесплатно
      </button>
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
        class="text-center text-sm font-medium text-black mb-4 md:mb-5 uppercase tracking-widest"
      >
        Работает со всеми нейросетями, которые вы уже используете
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

const PAIN_ITEMS = [
  {
    Icon: RefreshCw,
    title: "Каждый раз с нуля",
    text: "Каждый новый чат — с нуля. Снова объясняешь, кто ты и что делаешь.",
  },
  {
    Icon: Lock,
    title: "Невидимые стены",
    text: "Месяцами учил ChatGPT — а Claude не знает ничего.",
  },
  {
    Icon: Paperclip,
    title: "Ручная загрузка",
    text: "Каждый раз загружаешь тот же самый PDF в новый диалог.",
  },
  {
    Icon: Frown,
    title: "День сурка",
    text: "Каждый день объясняешь одно и то же, будто AI видит тебя впервые.",
  },
]

const PainSection: Component = () => (
  <section class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <h2
        class="text-[32px] md:text-[32px] font-bold text-black mb-3 leading-[1.2]"
        style={{ "letter-spacing": "-0.04em" }}
      >
        Знакомо?
      </h2>
      <p class="text-[16px] md:text-[16px] text-text-tertiary mb-10 md:mb-12">
        Каждый пользователь нейросетей сталкивается с этим.
      </p>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        style={{ gap: "1px", background: "var(--color-border-subtle)" }}
      >
        <For each={PAIN_ITEMS}>
          {(item) => (
            <div
              class="bg-bg-canvas p-6 md:p-8 flex flex-col"
              style={{ gap: "16px" }}
            >
              <item.Icon size={24} class="text-accent" stroke-width={1.5} />
              <p class="text-[16px] md:text-[16px] font-bold text-black">
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

// ─── How it works ─────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Загрузи",
    Icon: Upload,
    desc: "Любой файл: PDF, запись встречи, презентация, фото. Любой формат, любой размер.",
  },
  {
    num: "02",
    title: "Подключи",
    Icon: Link,
    desc: "Свяжи нейросети: ChatGPT, Claude, Gemini, Perplexity. Пошаговая инструкция.",
  },
  {
    num: "03",
    title: "Работай спокойно",
    Icon: MessageSquare,
    desc: "Открой нужную нейросеть. Она уже знает твои материалы. Работай — не отвлекайся на контекст.",
  },
]

const HowSection: Component = () => (
  <section id="how" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <p
        class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3"
      >
        Как это работает
      </p>
      <h2
        class="text-[32px] md:text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
        style={{ "letter-spacing": "-0.04em" }}
      >
        Три шага — две минуты.
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1px", background: "var(--color-border-subtle)" }}>
        <For each={STEPS}>
          {(step) => (
            <div class="bg-bg-canvas p-8 md:p-10 flex flex-col" style={{ gap: "24px" }}>
              <div class="flex items-start justify-between">
                <span
                  class="text-[48px] font-bold text-bg-elevated leading-none"
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

// ─── Value props ──────────────────────────────────────────────────────────

const VALUE_CARDS = [
  {
    Icon: Layers,
    title: "Одна память — для всех нейросетей",
    desc: "ChatGPT, Claude, Gemini, Perplexity — Contexter работает со всеми. Загрузи материалы один раз, и каждая нейросеть уже знает контекст.",
  },
  {
    Icon: FileStack,
    title: "Любой формат. Любой размер.",
    desc: "Договор, запись встречи, исследование, скрины, видео, фото, ссылки — Contexter читает всё. Никаких ограничений по размеру, никакого «формат не поддерживается».",
  },
  {
    Icon: Sparkles,
    title: "Не нужно быть программистом. Совсем.",
    desc: "Никакой настройки, никаких API-ключей, никакого кода. Загрузил файл, подключил нейросеть — всё работает. Если умеешь пользоваться почтой — справишься.",
  },
]

const FeaturesSection: Component = () => (
  <section id="features" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <p
        class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3"
      >
        Почему Contexter
      </p>
      <h2
        class="text-[32px] md:text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
        style={{ "letter-spacing": "-0.04em" }}
      >
        Всё что нужно. Ничего лишнего.
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3" style={{ gap: "24px" }}>
        <For each={VALUE_CARDS}>
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
              <h3 class="text-[16px] md:text-[16px] font-bold text-black leading-[1.2]">
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

// ─── Before / After ───────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  [
    "Каждый новый чат — с нуля.",
    "Каждый чат уже знает твою работу.",
  ],
  [
    "Год учил нейросеть — она всё забыла.",
    "Знания хранятся в Contexter. Никуда не исчезнут.",
  ],
  [
    "Контекст застрял в одной нейросети.",
    "Переключайся свободно. Память идёт с тобой.",
  ],
  [
    "Каждый раз загружаешь тот же PDF.",
    "Загрузил один раз — все нейросети получают доступ.",
  ],
  [
    "Записи, документы, заметки разбросаны.",
    "Одно место. Все нейросети читают отсюда.",
  ],
  [
    "Каждый день объясняешь одно и то же.",
    "AI помнит всё. Продолжаешь, где остановился.",
  ],
]

const BeforeAfterSection: Component = () => (
  <section class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <h2
        class="text-[32px] md:text-[32px] font-bold text-black mb-12 md:mb-16 leading-[1.2]"
        style={{ "letter-spacing": "-0.04em" }}
      >
        До и после
      </h2>

      <div class="border border-border-subtle bg-bg-canvas">
        <div
          class="grid grid-cols-2 border-b border-border-subtle bg-bg-surface"
        >
          <div
            class="px-4 py-3 md:px-8 md:py-4 text-xs md:text-[12px] uppercase tracking-[0.12em] font-medium text-text-disabled"
          >
            Без Contexter
          </div>
          <div
            class="px-4 py-3 md:px-8 md:py-4 text-xs md:text-[12px] uppercase tracking-[0.12em] font-medium text-accent border-l border-border-subtle"
          >
            С Contexter
          </div>
        </div>

        <For each={COMPARISON_ROWS}>
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

// ─── FAQ ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Мои данные в безопасности?",
    a: "Ваши файлы доступны только вам. Мы не используем документы для обучения нейросетей, не передаём их другим и не продаём данные.",
  },
  {
    q: "Нужны ли технические знания?",
    a: "Нет. Если умеете прикреплять файл к письму — справитесь. Ничего устанавливать не нужно, код писать не нужно.",
  },
  {
    q: "Чем это отличается от загрузки файлов в ChatGPT?",
    a: "Файл в ChatGPT живёт один чат. Закрыли — пропал. В Contexter загружаете один раз, и все нейросети получают доступ навсегда.",
  },
  {
    q: "Какие форматы поддерживаются?",
    a: "PDF, Word, PowerPoint, Excel, аудио (MP3, WAV), видео (MP4), изображения (JPG, PNG), текст и другие. Ограничений по размеру нет.",
  },
  {
    q: "Это бесплатно?",
    a: "Да, есть бесплатный тариф. Банковская карта не нужна.",
  },
]

const FAQItem: Component<{ q: string; a: string }> = (props) => {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="border-b border-border-subtle last:border-b-0">
      <button
        class="w-full flex items-center justify-between px-0 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span class="text-[16px] md:text-[16px] font-medium text-black pr-8">
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

const FAQSection: Component = () => (
  <section id="faq" class="py-16 md:py-20 bg-bg-canvas border-b border-border-subtle">
    <Container>
      <div class="grid grid-cols-1 lg:grid-cols-12" style={{ gap: "40px" }}>
        <div class="lg:col-span-4">
          <h2
            class="text-[32px] md:text-[32px] font-bold text-black leading-[1.2] lg:sticky lg:top-24"
            style={{ "letter-spacing": "-0.04em" }}
          >
            Частые вопросы
          </h2>
        </div>
        <div class="lg:col-span-8">
          <For each={FAQ_ITEMS}>
            {(item) => <FAQItem q={item.q} a={item.a} />}
          </For>
        </div>
      </div>
    </Container>
  </section>
)

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
        Работай в удовольствие,<br />а мы поможем всё сохранить.
      </h2>
      <p class="text-[16px] md:text-[16px] text-text-disabled leading-[1.5] mb-8 md:mb-10">
        Одна память для всех нейросетей. Без ограничений.
      </p>
      <button
        onClick={props.onCTA}
        class="bg-bg-canvas text-black text-[16px] font-medium px-8 py-4 hover:bg-bg-surface active:bg-bg-elevated transition-colors duration-[80ms] mb-4"
      >
        Попробовать бесплатно
      </button>
      <p class="text-xs text-text-secondary">
        Без банковской карты · Бесплатный тариф
      </p>
    </div>
  </section>
)

// ─── Footer ───────────────────────────────────────────────────────────────

const FOOTER_PRODUCT_LINKS = [
  { label: "Как это работает", href: "#how" },
  { label: "Возможности", href: "#features" },
  { label: "Цены", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

const FOOTER_COMPANY_LINKS = [
  { label: "Политика конфиденциальности", href: "/privacy" },
  { label: "Условия использования", href: "/terms" },
]

const Footer: Component = () => (
  <footer class="bg-black border-t border-black">
    <div class="max-w-[1280px] mx-auto px-6 md:px-16 py-10 md:py-12">
      <div class="grid grid-cols-1 md:grid-cols-12" style={{ gap: "40px" }}>
        <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
          <Logo size="md" variant="inverted" />
          <p class="text-xs text-text-tertiary">
            One memory. Every AI.
          </p>
          <p class="text-[12px] text-text-secondary mt-4">
            © 2026 Contexter
          </p>
        </div>

        <div class="md:col-span-4 flex flex-col" style={{ gap: "12px" }}>
          <span class="text-xs uppercase tracking-[0.12em] text-text-secondary font-medium">
            Продукт
          </span>
          <For each={FOOTER_PRODUCT_LINKS}>
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
          <span class="text-xs uppercase tracking-[0.12em] text-text-secondary font-medium">
            Компания
          </span>
          <For each={FOOTER_COMPANY_LINKS}>
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
    </div>
  </footer>
)

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
          ОДНА ПАМЯТЬ · ВСЕ НЕЙРОСЕТИ
        </span>

        <h1
          class="font-bold text-black leading-[1.2]"
          style={{
            "font-size": "clamp(32px, 4vw, 56px)",
            "letter-spacing": "-0.04em",
          }}
        >
          Все нейросети знают<br />
          тебя и твои проекты.
        </h1>

        <p
          class="text-[16px] md:text-[16px] text-text-secondary leading-[1.5] max-w-[560px]"
        >
          Загрузи документы один раз — и ChatGPT, Claude, Gemini автоматически знают весь контекст. Принимаем аудио, видео, ссылки, PDF и другие форматы без ограничений на размер.
        </p>

        <div class="flex flex-col items-center" style={{ gap: "12px" }}>
          <button
            onClick={props.onCTA}
            class="bg-accent text-white text-[16px] font-medium px-8 py-4 hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-[80ms]"
          >
            Попробовать бесплатно
          </button>
          <span class="text-xs text-text-secondary">
            Без банковской карты · Бесплатный тариф
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
