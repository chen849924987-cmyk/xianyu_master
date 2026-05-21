/** 控制台用 SVG 图标（HeroUI 风格，stroke 2） */

import type { ReactNode } from "react";

export type IconProps = { className?: string; size?: number };

const defaultSize = 20;

function IconBase({
  className,
  size = defaultSize,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconLayout({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </IconBase>
  );
}

export function IconClock({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </IconBase>
  );
}

export function IconScroll({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </IconBase>
  );
}

export function IconShield({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </IconBase>
  );
}

export function IconPlay({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconPlus({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function IconRefresh({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </IconBase>
  );
}

export function IconTrash({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </IconBase>
  );
}

export function IconEdit({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </IconBase>
  );
}

export function IconX({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M18 6 6 18M6 6l12 12" />
    </IconBase>
  );
}

export function IconCheck({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M20 6 9 17l-5-5" />
    </IconBase>
  );
}

export function IconBolt({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconList({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </IconBase>
  );
}

export function IconBox({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </IconBase>
  );
}

export function IconSearch({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </IconBase>
  );
}

export function IconTool({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </IconBase>
  );
}

export function IconBook({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </IconBase>
  );
}

export function IconImport({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </IconBase>
  );
}

export function IconFolder({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </IconBase>
  );
}

export function IconExternal({ className, size }: IconProps) {
  return (
    <IconBase className={className} size={size}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </IconBase>
  );
}
