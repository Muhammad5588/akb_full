import { cn } from "@/lib/utils";

interface AKBLogoProps {
    className?: string;
    markClassName?: string;
    textClassName?: string;
    compact?: boolean;
}

export function AKBLogo({
    className,
    markClassName,
    textClassName,
    compact = false,
}: AKBLogoProps) {
    return (
        <div className={cn("inline-flex items-center gap-2", className)}>
            <div
                className={cn(
                    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[50%] border border-[#cfe0f1] bg-white shadow-sm",
                    markClassName,
                )}
            >
                <img src="/akb.png" alt="AKB Logo" className="h-full w-full object-cover rounded-[50%]" />
            </div>
            {!compact && (
                <div className={cn("leading-none", textClassName)}>
                    <p className="text-[20px] font-black tracking-normal text-[#0b2b53]">AKB</p>
                    <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-normal text-[#0b84e5]">
                        Cargo
                    </p>
                </div>
            )}
        </div>
    );
}
