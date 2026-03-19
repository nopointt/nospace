import { Component, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import type { JSX } from "solid-js";
import { useSession } from "~/lib/auth-client";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ToastContainer from "~/components/ui/Toast";

interface ProtectedLayoutProps {
  children: JSX.Element;
}

const ProtectedLayout: Component<ProtectedLayoutProps> = (props) => {
  const session = useSession();
  const navigate = useNavigate();

  createEffect(() => {
    // Redirect to login if not authenticated
    const s = session();
    if (s !== undefined && !s?.data?.user) {
      navigate("/login", { replace: true });
    }
  });

  return (
    <Show
      when={session()?.data?.user}
      fallback={
        <div class="min-h-screen flex items-center justify-center bg-neutral-50">
          <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <div class="flex flex-col h-screen bg-neutral-50">
        <Header />
        <div class="flex flex-1 overflow-hidden">
          <Sidebar />
          <main class="flex-1 overflow-auto">{props.children}</main>
        </div>
      </div>
      <ToastContainer />
    </Show>
  );
};

export default ProtectedLayout;
