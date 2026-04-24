import { useEffect, useState } from 'react';

interface TelegramWebAppGuardProps {
  children: React.ReactNode;
}

// ── Animatsiyalar ──────────────────────────────────────────────
const STYLES = `
  @keyframes spin-ring {
    to { transform: rotate(360deg); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 0.25; transform: scale(0.85); }
    50%       { opacity: 1;    transform: scale(1);    }
  }
  @keyframes bar-fill {
    0%   { width: 0%;   }
    30%  { width: 45%;  }
    65%  { width: 72%;  }
    100% { width: 92%;  }
  }
  @keyframes line-in {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  .fade-up        { animation: fade-up  0.5s ease-out both; }
  .fade-up-d1     { animation: fade-up  0.5s ease-out 0.12s both; }
  .fade-up-d2     { animation: fade-up  0.5s ease-out 0.24s both; }

  .spin-ring      { animation: spin-ring 1.4s linear infinite; }
  .bar-fill       { animation: bar-fill  2.6s ease-out forwards; }

  .dot { animation: pulse-dot 1.6s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay: 0.22s; }
  .dot:nth-child(3) { animation-delay: 0.44s; }

  .line-in {
    transform-origin: left center;
    animation: line-in 0.5s cubic-bezier(.4,0,.2,1) 0.1s both;
  }
`;

// ── Loading ────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg,#f7fbff 0%,#f4f8fc 50%,#eef5fb 100%)',
      padding: '24px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>
      <style>{STYLES}</style>

      {/* Logo ring */}
      <div className="fade-up" style={{ position: 'relative', width: 96, height: 96, marginBottom: 32 }}>

        {/* Outer spinner ring */}
        <svg
          className="spin-ring"
          width={96} height={96}
          viewBox="0 0 96 96"
          style={{ position: 'absolute', inset: 0 }}
        >
          <circle
            cx="48" cy="48" r="44"
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <circle
            cx="48" cy="48" r="44"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="72 206"
          />
        </svg>

        {/* Center badge */}
        <div style={{
          position: 'absolute',
          inset: 8,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#1d4ed8',
          }}>AKB</span>
        </div>
      </div>

      {/* Text block */}
      <div className="fade-up-d1" style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: '#1e3a5f', margin: '0 0 6px' }}>
          AKB Cargo
        </p>
        <p style={{ fontSize: 13, color: '#7ba7c7', margin: 0, letterSpacing: '0.01em' }}>
          Ma'lumotlar yuklanmoqda...
        </p>
      </div>

      {/* Progress bar */}
      <div className="fade-up-d2" style={{ width: 180, marginBottom: 16 }}>
        <div style={{
          height: 2,
          background: '#dbeafe',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div
            className="bar-fill"
            style={{
              height: '100%',
              background: 'linear-gradient(90deg,#60a5fa,#38bdf8)',
              borderRadius: 99,
            }}
          />
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        <span className="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
        <span className="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
        <span className="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#93c5fd', display: 'inline-block' }} />
      </div>
    </div>
  );
}

// ── Error ──────────────────────────────────────────────────────
function ErrorScreen() {
  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg,#f7fbff 0%,#f4f8fc 50%,#eef5fb 100%)',
      padding: '24px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>
      <style>{STYLES}</style>

      {/* Icon */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4M12 16h.01" stroke="#ef4444" />
          </svg>
        </div>
      </div>

      {/* Divider with text */}
      <div className="fade-up-d1" style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', margin: '0 0 8px' }}>
          Kirish cheklangan
        </p>
        {/* Animated line */}
        <div className="line-in" style={{
          height: 1,
          width: 40,
          background: 'linear-gradient(90deg,#60a5fa,#38bdf8)',
          borderRadius: 99,
          margin: '0 auto 10px',
        }} />
        <p style={{ fontSize: 13, color: '#7ba7c7', margin: 0, maxWidth: 260, lineHeight: 1.55 }}>
          Bu sahifa faqat Telegram bot orqali ochilishi mumkin.
        </p>
      </div>

      {/* Info box */}
      <div className="fade-up-d2" style={{
        marginTop: 8,
        padding: '12px 16px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 12,
        maxWidth: 280,
        width: '100%',
      }}>
        <p style={{ fontSize: 12, color: '#3b82f6', margin: 0, lineHeight: 1.55 }}>
          Botdagi menyudan foydalanib sahifani qayta oching.
        </p>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 32,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#b6cfe3',
        fontWeight: 500,
      }}>
        AKB Cargo System
      </p>
    </div>
  );
}

// ── Guard ──────────────────────────────────────────────────────
export default function TelegramWebAppGuard({ children }: TelegramWebAppGuardProps) {
  const isBrowserRoute =
    window.location.pathname.startsWith('/admin') ||
    window.location.pathname === '/pos' ||
    window.location.pathname.startsWith('/flights') ||
    window.location.pathname.startsWith('/statistics');

  const [isValidating, setIsValidating] = useState(!isBrowserRoute);
  const [isValid, setIsValid]           = useState(isBrowserRoute);

  useEffect(() => {
    if (isBrowserRoute) return;

    const check = async () => {
      try {
        const { getTelegramWebAppData, validateInitData, telegramAutoLogin } =
          await import('@/api/services/auth');

        const telegramData      = getTelegramWebAppData();
        const validateResponse  = await validateInitData({
          init_data: telegramData?.initData || '',
        });

        if (!telegramData || !telegramData.user || !validateResponse.valid) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
        }

        if (!sessionStorage.getItem('access_token') && !localStorage.getItem('access_token')) {
          try {
            const loginResponse = await telegramAutoLogin(telegramData.initData);
            if (loginResponse?.access_token) {
              sessionStorage.setItem('access_token', loginResponse.access_token);
            }
          } catch {
            console.log('Auto-login: foydalanuvchi ro\'yxatga olinmagan yoki kutmoqda.');
          }
        }

        setIsValid(true);
        setIsValidating(false);
      } catch (err) {
        console.error('Telegram WebApp validation error:', err);
        setIsValid(false);
        setIsValidating(false);
      }
    };

    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [isBrowserRoute]);

  if (isValidating) return <LoadingScreen />;
  if (!isValid)     return <ErrorScreen />;
  return <>{children}</>;
}