import { Component } from "solid-js";

interface SkeletonProps {
  class?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

/** Animated skeleton loading placeholder. */
const Skeleton: Component<SkeletonProps> = (props) => {
  return (
    <div
      class={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] ${props.rounded ?? "rounded-lg"} ${props.class ?? ""}`}
      style={{
        width: props.width ?? "100%",
        height: props.height ?? "20px",
      }}
    />
  );
};

/** Skeleton card for KB list loading state. */
export const SkeletonCard: Component = () => {
  return (
    <div class="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div class="flex items-start gap-4">
        <Skeleton width="48px" height="48px" rounded="rounded-xl" />
        <div class="flex-1 space-y-3">
          <Skeleton width="60%" height="16px" />
          <Skeleton width="80%" height="12px" />
          <div class="flex gap-4 pt-1">
            <Skeleton width="80px" height="12px" />
            <Skeleton width="100px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Skeleton table row for tab loading states. */
export const SkeletonRow: Component = () => {
  return (
    <div class="flex items-center gap-4 px-6 py-4">
      <Skeleton width="32px" height="32px" rounded="rounded-full" />
      <div class="flex-1 space-y-2">
        <Skeleton width="40%" height="14px" />
        <Skeleton width="60%" height="12px" />
      </div>
      <Skeleton width="70px" height="24px" rounded="rounded-full" />
    </div>
  );
};

export default Skeleton;
