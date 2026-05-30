// SVG icon set for the Jubelee Staff app.
// Stroke width 1.75, line caps/joins rounded. Pass color via prop or inherit currentColor.

const I = ({ size = 22, children, stroke = 'currentColor', sw = 1.75, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IconHome = (p) => <I {...p}>
  <path d="M3.5 11.5L12 4l8.5 7.5" />
  <path d="M5.5 10.5V20a.5.5 0 0 0 .5.5h4.5v-6h3v6H18a.5.5 0 0 0 .5-.5v-9.5" />
</I>;

const IconUsers = (p) => <I {...p}>
  <circle cx="9" cy="8.5" r="3.5" />
  <path d="M2.5 19.5c.7-3.2 3.4-5 6.5-5s5.8 1.8 6.5 5" />
  <path d="M15.5 4.5a3 3 0 0 1 0 6" />
  <path d="M17.5 14.5c2.4.3 4.2 1.9 4.8 4.7" />
</I>;

const IconScan = (p) => <I {...p}>
  <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5" />
  <path d="M20 8.5V6a2 2 0 0 0-2-2h-2.5" />
  <path d="M4 15.5V18a2 2 0 0 0 2 2h2.5" />
  <path d="M20 15.5V18a2 2 0 0 1-2 2h-2.5" />
  <path d="M4 12h16" />
</I>;

const IconActivity = (p) => <I {...p}>
  <path d="M3.5 12.5h3.5l2-6 4 12 2-6h5.5" />
</I>;

const IconAccount = (p) => <I {...p}>
  <circle cx="12" cy="8.5" r="3.7" />
  <path d="M4.5 20.5c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8" />
</I>;

const IconChevronLeft = (p) => <I {...p}><path d="M14.5 5.5L8 12l6.5 6.5" /></I>;
const IconChevronRight = (p) => <I {...p}><path d="M9.5 5.5L16 12l-6.5 6.5" /></I>;
const IconClose = (p) => <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>;
const IconCheck = (p) => <I {...p}><path d="M5 12.5l4.5 4.5L19 7" /></I>;
const IconPlus = (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
const IconSearch = (p) => <I {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></I>;
const IconBell = (p) => <I {...p}>
  <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5z" />
  <path d="M10 20.5a2 2 0 0 0 4 0" />
</I>;
const IconGift = (p) => <I {...p}>
  <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
  <path d="M3.5 9V7.5h17V9" />
  <path d="M12 9v11.5" />
  <path d="M12 9c-3 0-4.5-1-4.5-2.5S9 4 12 9zM12 9c3 0 4.5-1 4.5-2.5S15 4 12 9z" />
</I>;
const IconCoffee = (p) => <I {...p}>
  <path d="M3.5 8.5h13v6a4 4 0 0 1-4 4h-5a4 4 0 0 1-4-4z" />
  <path d="M16.5 10h2a2 2 0 0 1 0 4h-2" />
  <path d="M7 4.5c.5 1 0 2-.5 3M10.5 4.5c.5 1 0 2-.5 3" />
</I>;
const IconPhone = (p) => <I {...p}>
  <path d="M5 4.5h3l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 3 6.5a2 2 0 0 1 2-2z" />
</I>;
const IconMail = (p) => <I {...p}>
  <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
  <path d="M3 7l9 6 9-6" />
</I>;
const IconUser = (p) => <I {...p}>
  <circle cx="12" cy="8.5" r="3.7" />
  <path d="M5 19.5c1-3.5 3.5-5 7-5s6 1.5 7 5" />
</I>;
const IconStar = (p) => <I {...p}>
  <path d="M12 3l2.5 6 6.5.6-5 4.4 1.5 6.4-5.5-3.4-5.5 3.4 1.5-6.4-5-4.4 6.5-.6z" />
</I>;
const IconShield = (p) => <I {...p}>
  <path d="M12 3l8 3v6c0 5-3.5 8-8 9.5-4.5-1.5-8-4.5-8-9.5V6z" />
</I>;
const IconReceipt = (p) => <I {...p}>
  <path d="M5.5 4h13v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" />
  <path d="M9 9.5h6M9 13h6M9 16h3" />
</I>;
const IconLogout = (p) => <I {...p}>
  <path d="M9 4.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H9" />
  <path d="M15 8l4 4-4 4M19 12H9" />
</I>;
const IconQR = (p) => <I {...p} sw={1.4}>
  <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
  <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
  <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
  <rect x="6" y="6" width="2" height="2" fill="currentColor" stroke="none" />
  <rect x="16" y="6" width="2" height="2" fill="currentColor" stroke="none" />
  <rect x="6" y="16" width="2" height="2" fill="currentColor" stroke="none" />
  <path d="M13.5 13.5h3v3M20.5 13.5v3M13.5 20.5h3M16.5 17h4v4" />
</I>;
const IconFlash = (p) => <I {...p}>
  <path d="M13 3L4.5 14h6.5L10 21l8.5-11H12z" />
</I>;
const IconSwap = (p) => <I {...p}>
  <path d="M4 8h13l-3-3M20 16H7l3 3" />
</I>;
const IconClock = (p) => <I {...p}>
  <circle cx="12" cy="12" r="8.5" />
  <path d="M12 7.5V12l3 2" />
</I>;
const IconArrowDown = (p) => <I {...p}><path d="M12 5v14M6 13l6 6 6-6" /></I>;
const IconStore = (p) => <I {...p}>
  <path d="M3.5 9.5L5 5h14l1.5 4.5" />
  <path d="M4 9.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
  <path d="M9 20v-5h6v5" />
</I>;

const IconWallet = (p) => <I {...p}>
  <path d="M3 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1h1.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2z" />
  <circle cx="17.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
</I>;

const IconMap = (p) => <I {...p}>
  <path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" />
  <path d="M9 4.5v13M15 6.5v13" />
</I>;

const IconPin = (p) => <I {...p}>
  <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
  <circle cx="12" cy="9" r="2.5" />
</I>;

const IconCompass = (p) => <I {...p}>
  <circle cx="12" cy="12" r="8.5" />
  <path d="M15.5 8.5l-1.5 5-5 1.5 1.5-5z" />
</I>;

const IconCalendar = (p) => <I {...p}>
  <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
  <path d="M3.5 10h17M8 3v4M16 3v4" />
</I>;

const IconMegaphone = (p) => <I {...p}>
  <path d="M4 10v4a2 2 0 0 0 2 2h2l8 4V4l-8 4H6a2 2 0 0 0-2 2z" />
  <path d="M18 9c1.5 1 1.5 5 0 6" />
</I>;

const IconHeart = (p) => <I {...p}>
  <path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 7-3.5A4.5 4.5 0 0 1 19 10c0 5.5-7 10-7 10z" />
</I>;

const IconSparkle = (p) => <I {...p}>
  <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 4l.8 2.4L22 7l-2.2.6L19 10l-.8-2.4L16 7l2.2-.6z" fill="currentColor" stroke="none" />
</I>;

const IconBookmark = (p) => <I {...p}>
  <path d="M6 4.5h12v17l-6-4-6 4z" />
</I>;

const IconClipboard = (p) => <I {...p}>
  <rect x="6" y="4.5" width="12" height="16" rx="2" />
  <rect x="9" y="3" width="6" height="3" rx="1" />
  <path d="M9.5 11h5M9.5 14h5M9.5 17h3" />
</I>;

const IconHistory2 = (p) => <I {...p}>
  <path d="M3.5 12a8.5 8.5 0 1 0 2-5.5L3.5 4.5v4h4" />
  <path d="M12 7.5V12l3 2" />
</I>;

// Brand wordmark + logomark
function Wordmark({ size = 22, color }) {
  // Use the PNG mark + serif text "Jubelee"
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: size + 12, height: size + 12, borderRadius: 10,
        background: 'var(--card)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <LogoMark size={size} />
      </span>
      <span className="serif" style={{
        fontSize: size + 4, lineHeight: 1, color: color || 'var(--ink)',
        fontStyle: 'italic',
      }}>Jubelee</span>
    </span>
  );
}

function LogoMark({ size = 22, gold = '#d4ae6c' }) {
  // Simplified vector: a 4-point star + curving J. Stylized but recognizable.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill={gold} style={{ display: 'block' }}>
      {/* 4-point star */}
      <path d="M44 4 L48 22 L62 26 L48 30 L44 48 L40 30 L26 26 L40 22 Z" />
      {/* J letter */}
      <path d="M30 18 L38 18 L38 42 Q38 54 26 56 Q14 57 8 48 L14 42 Q18 48 24 47 Q30 46 30 38 Z" />
    </svg>
  );
}

function StarSparkle({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M16 2 L18 9 L25 11 L18 13 L16 20 L14 13 L7 11 L14 9 Z" />
    </svg>
  );
}

Object.assign(window, {
  IconHome, IconUsers, IconScan, IconActivity, IconAccount,
  IconChevronLeft, IconChevronRight, IconClose, IconCheck, IconPlus,
  IconSearch, IconBell, IconGift, IconCoffee, IconPhone, IconMail,
  IconUser, IconStar, IconShield, IconReceipt, IconLogout, IconQR,
  IconFlash, IconSwap, IconClock, IconArrowDown, IconStore,
  IconWallet, IconMap, IconPin, IconCompass, IconCalendar, IconMegaphone,
  IconHeart, IconSparkle, IconBookmark, IconClipboard, IconHistory2,
  Wordmark, LogoMark, StarSparkle,
});
