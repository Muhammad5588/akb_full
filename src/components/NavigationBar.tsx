import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, UserCheck, Sun, Moon, Monitor } from 'lucide-react';
import { AKBLogo } from '@/components/user_panel/AKBLogo';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  onStatisticsClick?: () => void;
  onVerificationClick?: () => void;
  currentPage?: string;
}

// ─── LANGUAGE TOGGLE ────────────────────────────────────────────────────────
const LanguageToggle = ({ isDark }: { isDark: boolean }) => {
  const { i18n } = useTranslation();

  const wrapStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: 'rgba(24,24,27,0.72)',
        borderColor: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }
    : {
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderColor: 'rgba(0,0,0,0.09)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      };

  return (
    <div
      className="flex items-center p-1 rounded-lg border transition-all duration-300 shadow-sm"
      style={wrapStyle}
    >
      {(['uz', 'ru'] as const).map((lang) => {
        const isActive = i18n.language === lang;

        const btnStyle: React.CSSProperties = isActive
          ? isDark
            ? {
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#f4f4f5',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.16)',
              }
            : {
                backgroundColor: '#ffffff',
                color: '#18181b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }
          : {
              backgroundColor: 'transparent',
              color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(100,100,100,0.8)',
            };

        return (
          <button
            key={lang}
            onClick={() => i18n.changeLanguage(lang)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-md transition-all duration-200 border-none cursor-pointer"
            style={btnStyle}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};

// ─── THEME TOGGLE ───────────────────────────────────────────────────────────
const NavbarThemeToggle = ({ isDark }: { isDark: boolean }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return (saved as 'light' | 'dark' | 'system') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme', theme);

    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const items = [
    { id: 'light',  icon: Sun     },
    { id: 'system', icon: Monitor },
    { id: 'dark',   icon: Moon    },
  ] as const;

  const wrapStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: 'rgba(24,24,27,0.72)',
        borderColor: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }
    : {
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderColor: 'rgba(0,0,0,0.09)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      };

  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-lg border transition-all duration-300 shadow-sm"
      style={wrapStyle}
    >
      {items.map((item) => {
        const isActive = theme === item.id;

        const btnStyle: React.CSSProperties = isActive
          ? isDark
            ? {
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#f4f4f5',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.16)',
              }
            : {
                backgroundColor: '#ffffff',
                color: '#18181b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }
          : {
              backgroundColor: 'transparent',
              color: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(120,120,120,0.9)',
            };

        return (
          <button
            key={item.id}
            onClick={() => setTheme(item.id)}
            className="p-1.5 rounded-md transition-all duration-200 border-none cursor-pointer hover:opacity-80"
            style={btnStyle}
          >
            <item.icon size={14} />
          </button>
        );
      })}
    </div>
  );
};

// ─── MAIN NAVBAR ────────────────────────────────────────────────────────────
const HIDDEN_PAGES = new Set([
  'login', 'register', 'user-profile', 'user-home', 'user-reports', 'user-history',
]);

// Dark scrolled bg — modul darajasida, rendirda qayta yaratilmaydi
const DARK_SCROLLED_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(17,18,20,0.86)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

export default function NavigationBar({
  onStatisticsClick,
  onVerificationClick,
  currentPage,
}: NavigationBarProps) {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const isStatsVisible = !HIDDEN_PAGES.has(currentPage ?? '');

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dark mode watcher
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Logo classNames — forceLight olib tashlandi, dark/light Tailwind utility bilan
  const logoMarkClassName =
    'border-[#cfe0f1] bg-white shadow-[0_6px_14px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/10';

  const logoTextClassName = cn(
    'hidden min-[360px]:block',
    '[&_p:first-child]:text-[#0b2b53] [&_p:last-child]:text-[#0b84e5]',
    'dark:[&_p:first-child]:text-white dark:[&_p:last-child]:text-white/70',
  );

  const navInlineStyle = isScrolled && isDark ? DARK_SCROLLED_STYLE : undefined;

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? [
              'py-3 shadow-[0_6px_20px_rgba(15,23,42,0.08)] border-black/[0.08]',
              'bg-white/88 backdrop-blur-lg',
              'dark:border-white/10 dark:shadow-none',
            ].join(' ')
          : 'bg-transparent border-transparent py-4',
      )}
      style={navInlineStyle}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* ── LOGO ── */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0">
            <AKBLogo
              markClassName={logoMarkClassName}
              textClassName={logoTextClassName}
            />
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Stats/Verification — faqat desktop */}
            {isStatsVisible && (
              <div className="hidden md:flex items-center gap-2">
                {onVerificationClick && (
                  <button
                    onClick={onVerificationClick}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer',
                      'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950',
                      'dark:border-white/10 dark:text-white/70 dark:hover:text-white dark:hover:border-white/20',
                    )}
                    style={isDark ? { backgroundColor: 'rgba(22,15,5,0.70)' } : undefined}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t('navigation.verification', 'Tekshirish')}</span>
                  </button>
                )}
                {onStatisticsClick && (
                  <button
                    onClick={onStatisticsClick}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer',
                      'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950',
                      'dark:border-white/10 dark:text-white/70 dark:hover:text-white dark:hover:border-white/20',
                    )}
                    style={isDark ? { backgroundColor: 'rgba(22,15,5,0.70)' } : undefined}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>{t('navigation.statistics', 'Statistika')}</span>
                  </button>
                )}
                <div className="h-8 w-px bg-zinc-200 dark:bg-white/10 mx-1" />
              </div>
            )}

            <NavbarThemeToggle isDark={isDark} />
            <LanguageToggle isDark={isDark} />
          </div>
        </div>
      </div>
    </nav>
  );
}