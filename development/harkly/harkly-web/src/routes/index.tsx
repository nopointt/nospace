import { Title } from "@solidjs/meta";

export default function Home() {
  return (
    <main class="min-h-screen flex items-center justify-center bg-white">
      <Title>Harkly — Данные в структуру</Title>
      <div class="text-center">
        <h1 class="text-4xl font-bold text-neutral-900 mb-4">Harkly</h1>
        <p class="text-lg text-neutral-600">Любые данные → структурированная база → любая LLM</p>
      </div>
    </main>
  );
}
