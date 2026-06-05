// Custom PWA-style phone frame matching the Jubelee customer screenshot.
// (rounded rectangle, custom status bar with HH:MM + WiFi dots, no iOS dynamic island)

function StatusBar({ time = '13:15', dark = false, signal = 'WiFi 76%' }) {
  const color = dark ? '#f6f4ef' : '#1a1814';
  const dim = dark ? 'rgba(246,244,239,0.55)' : 'rgba(26,24,20,0.45)';
  return (
    <div className={'pf-status' + (dark ? ' dark' : '')} style={{ color }}>
      <span>{time}</span>
      <div className="right">
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginRight: 4 }}>
          {[0.35, 0.55, 0.75, 1].map((o, i) => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: color, opacity: o,
            }} />
          ))}
        </span>
        <span style={{ color: dim, fontWeight: 500 }}>{signal}</span>
      </div>
    </div>
  );
}

// PhoneFrame puts the status bar in-flow so dark screens get a fully dark top.
function PhoneFrame({ children, statusDark = false, statusTime = '13:15', signal = 'WiFi 76%', headerBg }) {
  return (
    <div className="pf">
      <div style={{ background: headerBg || 'transparent', flexShrink: 0 }}>
        <StatusBar dark={statusDark} time={statusTime} signal={signal} />
      </div>
      <div className="pf-screen">
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { PhoneFrame, StatusBar });
