import React, { useMemo, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ChevronLeft,
    ChevronRight,
    Plane,
    Gift,
    Calendar as CalendarIcon,
    ArrowRight,
    Bell,
    AlertCircle,
} from "lucide-react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    isSameMonth,
    addDays,
    startOfWeek,
    endOfWeek,
    isBefore,
    startOfDay,
    getDate,
} from "date-fns";

interface Flight {
    id: string;
    date: Date;
    flightName: string;
    type: "avia" | "aksiya";
    status: "arrived" | "scheduled" | "delayed";
}

interface FlightSchedulePageProps {
    onBack: () => void;
    onNavigateToTrack: () => void;
}

const formatDateUzWithMonths = (
    date: Date,
    type: "monthYear" | "dayMonth" | "full",
    months: string[],
) => {
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const monthName = months[monthIndex];

    switch (type) {
        case "monthYear":
            return `${monthName} ${year}`;
        case "dayMonth":
            return `${day}-${monthName}`;
        case "full":
            return `${day}-${monthName}, ${year}`;
        default:
            return "";
    }
};

const generateGoogleCalendarUrl = (
    flight: Flight,
    t: (key: string, opts?: Record<string, string>) => string,
    months: string[],
) => {
    const title = t("flightSchedule.googleCalendar.title", { name: flight.flightName });
    const start = format(flight.date, "yyyyMMdd");
    const end = format(addDays(flight.date, 1), "yyyyMMdd");
    const details = t("flightSchedule.googleCalendar.details", {
        name: flight.flightName,
        date: formatDateUzWithMonths(flight.date, "full", months),
    });

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;
};

const TODAY = new Date();
const CURRENT_MONTH_START = startOfMonth(TODAY);
const PREV_MONTH_START = subMonths(CURRENT_MONTH_START, 1);
const NEXT_MONTH_START = addMonths(CURRENT_MONTH_START, 1);

const MOCK_FLIGHTS: Flight[] = [
    { id: "1", date: addDays(PREV_MONTH_START, 15), flightName: "AKB-1044", type: "avia", status: "arrived" },
    { id: "2", date: addDays(CURRENT_MONTH_START, 2), flightName: "AKB-1045", type: "avia", status: "arrived" },
    { id: "3", date: addDays(CURRENT_MONTH_START, 9), flightName: "AKB-1046", type: "avia", status: "arrived" },
    { id: "4", date: addDays(CURRENT_MONTH_START, 16), flightName: "AKB-1047", type: "avia", status: "arrived" },
    { id: "5", date: addDays(CURRENT_MONTH_START, 23), flightName: "AKB-1048", type: "avia", status: "delayed" },
    { id: "6", date: addDays(CURRENT_MONTH_START, 28), flightName: "Baho kuni", type: "aksiya", status: "scheduled" },
    { id: "7", date: addDays(NEXT_MONTH_START, 4), flightName: "AKB-1049", type: "avia", status: "scheduled" },
    { id: "8", date: addDays(NEXT_MONTH_START, 8), flightName: "Xalqaro xotin-qizlar kuni", type: "aksiya", status: "scheduled" },
    { id: "9", date: addDays(NEXT_MONTH_START, 11), flightName: "AKB-1050", type: "avia", status: "scheduled" },
    { id: "10", date: addDays(NEXT_MONTH_START, 18), flightName: "AKB-1051", type: "avia", status: "scheduled" },
    { id: "11", date: addDays(NEXT_MONTH_START, 20), flightName: "Navro'z bayrami", type: "aksiya", status: "scheduled" },
];

