import {
    Component,
    ErrorBoundary as SolidErrorBoundary,
    createSignal,
} from "solid-js";
import type { JSX } from "solid-js";

interface Props {
    children: JSX.Element;
    fallback?: JSX.Element;
}

const ErrorBoundary: Component<Props> = (props) => {
    const [, setHasError] = createSignal(false);
    const [error, setError] = createSignal<Error | null>(null);

    return (
        <SolidErrorBoundary
            fallback={(err) => {
                setHasError(true);
                setError(err instanceof Error ? err : new Error(String(err)));
                console.error("Frame error:", err);
                return (
                    <div class="p-4 h-full flex flex-col items-center justify-center bg-h-surface text-center">
                        <div class="text-sm font-mono text-h-red mb-2">
                            Frame crashed
                        </div>
                        <div class="text-xs font-mono text-h-text-4 max-w-[200px] truncate">
                            {error()?.toString().slice(0, 80)}
                        </div>
                        <button
                            onClick={() => {
                                setHasError(false);
                                setError(null);
                                window.location.reload();
                            }}
                            class="mt-4 px-3 py-1 text-xs font-sans font-semibold bg-h-blue/10 hover:bg-h-blue/20 border border-h-blue/30 text-h-blue rounded transition-all"
                        >
                            Reload
                        </button>
                    </div>
                );
            }}
        >
            {props.children}
        </SolidErrorBoundary>
    );
};

export default ErrorBoundary;
