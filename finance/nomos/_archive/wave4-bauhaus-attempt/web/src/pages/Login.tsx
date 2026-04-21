import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { setToken, isAuthenticated } from "../lib/auth";
import { endpoints, ApiError } from "../lib/api";
import { Button, Input } from "../components/primitives";

export default function Login() {
  const navigate = useNavigate();
  const [input, setInput] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  if (isAuthenticated()) {
    navigate("/", { replace: true });
  }

  const submit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setToken(input());
    try {
      await endpoints.balance();
      navigate("/", { replace: true });
    } catch (err) {
      setToken(null);
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid token.");
      } else {
        setError(err instanceof Error ? err.message : "Connection failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="flex items-center justify-center mb-8">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect x="0" y="0" width="32" height="32" fill="var(--color-yellow)" />
            <rect x="32" y="0" width="32" height="32" fill="var(--color-red)" />
            <rect x="0" y="32" width="32" height="32" fill="var(--color-blue)" />
            <rect x="32" y="32" width="32" height="32" fill="var(--color-ink-primary)" />
          </svg>
        </div>
        <h1 class="text-center text-xl font-bold mb-2">Nomos</h1>
        <p class="text-center text-sm text-[var(--color-ink-secondary)] mb-8">
          Trading dashboard
        </p>
        <form onSubmit={submit} class="space-y-4">
          <div>
            <label for="token" class="block text-xs uppercase mb-1 text-[var(--color-ink-secondary)]">
              Auth token
            </label>
            <Input
              id="token"
              type="password"
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              placeholder="paste bearer token"
              required
            />
          </div>
          <Show when={error()}>
            <div class="text-sm text-[var(--color-danger)]">{error()}</div>
          </Show>
          <Button type="submit" disabled={loading() || !input()} size="lg">
            {loading() ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
