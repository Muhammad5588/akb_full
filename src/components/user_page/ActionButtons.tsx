import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItemData {
  id: string;
  icon: React.ReactNode;
  bgIcon?: React.ReactNode;
  label: string;
  desc: string;
  badge: string;
  actionLabel: string;
  theme: "blue" | "cyan" | "green" | "red" | "slate" | "amber" | "emerald" | "sky" | "rose" | "violet";
  priority?: "primary" | "secondary";
}

// ---------------------------------------------------------------------------
// Theme tokens — modul darajasida bir marta yaratiladi
// ---------------------------------------------------------------------------
const THEME_CLASSES: Record<ActionItemData["theme"], { card: string; icon: string; badge: string }> = {
  blue:    { card: "border-[#c7dcf3] bg-white hover:border-[#0b84e5] hover:bg-[#fbfdff]",    icon: "bg-[#eef6ff] text-[#0b4edb]",  badge: "bg-[#eef6ff] text-[#0b4edb] border-[#c7dcf3]" },
  cyan:    { card: "border-[#c9edf8] bg-white hover:border-[#37c5f3] hover:bg-[#fbfdff]",    icon: "bg-[#eafaff] text-[#0784a6]",  badge: "bg-[#eafaff] text-[#0784a6] border-[#bdebf7]" },
  green:   { card: "border-[#cfe0f1] bg-white hover:border-[#0b84e5] hover:bg-[#fbfdff]",    icon: "bg-[#eef7ff] text-[#0b4edb]",  badge: "bg-[#eef7ff] text-[#0b4edb] border-[#cfe0f1]" },
  red:     { card: "border-[#f1d2d2] bg-white hover:border-[#d95c5c]",                        icon: "bg-[#fff1f1] text-[#c44747]",  badge: "bg-[#fff1f1] text-[#c44747] border-[#f0cccc]" },
  slate:   { card: "border-[#dbe8f4] bg-white hover:border-[#0b84e5] hover:bg-[#fbfdff]",    icon: "bg-[#f2f7fc] text-[#0b2b53]",  badge: "bg-[#f2f7fc] text-[#0b2b53] border-[#dbe8f4]" },
  amber:   { card: "border-[#dbe8f4] bg-white hover:border-[#0b84e5]",                        icon: "bg-[#eef6ff] text-[#0b4edb]",  badge: "bg-[#eef6ff] text-[#0b4edb] border-[#c7dcf3]" },
  emerald: { card: "border-[#cfeadf] bg-white hover:border-[#22a06b]",                        icon: "bg-[#effbf5] text-[#15835b]",  badge: "bg-[#effbf5] text-[#15835b] border-[#ccebdc]" },
  sky:     { card: "border-[#c9edf8] bg-white hover:border-[#37c5f3]",                        icon: "bg-[#eafaff] text-[#0784a6]",  badge: "bg-[#eafaff] text-[#0784a6] border-[#bdebf7]" },
  rose:    { card: "border-[#f1d2d2] bg-white hover:border-[#d95c5c]",                        icon: "bg-[#fff1f1] text-[#c44747]",  badge: "bg-[#fff1f1] text-[#c44747] border-[#f0cccc]" },
  violet:  { card: "border-[#dbe8f4] bg-white hover:border-[#0b84e5]",                        icon: "bg-[#eef6ff] text-[#0b4edb]",  badge: "bg-[#eef6ff] text-[#0b4edb] border-[#c7dcf3]" },
};

// ---------------------------------------------------------------------------
// Primary kard uchun min-height lookup (id bo'yicha)
// ---------------------------------------------------------------------------
const ACTION_LAYOUTS: Record<string, string> = {
  request: "min-h-[118px]",
  report:  "min-h-[118px]",
  payment: "min-h-[118px]",
  china:   "min-h-[118px]",
};

// ---------------------------------------------------------------------------
// Statik className qismlari — cn() har rendirda emas, bir marta hisoblanadi
// ---------------------------------------------------------------------------
const BASE_CARD  = "group relative flex w-full min-w-0 flex-col justify-between overflow-hidden rounded-lg border p-3 text-left shadow-[0_8px_18px_rgba(15,47,87,0.035)] transition-all duration-200 active:scale-[0.98]";
const BASE_ICON  = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5edf6]/80 dark:border-[#2B4166]";

// Primary vs secondary uchun oldindan hisoblangan qo'shimcha classlar
const PRIMARY_CARD_EXTRA   = "min-h-[118px]"; // fallback; override per id below
const SECONDARY_CARD_EXTRA = "flex-row items-center gap-3 min-h-[70px]";
const PRIMARY_TOP_ROW      = "relative z-10 flex items-start justify-between";
const SECONDARY_TOP_ROW    = "relative z-10 flex items-center";
const PRIMARY_BOTTOM       = "relative z-10 mt-4 min-w-0";
const SECONDARY_BOTTOM     = "relative z-10 min-w-0 flex flex-1 items-center justify-between gap-3";

// ---------------------------------------------------------------------------
export const ActionButton = memo(({
  item,
  onClick,
}: {
  item: ActionItemData;
  onClick?: () => void;
}) => {
  const theme     = THEME_CLASSES[item.theme];
  const isPrimary = item.priority !== "secondary";

  // Kard className — cn() faqat shu komponent mount bo'lganda 1 marta ishga tushadi
  // (memo + props o'zgarmasa re-render bo'lmaydi)
  const cardCn = cn(
    BASE_CARD,
    theme.card,
    isPrimary
      ? (ACTION_LAYOUTS[item.id] ?? PRIMARY_CARD_EXTRA)
      : SECONDARY_CARD_EXTRA,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cardCn}
    >
      {/* Background dekor icon */}
      {item.bgIcon && (
        <div className="pointer-events-none absolute -bottom-5 -right-4 text-[#0b84e5]/[0.025] transition-transform duration-300 group-hover:scale-105 dark:text-[#8FA0BC]/[0.08]">
          {item.bgIcon}
        </div>
      )}

      {/* Top row: icon + badge */}
      <div className={isPrimary ? PRIMARY_TOP_ROW : SECONDARY_TOP_ROW}>
        <span className={cn(BASE_ICON, theme.icon)}>
          {item.icon}
        </span>
        {isPrimary && (
          <span className={cn("rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase leading-4", theme.badge)}>
            {item.badge}
          </span>
        )}
      </div>

      {/* Bottom row: text + action */}
      <div className={isPrimary ? PRIMARY_BOTTOM : SECONDARY_BOTTOM}>
        <div className="min-w-0">
          <h3 className={cn("font-semibold leading-snug text-[#07182f]", isPrimary ? "text-sm" : "text-sm truncate")}>
            {item.label}
          </h3>
          <p className={cn("mt-1 text-xs font-medium leading-snug text-[#63758a]", isPrimary ? "line-clamp-2" : "line-clamp-1")}>
            {item.desc}
          </p>
        </div>

        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold text-[#334a62] transition-colors group-hover:text-[#0b4edb] dark:text-[#8FA0BC] dark:group-hover:text-[#B8C4D9]",
          isPrimary ? "mt-3" : "mt-0 shrink-0",
        )}>
          {isPrimary && item.actionLabel}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
});

ActionButton.displayName = "ActionButton";
export type { ActionItemData };