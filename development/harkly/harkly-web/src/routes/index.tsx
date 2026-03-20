import { Title } from "@solidjs/meta";
import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useSession } from "~/lib/auth-client";

export default function Home() {
  const session = useSession();
  const navigate = useNavigate();

  onMount(() => {
    // If already authenticated, go straight to dashboard
    const check = () => {
      if (session()?.data?.user) {
        navigate("/kb", { replace: true });
      }
    };
    check();
    // Re-check after session loads (async)
    setTimeout(check, 1000);
  });

  return (
    <main class="min-h-screen flex items-center justify-center bg-[#FFFAF5]">
      <Title>Harkly — Данные в структуру</Title>
      <div class="text-center max-w-lg px-6">
        <h1 class="text-4xl font-bold text-neutral-900 mb-4">Harkly</h1>
        <p class="text-lg text-neutral-600 mb-8">
          Любые данные → структурированная база → любая LLM
        </p>
        <div class="flex items-center justify-center gap-4">
          <a
            href="/login"
            class="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
          >
            Войти
          </a>
          <a
            href="/register"
            class="px-6 py-3 bg-white text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 border border-neutral-200 transition-colors"
          >
            Зарегистрироваться
          </a>
        </div>
      </div>
    </main>
  );
}
