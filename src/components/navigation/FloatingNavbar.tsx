import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FloatingNavItem<T> {
    id: string;
    label: string;
    icon: React.ElementType;
    page: T;
    disabled?: boolean;
}

export interface FloatingNavbarProps<T> {
    items: FloatingNavItem<T>[];
    activePage: T;
    onNavigate: (page: T) => void;
    className?: string;
    desktopPosition?: 'top' | 'bottom';
}

export const FloatingNavbar = <T,>({
    items,
    activePage,
    onNavigate,
    className,
    desktopPosition = 'top',
}: FloatingNavbarProps<T>) => {

    const handleNavClick = (item: FloatingNavItem<T>) => {
        if (item.disabled) {
            return;
        }
        onNavigate(item.page);
    };

    const isItemActive = (item: FloatingNavItem<T>) => {
        return activePage === item.page;
    };

    const containerClasses = cn(
        "grid w-full max-w-[430px] grid-cols-4 gap-1 rounded-lg border border-[#d7e5f2] bg-white p-1.5 shadow-[0_12px_28px_rgba(10,35,70,0.12)] pointer-events-auto backdrop-blur-md dark:border-[#233554] dark:bg-[#0F1728] dark:shadow-[0_18px_36px_rgba(2,10,20,0.28)]",
        "md:max-w-[460px]"
    );

    const buttonBaseClasses = "relative flex h-14 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md transition-colors duration-200";

    const buttonInactiveClasses = cn(
        "text-[#63758a] hover:bg-[#eef7ff] hover:text-[#0b4edb] dark:text-[#7F91AE] dark:hover:bg-[#16233D] dark:hover:text-[#B8C4D9]"
    );

    const buttonActiveClasses = cn(
        "bg-[#0b4edb] text-white shadow-[0_8px_16px_rgba(11,78,219,0.18)] dark:bg-[#2F6BFF] dark:shadow-[0_12px_24px_rgba(2,10,20,0.28)]"
    );

    const activePillClasses = "absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-white/80";

    const activeTransition = { type: "spring", stiffness: 240, damping: 28, mass: 0.9 } as const;

    const desktopWrapperClasses = cn(
        "hidden md:flex fixed left-0 right-0 z-40 justify-center pointer-events-none px-4",
        desktopPosition === 'top' ? "top-24" : "bottom-8",
        className
    );

    return (
        <>
            {/* Mobile Bottom Wrapper */}
            <div className={cn("md:hidden fixed bottom-3 left-0 right-0 z-50 flex justify-center pointer-events-none px-3", className)}>
                <div className={containerClasses}>
                    {items.map((item) => {
                        const active = isItemActive(item);
                        const disabled = item.disabled;

                        return (
                            <button
                                key={`mobile-${item.id}`}
                                onClick={() => !disabled && handleNavClick(item)}
                                disabled={disabled}
                                aria-label={item.label}
                                className={cn(
                                    buttonBaseClasses,
                                    active ? buttonActiveClasses : buttonInactiveClasses,
                                    disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
                                )}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="mobile-nav-pill"
                                        className={activePillClasses}
                                        initial={false}
                                        transition={activeTransition}
                                    />
                                )}
                                <span className={cn(
                                    "relative z-10 flex flex-col items-center gap-1 transition-colors duration-200"
                                )}>
                                    <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                                    <span className="max-w-full truncate text-[11px] font-semibold leading-none">
                                        {item.label}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop Wrapper */}
            <div className={desktopWrapperClasses}>
                <div className={containerClasses}>
                    {items.map((item) => {
                        const active = isItemActive(item);
                        const disabled = item.disabled;

                        return (
                            <button
                                key={`desktop-${item.id}`}
                                onClick={() => !disabled && handleNavClick(item)}
                                disabled={disabled}
                                aria-label={item.label}
                                className={cn(
                                    buttonBaseClasses,
                                    active ? buttonActiveClasses : buttonInactiveClasses,
                                    disabled ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"
                                )}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="desktop-nav-pill"
                                        className={activePillClasses}
                                        initial={false}
                                        transition={activeTransition}
                                    />
                                )}
                                <span className={cn(
                                    "relative z-10 flex flex-col items-center gap-1 transition-colors duration-200"
                                )}>
                                    <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                                    <span className="text-[11px] font-semibold leading-none">{item.label}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
