import { memo } from 'react';

// ---------------------------------------------------------------------------
// Barcha gradientlar oldindan birlashtirilgan — DOM elementlari 20+ → 7 ta.
// Olib tashlandi:
//   • backdrop-blur   (Android GPU'sini o'ldiradi)
//   • mix-blend-multiply (har bir blob uchun alohida compositing layer)
//   • isolate         (blend uchun kerak edi, endi shart emas)
//   • galaxy-dots, galaxy-outline (sezilmas, lekin hisoblash qimmat)
// Dizayn farqi minimal — bloblar biroz to'g'ridan-to'g'ri ko'rinadi.
// ---------------------------------------------------------------------------

const S = {
  // ── Light mode ────────────────────────────────────────────────────────────
  /** Asosiy sahifa gradient */
  lightBase: {
    background:
      'linear-gradient(180deg, var(--akb-page-top,#f7fbff) 0%, var(--akb-page-bg,#f4f8fc) 48%, var(--akb-page-bottom,#eef5fb) 100%)',
  } as const,

  /**
   * Barcha bloblar + highlights bitta qatlamga birlashtirildi.
   * mix-blend-multiply olib tashlandi → ranglar biroz to'yinroq,
   * lekin vizual natija deyarli bir xil.
   */
  lightBlobs: {
    background: [
      // highlight nurlari
      'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.70) 0%, transparent 34%)',
      'radial-gradient(circle at 78% 14%, rgba(255,255,255,0.50) 0%, transparent 28%)',
      'radial-gradient(circle at 50% 84%, rgba(255,255,255,0.40) 0%, transparent 30%)',
      // bloblar (blend yo'q, shaffoflik kamaytirilgan)
      'radial-gradient(circle at 14% 14%, rgba(125,211,252,0.50) 0%, rgba(56,189,248,0.28) 42%, transparent 72%)',
      'radial-gradient(circle at 88% 26%, rgba(96,165,250,0.44) 0%, rgba(59,130,246,0.24) 44%, transparent 72%)',
      'radial-gradient(circle at 18% 90%, rgba(103,232,249,0.38) 0%, rgba(34,211,238,0.22) 44%, transparent 70%)',
      'radial-gradient(circle at 76% 86%, rgba(147,197,253,0.34) 0%, rgba(96,165,250,0.18) 46%, transparent 72%)',
      // backdrop-blur o'rniga oddiy oq qatlam
      'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.10) 42%, rgba(255,255,255,0.18) 100%)',
    ].join(','),
  } as const,

  // ── Dark mode ─────────────────────────────────────────────────────────────
  /** Qoʻngʻir asosiy qatlam + burchak aksentlari — bitta div */
  darkBase: {
    background: [
      'linear-gradient(180deg, rgba(7,19,39,0.98) 0%, rgba(11,27,56,0.97) 46%, rgba(18,38,75,0.99) 100%)',
      'radial-gradient(circle at 12% 16%, rgba(47,107,255,0.18) 0%, transparent 40%)',
      'radial-gradient(circle at 88% 18%, rgba(57,198,255,0.12) 0%, transparent 38%)',
      'radial-gradient(circle at 10% 92%, rgba(57,198,255,0.12) 0%, transparent 42%)',
      'radial-gradient(circle at 92% 84%, rgba(47,107,255,0.14) 0%, transparent 42%)',
    ].join(','),
  } as const,

  /**
   * Yulduzlar: far + near — bitta div.
   * backgroundImage ko'p qatlam qo'llab-quvvatlaydi.
   */
  darkStars: {
    backgroundImage: [
      'radial-gradient(circle, rgba(255,255,255,0.84) 0 0.8px, transparent 1.1px)',
      'radial-gradient(circle, rgba(120,173,255,0.58) 0 0.9px, transparent 1.2px)',
      'radial-gradient(circle, rgba(57,198,255,0.48) 0 0.65px, transparent 1px)',
      'radial-gradient(circle, rgba(255,255,255,0.96) 0 1px, transparent 1.35px)',
      'radial-gradient(circle, rgba(164,197,255,0.76) 0 1.1px, transparent 1.45px)',
      'radial-gradient(circle, rgba(57,198,255,0.78) 0 0.95px, transparent 1.3px)',
    ].join(','),
    backgroundSize: '220px 220px, 300px 300px, 260px 260px, 160px 160px, 210px 210px, 190px 190px',
    backgroundPosition: '18px 24px, 130px 90px, 42px 150px, 0 0, 72px 108px, 124px 26px',
    opacity: 0.7,
  } as const,

  /**
   * Tumanliklar + markaziy glow — bitta div.
   * galaxy-dots va galaxy-outline tashlab ketildi.
   */
  darkNebula: {
    background: [
      'radial-gradient(circle at 42% 38%, rgba(57,198,255,0.28) 0%, rgba(47,107,255,0.16) 36%, transparent 74%)',
      'radial-gradient(circle at 40% 40%, rgba(47,107,255,0.24) 0%, transparent 76%)',
      'radial-gradient(circle at 48% 48%, rgba(57,198,255,0.20) 0%, transparent 76%)',
      'radial-gradient(circle at 46% 46%, rgba(57,198,255,0.14) 0%, transparent 74%)',
      'radial-gradient(circle at 50% 10%, rgba(57,198,255,0.08) 0%, transparent 24%)',
    ].join(','),
  } as const,

  /** Vignette — eng yuqori qatlam */
  darkVignette: {
    background: [
      'radial-gradient(circle at 50% 50%, transparent 46%, rgba(3,10,24,0.34) 100%)',
      'radial-gradient(circle at 50% 50%, transparent 42%, rgba(4,10,22,0.28) 100%)',
    ].join(','),
  } as const,

  topBorder: {
    backgroundColor: 'var(--akb-border-strong, #cfe0f1)',
  } as const,
} as const;

// ---------------------------------------------------------------------------
export const UniqueBackground = memo(() => (
  <div
    aria-hidden="true"
    className="fixed inset-0 pointer-events-none overflow-hidden z-0 transform-gpu"
  >
    {/* 1 — Sahifa asosiy gradient */}
    <div className="absolute inset-0" style={S.lightBase} />

    {/* ── Light mode: faqat 1 ta qo'shimcha div ───────── */}
    <div className="absolute inset-0 dark:hidden" style={S.lightBlobs} />

    {/* ── Dark mode: 4 ta div (oldin 14+ edi) ─────────── */}
    <div className="absolute inset-0 hidden dark:block">
      <div className="absolute inset-0" style={S.darkBase} />
      <div className="absolute inset-0" style={S.darkStars} />
      <div className="absolute inset-0" style={S.darkNebula} />
      <div className="absolute inset-0" style={S.darkVignette} />
    </div>

    {/* 6 — Yuqori chegara */}
    <div className="absolute inset-x-0 top-0 h-px" style={S.topBorder} />
  </div>
));

UniqueBackground.displayName = 'UniqueBackground';