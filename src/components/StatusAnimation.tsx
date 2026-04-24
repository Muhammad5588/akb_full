import { useEffect, useState } from 'react';

interface StatusAnimationProps {
  status: 'loading' | 'success' | 'error';
  message?: string;
  onComplete?: () => void;
}

const STYLES = `
  @keyframes sa-in {
    0%   { opacity: 0; transform: translateY(20px) scale(.95); }
    100% { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  @keyframes sa-bd {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sa-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes sa-ping {
    0%   { transform: scale(1);   opacity: .5; }
    100% { transform: scale(1.8); opacity: 0;  }
  }
  @keyframes sa-pop {
    0%   { transform: scale(0);    opacity: 0; }
    55%  { transform: scale(1.18);             }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes sa-shake {
    0%,100% { transform: translateX(0);   }
    20%,60% { transform: translateX(-8px);}
    40%,80% { transform: translateX(8px); }
  }
  @keyframes sa-dot {
    0%,100% { opacity: .3; transform: scaleY(.6); }
    50%     { opacity: 1;  transform: scaleY(1);  }
  }
  @keyframes sa-scan {
    0%   { top: 0%;   opacity: .8; }
    100% { top: 100%; opacity: 0;  }
  }
  @keyframes sa-check {
    to { stroke-dashoffset: 0; }
  }
  @keyframes sa-x {
    to { stroke-dashoffset: 0; }
  }

  .sa-backdrop { animation: sa-bd   .25s ease forwards; }
  .sa-card     { animation: sa-in   .4s  cubic-bezier(.34,1.36,.64,1) forwards; }
  .sa-pop      { animation: sa-pop  .55s cubic-bezier(.34,1.46,.64,1) forwards; }
  .sa-shake    { animation: sa-shake .6s ease; }
  .sa-spin     { animation: sa-spin 1.1s linear infinite; }
  .sa-ping     { animation: sa-ping 1.5s ease-out infinite; }

  .sa-dot      { animation: sa-dot 1.2s ease-in-out infinite; }
  .sa-dot:nth-child(2) { animation-delay: .18s; }
  .sa-dot:nth-child(3) { animation-delay: .36s; }

  .sa-scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,.7), transparent);
    animation: sa-scan 1.8s ease-in-out infinite;
    pointer-events: none;
  }

  .sa-check-path {
    stroke-dasharray: 32;
    stroke-dashoffset: 32;
    animation: sa-check .5s ease .1s forwards;
  }
  .sa-x-path1, .sa-x-path2 {
    stroke-dasharray: 22;
    stroke-dashoffset: 22;
  }
  .sa-x-path1 { animation: sa-x .35s ease .05s forwards; }
  .sa-x-path2 { animation: sa-x .35s ease .18s forwards; }
`;

// ── renk tokenlari ────────────────────────────────────────────
const T = {
  loading: {
    ring:   '#bfdbfe',
    stroke: '#3b82f6',
    text:   '#1d4ed8',
    dot:    '#60a5fa',
    glow:   'rgba(59,130,246,.18)',
  },
  success: {
    ring:   '#bbf7d0',
    stroke: '#22c55e',
    text:   '#15803d',
    dot:    '#4ade80',
    glow:   'rgba(34,197,94,.18)',
  },
  error: {
    ring:   '#fecaca',
    stroke: '#ef4444',
    text:   '#b91c1c',
    dot:    '#f87171',
    glow:   'rgba(239,68,68,.18)',
  },
} as const;

// ── SVG ikonkalar ─────────────────────────────────────────────
function SpinnerIcon({ color }: { color: string }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="sa-spin">
      <circle cx="32" cy="32" r="26" stroke={color} strokeOpacity=".18" strokeWidth="4" />
      <circle cx="32" cy="32" r="26" stroke={color} strokeWidth="4"
              strokeLinecap="round" strokeDasharray="44 120" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="sa-pop">
      <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeOpacity=".2" strokeWidth="1" />
      <polyline className="sa-check-path"
        points="18,33 28,43 46,23"
        fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ color }: { color: string }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="sa-shake">
      <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeOpacity=".2" strokeWidth="1" />
      <line className="sa-x-path1" x1="21" y1="21" x2="43" y2="43"
            stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line className="sa-x-path2" x1="43" y1="21" x2="21" y2="43"
            stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// ── asosiy komponent ──────────────────────────────────────────
export default function StatusAnimation({ status, message, onComplete }: StatusAnimationProps) {
  const [visible, setVisible] = useState(false);
  const c = T[status];

  useEffect(() => {
    queueMicrotask(() => setVisible(true));
    if (status !== 'loading' && onComplete) {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [status, onComplete]);

  return (
    <>
      <style>{STYLES}</style>

      {/* backdrop */}
      <div
        className="sa-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(7,19,39,.72)',
          opacity: visible ? 1 : 0,
          fontFamily: 'system-ui,-apple-system,sans-serif',
        }}
      >
        {/* card */}
        <div
          className="sa-card"
          style={{
            position: 'relative',
            background: 'linear-gradient(160deg,#f7fbff 0%,#eff6ff 100%)',
            borderRadius: 20,
            border: '1px solid #dbeafe',
            padding: '36px 32px',
            minWidth: 260,
            maxWidth: 320,
            margin: '0 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            overflow: 'hidden',
          }}
        >
          {/* top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${c.stroke}, transparent)`,
          }} />

          {/* scan line — faqat loading holatida */}
          {status === 'loading' && <div className="sa-scan-line" />}

          {/* icon area */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* ping halqa */}
            <div
              className="sa-ping"
              style={{
                position: 'absolute',
                width: 80, height: 80,
                borderRadius: '50%',
                border: `1.5px solid ${c.ring}`,
              }}
            />

            {/* glow */}
            <div style={{
              position: 'absolute',
              width: 64, height: 64,
              borderRadius: '50%',
              background: c.glow,
              filter: 'blur(12px)',
            }} />

            {status === 'loading' && <SpinnerIcon color={c.stroke} />}
            {status === 'success'  && <CheckIcon  color={c.stroke} />}
            {status === 'error'    && <CrossIcon  color={c.stroke} />}
          </div>

          {/* xabar */}
          {message && (
            <p style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 500,
              color: c.text,
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              {message}
            </p>
          )}

          {/* loading dots */}
          {status === 'loading' && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => (
                <span
                  key={i}
                  className="sa-dot"
                  style={{
                    display: 'inline-block',
                    width: 5, height: 14,
                    borderRadius: 99,
                    background: c.dot,
                  }}
                />
              ))}
            </div>
          )}

          {/* pastki chegara */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${c.ring}, transparent)`,
          }} />
        </div>
      </div>
    </>
  );
}