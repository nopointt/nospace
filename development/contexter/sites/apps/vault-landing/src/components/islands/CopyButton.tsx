import { createSignal } from "solid-js";

interface Props {
  text: string;
  variant?: "primary" | "inline";
}

export default function CopyButton(props: Props) {
  const [copied, setCopied] = createSignal(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(props.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // Fallback: select text via a hidden textarea
      const ta = document.createElement("textarea");
      ta.value = props.text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(ta);
    }
  };

  const variant = props.variant ?? "primary";

  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={handleClick}
        class="font-mono text-sm bg-[#F5F501] text-[#333333] px-5 py-3 hover:opacity-90 transition-opacity lowercase flex items-center gap-2"
        aria-label={`Copy command: ${props.text}`}
      >
        <span>{props.text}</span>
        <span class="text-xs opacity-70">{copied() ? "copied" : "copy"}</span>
      </button>
    );
  }

  // inline variant for the InstallCTA bottom section (on yellow bg)
  return (
    <div class="flex items-center justify-between bg-[#333333] text-[#F5F501] px-4 py-3 font-mono text-sm w-full">
      <code>{props.text}</code>
      <button
        type="button"
        onClick={handleClick}
        class="text-xs text-[#CCCCCC] hover:text-[#FAFAFA] ml-4 lowercase"
        aria-label={`Copy: ${props.text}`}
      >
        {copied() ? "copied" : "copy"}
      </button>
    </div>
  );
}
