type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function I({
  size = 22,
  color = "currentColor",
  strokeWidth = 1.75,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <I {...p}>
    <path d="M3.5 11.5L12 4l8.5 7.5" />
    <path d="M5.5 10.5V20a.5.5 0 0 0 .5.5h4.5v-6h3v6H18a.5.5 0 0 0 .5-.5v-9.5" />
  </I>
);

export const IconUsers = (p: IconProps) => (
  <I {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 19.5c.7-3.2 3.4-5 6.5-5s5.8 1.8 6.5 5" />
    <path d="M15.5 4.5a3 3 0 0 1 0 6" />
    <path d="M17.5 14.5c2.4.3 4.2 1.9 4.8 4.7" />
  </I>
);

export const IconScan = (p: IconProps) => (
  <I {...p}>
    <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5" />
    <path d="M20 8.5V6a2 2 0 0 0-2-2h-2.5" />
    <path d="M4 15.5V18a2 2 0 0 0 2 2h2.5" />
    <path d="M20 15.5V18a2 2 0 0 1-2 2h-2.5" />
    <path d="M4 12h16" />
  </I>
);

export const IconActivity = (p: IconProps) => (
  <I {...p}>
    <path d="M3.5 12.5h3.5l2-6 4 12 2-6h5.5" />
  </I>
);

export const IconAccount = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.5 20.5c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8" />
  </I>
);

export const IconChevronLeft = (p: IconProps) => (
  <I {...p}><path d="M14.5 5.5L8 12l6.5 6.5" /></I>
);

export const IconChevronRight = (p: IconProps) => (
  <I {...p}><path d="M9.5 5.5L16 12l-6.5 6.5" /></I>
);

export const IconClose = (p: IconProps) => (
  <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>
);

export const IconCheck = (p: IconProps) => (
  <I {...p}><path d="M5 12.5l4.5 4.5L19 7" /></I>
);

export const IconPlus = (p: IconProps) => (
  <I {...p}><path d="M12 5v14M5 12h14" /></I>
);

export const IconSearch = (p: IconProps) => (
  <I {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </I>
);

export const IconBell = (p: IconProps) => (
  <I {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </I>
);

export const IconGift = (p: IconProps) => (
  <I {...p}>
    <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
    <path d="M3.5 9V7.5h17V9" />
    <path d="M12 9v11.5" />
    <path d="M12 9c-3 0-4.5-1-4.5-2.5S9 4 12 9zM12 9c3 0 4.5-1 4.5-2.5S15 4 12 9z" />
  </I>
);

export const IconUser = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M5 19.5c1-3.5 3.5-5 7-5s6 1.5 7 5" />
  </I>
);

export const IconPhone = (p: IconProps) => (
  <I {...p}>
    <path d="M5 4.5h3l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 3 6.5a2 2 0 0 1 2-2z" />
  </I>
);

export const IconMail = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="M3 7l9 6 9-6" />
  </I>
);

export const IconShield = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9.5-4.5-1.5-8-4.5-8-9.5V6z" />
  </I>
);

export const IconReceipt = (p: IconProps) => (
  <I {...p}>
    <path d="M5.5 4h13v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" />
    <path d="M9 9.5h6M9 13h6M9 16h3" />
  </I>
);

export const IconLogout = (p: IconProps) => (
  <I {...p}>
    <path d="M9 4.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H9" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </I>
);

export const IconFlash = (p: IconProps) => (
  <I {...p}><path d="M13 3L4.5 14h6.5L10 21l8.5-11H12z" /></I>
);

export const IconClock = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
);

export const IconStore = (p: IconProps) => (
  <I {...p}>
    <path d="M3.5 9.5L5 5h14l1.5 4.5" />
    <path d="M4 9.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    <path d="M9 20v-5h6v5" />
  </I>
);

export const IconBackspace = (p: IconProps) => (
  <I {...p}><path d="M12 5v14M6 13l6 6 6-6" /></I>
);

