import type { ReactNode } from 'react';

// Self-drawn line icons (no icon package). They use currentColor, so CSS sets their colour.

export interface IconProps {
  className?: string;
}

function NavIcon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </NavIcon>
  );
}

export function InstancesIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M12 3 2 8l10 5 10-5z" />
      <path d="m2 12.5 10 5 10-5" />
      <path d="m2 17 10 5 10-5" />
    </NavIcon>
  );
}

export function ServersIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </NavIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M4 6h3M11 6h9M4 12h9M17 12h3M4 18h1M9 18h11" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="7" cy="18" r="2" />
    </NavIcon>
  );
}

export function AboutIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5h.01" />
    </NavIcon>
  );
}

// Action icons, same line style as the navigation icons.

export function PlusIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </NavIcon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </NavIcon>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </NavIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </NavIcon>
  );
}

// Window control icons: 10x10 px with sharp 1px lines, like the Windows title bar.

function WindowIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MinimizeIcon() {
  return (
    <WindowIcon>
      <path d="M0 5.5h10" />
    </WindowIcon>
  );
}

export function MaximizeIcon() {
  return (
    <WindowIcon>
      <rect x="0.5" y="0.5" width="9" height="9" />
    </WindowIcon>
  );
}

export function RestoreIcon() {
  return (
    <WindowIcon>
      <rect x="0.5" y="2.5" width="7" height="7" />
      <path d="M2.5 2.5v-2h7v7h-2" />
    </WindowIcon>
  );
}

export function CloseIcon() {
  return (
    <WindowIcon>
      <path d="M0 0l10 10M10 0 0 10" shapeRendering="geometricPrecision" />
    </WindowIcon>
  );
}
