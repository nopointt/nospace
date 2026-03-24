import type { Component } from "solid-js"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "display"
  variant?: "primary" | "inverted" | "compact"
}

const sizeMap = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-[32px]",
  display: "text-[48px]",
}

const Logo: Component<LogoProps> = (props) => {
  const size = () => sizeMap[props.size ?? "md"]
  const isInverted = () => props.variant === "inverted"

  return (
    <span
      class={`font-mono font-medium tracking-[-0.04em] select-none ${size()}`}
      style={{ "line-height": "1" }}
    >
      <span class={isInverted() ? "text-white" : "text-black"}>con</span>
      <span class="text-accent">[</span>
      <span class="text-accent">text</span>
      <span class="text-accent">]</span>
      <span class={isInverted() ? "text-white" : "text-black"}>er</span>
    </span>
  )
}

export default Logo