const FlightCard = memo(({ flight, simple = false }: { flight: Flight; simple?: boolean }) => {
    const { t } = useTranslation();
    const months = t("flightSchedule.calendar.months", { returnObjects: true }) as unknown as string[];
    const isArrived = flight.status === "arrived";
    const isDelayed = flight.status === "delayed";
    const isAksiya = flight.type === "aksiya";

    const statusText = isAksiya
        ? t("flightSchedule.status.aksiya")
        : isArrived
            ? t("flightSchedule.status.arrived")
            : isDelayed
                ? t("flightSchedule.status.delayed")
                : t("flightSchedule.status.scheduled");

    const statusClass = isAksiya
        ? "bg-[#eef6ff] text-[#0b4edb]"
        : isArrived
            ? "bg-[#effbf5] text-[#15835b]"
            : isDelayed
                ? "bg-[#fff1f1] text-[#c44747]"
                : "bg-[#eafaff] text-[#0b84e5]";

    const indicator = isAksiya
        ? "bg-[#0b4edb]"
        : isArrived
            ? "bg-[#22a06b]"
            : isDelayed
                ? "bg-[#c44747]"
                : "bg-[#37c5f3]";

    const iconClass = isAksiya
        ? "bg-[#eef6ff] border-[#cfe0f1] text-[#0b4edb]"
        : "bg-[#eafaff] border-[#cdeffc] text-[#0b84e5]";

    return (
        <div
            className={`group relative flex items-center gap-4 overflow-hidden rounded-lg border p-4 shadow-sm transition-all ${simple ? "border-[#dbe8f4] bg-white" : "border-[#dbe8f4] bg-white hover:border-[#0b84e5]"
                }`}
        >
            <div className={`absolute bottom-0 left-0 top-0 w-1 ${indicator}`} />

            <div className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border sm:h-12 sm:w-12 ${iconClass}`}>
                {isAksiya ? <Gift className="h-5 w-5 sm:h-6 sm:w-6" /> : <Plane className="h-5 w-5 sm:h-6 sm:w-6" />}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h5 className={`text-base font-bold leading-tight ${isAksiya ? "text-[#0b4edb]" : "text-[#07182f]"}`}>
                    {flight.flightName}
                </h5>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 rounded-md bg-[#f2f6fa] px-2 py-0.5 text-[#63758a]">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                            {formatDateUzWithMonths(flight.date, "dayMonth", months)}
                        </span>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-normal ${statusClass}`}>
                        {statusText}
                    </span>
                </div>
            </div>

            {!isArrived && (
                <button
                    onClick={() => window.open(generateGoogleCalendarUrl(flight, t, months), "_blank")}
                    className="shrink-0 rounded-lg p-2 text-[#7d91a8] transition-colors hover:bg-[#eef6ff] hover:text-[#0b4edb]"
                    title={t("flightSchedule.googleCalendar.tooltip")}
                >
                    <Bell className="h-5 w-5" />
                </button>
            )}
        </div>
    );
});

