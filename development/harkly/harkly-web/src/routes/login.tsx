import { Title } from "@solidjs/meta";
import { A, useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { signIn } from "~/lib/auth-client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email: email(),
        password: password(),
      });

      if (!result.error) {
        navigate("/kb", { replace: true });
      } else {
        setError(result.error.message || "Ошибка входа. Проверьте email и пароль.");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка входа. Проверьте email и пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="min-h-screen flex items-center justify-center bg-neutral-50">
      <Title>Вход — Harkly</Title>
      <div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-neutral-200">
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">Вход</h1>
        <p class="text-neutral-600 mb-6">Войдите в свой аккаунт</p>

        <Show when={error()}>
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error()}
          </div>
        </Show>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-neutral-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Ваш пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading()}
            class="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading() ? "Вход..." : "Войти"}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-neutral-600">
          Нет аккаунта?{" "}
          <A href="/register" class="text-blue-600 hover:text-blue-700 font-medium">
            Зарегистрироваться
          </A>
        </p>
      </div>
    </main>
  );
}
