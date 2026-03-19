import { Component, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useSession, signOut } from "~/lib/auth-client";

const Header: Component = () => {
  const session = useSession();
  const [showMenu, setShowMenu] = createSignal(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const userEmail = () => session()?.data?.user?.email ?? "";
  const userName = () => session()?.data?.user?.name ?? "";

  return (
    <header class="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <A href="/" class="flex items-center gap-2">
        <span class="text-lg font-bold text-neutral-900 tracking-tight">
          Harkly
        </span>
      </A>

      <div class="relative">
        <button
          onClick={() => setShowMenu((p) => !p)}
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <div class="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-600">
            {(userName() || userEmail())[0]?.toUpperCase() ?? "?"}
          </div>
          <span class="text-sm text-neutral-700 max-w-[150px] truncate hidden sm:block">
            {userName() || userEmail()}
          </span>
          <svg
            class="w-4 h-4 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <Show when={showMenu()}>
          <div
            class="absolute right-0 top-full mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-50"
            onMouseLeave={() => setShowMenu(false)}
          >
            <div class="px-4 py-2 border-b border-neutral-100">
              <p class="text-sm font-medium text-neutral-900 truncate">
                {userName()}
              </p>
              <p class="text-xs text-neutral-500 truncate">{userEmail()}</p>
            </div>
            <button
              onClick={handleSignOut}
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Выйти
            </button>
          </div>
        </Show>
      </div>
    </header>
  );
};

export default Header;