const FlightSchedulePage: React.FC<FlightSchedulePageProps> = ({ onBack, onNavigateToTrack }) => {
    const { t } = useTranslation();
    const months = t("flightSchedule.calendar.months", { returnObjects: true }) as unknown as string[];
    const weekdays = t("flightSchedule.calendar.weekdays", { returnObjects: true }) as unknown as string[];
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const { calendarDays, monthLabel } = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return {
            calendarDays: eachDayOfInterval({ start: startDate, end: endDate }),
            monthLabel: formatDateUzWithMonths(currentMonth, "monthYear", months),
        };
    }, [currentMonth, months]);

    const { selectedFlights, upcomingFlights, flightsMap } = useMemo(() => {
        const map = new Map<string, Flight[]>();
        MOCK_FLIGHTS.forEach((flight) => {
            const key = format(flight.date, "yyyy-MM-dd");
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(flight);
        });

        return {
            selectedFlights: MOCK_FLIGHTS.filter((flight) => isSameDay(flight.date, selectedDate)),
            upcomingFlights: MOCK_FLIGHTS.filter((flight) => isBefore(startOfDay(new Date()), flight.date))
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 3),
            flightsMap: map,
        };
    }, [selectedDate]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <div className="relative min-h-screen rounded-lg bg-transparent">
            <header className="sticky top-0 z-50 w-full rounded-t-lg border-b border-[#dbe8f4] bg-white/88 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                    <button
                        onClick={onBack}
                        className="-ml-2 rounded-lg p-2 text-[#63758a] transition-all active:scale-95 hover:bg-[#eef6ff]"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold text-[#07182f]">{t("flightSchedule.title")}</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-5xl px-4 py-6">
                <div className="grid grid-cols-1">
                    <div className="mb-6 lg:col-span-7 xl:col-span-8">
                        <div className="rounded-lg border border-[#dbe8f4] bg-white p-5 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold capitalize text-[#07182f]">{monthLabel}</h2>
                                <div className="flex gap-1 rounded-lg bg-[#eef3f8] p-1">
                                    <button onClick={prevMonth} className="rounded-md p-2 text-[#63758a] shadow-sm transition-all hover:bg-white">
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button onClick={nextMonth} className="rounded-md p-2 text-[#63758a] shadow-sm transition-all hover:bg-white">
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-2 grid grid-cols-7">
                                {weekdays.map((day) => (
                                    <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-normal text-[#7d91a8]">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                {calendarDays.map((day, idx) => {
                                    const dayKey = format(day, "yyyy-MM-dd");
                                    const dayFlights = flightsMap.get(dayKey) || [];
                                    const hasFlight = dayFlights.length > 0;
                                    const hasAksiya = dayFlights.some((flight) => flight.type === "aksiya");
                                    const isSelected = isSameDay(day, selectedDate);
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isTodayDate = isToday(day);

                                    const selectedClass = hasAksiya
                                        ? "z-10 scale-105 border-[#0b4edb] bg-[#0b4edb] text-white shadow-sm"
                                        : "z-10 scale-105 border-[#0b84e5] bg-[#0b84e5] text-white shadow-sm";
                                    const todayClass = hasAksiya
                                        ? "bg-[#eef6ff] font-bold text-[#0b4edb] ring-1 ring-[#0b4edb]"
                                        : "bg-[#eafaff] font-bold text-[#0b84e5] ring-1 ring-[#0b84e5]";
                                    const defaultClass = hasAksiya
                                        ? "bg-[#f8fbfe] text-[#0b4edb] hover:bg-[#eef6ff]"
                                        : "hover:bg-[#f8fbfe]";

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDate(day)}
                                            className={`
                        relative flex aspect-[1/1] flex-col items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 sm:aspect-auto sm:py-3 lg:aspect-[4/3]
                        ${!isCurrentMonth ? "border-transparent text-[#c2d0de]" : "border-transparent text-[#31506e]"}
                        ${isSelected ? selectedClass : defaultClass}
                        ${isTodayDate && !isSelected ? todayClass : ""}
                      `}
                                        >
                                            <span className="z-10">{getDate(day)}</span>
                                            {hasFlight && (
                                                <div className="z-10 mt-1 flex gap-0.5">
                                                    {dayFlights.map((flight, i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-1.5 w-1.5 rounded-full ${isSelected
                                                                    ? "bg-white"
                                                                    : flight.type === "aksiya"
                                                                        ? "bg-[#0b4edb]"
                                                                        : flight.status === "arrived"
                                                                            ? "bg-[#22a06b]"
                                                                            : flight.status === "delayed"
                                                                                ? "bg-[#c44747]"
                                                                                : "bg-[#37c5f3]"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                        <div>
                            <h3 className="mb-3 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-normal text-[#63758a]">
                                <span>{formatDateUzWithMonths(selectedDate, "dayMonth", months)}</span>
                                {isToday(selectedDate) && (
                                    <span className="rounded-md bg-[#eef6ff] px-2 py-0.5 text-[#0b4edb]">
                                        {t("flightSchedule.today")}
                                    </span>
                                )}
                            </h3>

                            {selectedFlights.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedFlights.map((flight) => (
                                        <FlightCard key={flight.id} flight={flight} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-[#cfe0f1] bg-white py-12 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#f2f6fa]">
                                        <Plane className="h-6 w-6 text-[#9fb7cc]" />
                                    </div>
                                    <p className="text-sm text-[#63758a]">{t("flightSchedule.noFlights")}</p>
                                </div>
                            )}
                        </div>

                        <div className="relative overflow-hidden rounded-lg bg-[#07182f] p-5 text-white shadow-sm">
                            <div className="relative z-10">
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="rounded-lg bg-white/10 p-2">
                                        <AlertCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-base font-bold">{t("flightSchedule.cta.title")}</h4>
                                </div>
                                <p className="mb-4 text-sm leading-relaxed text-white/75">
                                    {t("flightSchedule.cta.desc")}
                                </p>
                                <button
                                    onClick={onNavigateToTrack}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#07182f] transition-all active:scale-95 hover:bg-[#eef6ff]"
                                >
                                    {t("flightSchedule.cta.button")} <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {upcomingFlights.length > 0 && (
                            <div>
                                <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-normal text-[#63758a]">
                                    {t("flightSchedule.upcoming")}
                                </h3>
                                <div className="space-y-2">
                                    {upcomingFlights.map((flight) => (
                                        <FlightCard key={flight.id} flight={flight} simple />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FlightSchedulePage;
