import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Loader2, ChevronLeft, FileText, Calendar as CalendarIcon, X, Copy } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { passportService, type ExtraPassport } from '@/api/services/passportService';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema } from '@/lib/validation';
import { z } from 'zod';
import { format, parse, isValid } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import ImageUpload from '@/components/ImageUpload';
import TranslatedFormMessage from '@/components/TranslatedFormMessage';

const addPassportSchema = formSchema.pick({
    passportSeries: true,
    pinfl: true,
    dateOfBirth: true,
    passportImages: true
});

type AddPassportFormValues = z.infer<typeof addPassportSchema>;

interface ExtraPassportsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Drawer animation variants
const drawerVariants: Variants = {
    hidden: {
        y: "100%",
        x: 0,
        opacity: 0.5
    },
    visible: {
        y: 0,
        x: 0,
        opacity: 1,
        transition: { type: "spring", damping: 25, stiffness: 200 }
    },
    exit: {
        y: "100%",
        x: 0,
        opacity: 0,
        transition: { ease: "easeInOut", duration: 0.2 }
    }
};

const desktopDrawerVariants: Variants = {
    hidden: {
        x: "100%",
        y: 0,
        opacity: 0.5
    },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { type: "spring", damping: 30, stiffness: 300 }
    },
    exit: {
        x: "100%",
        y: 0,
        opacity: 0,
        transition: { ease: "easeInOut", duration: 0.2 }
    }
};

// Inner content slide variants
const slideVariants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0
    })
};

export function ExtraPassportsModal({ isOpen, onClose }: ExtraPassportsModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [selectedPassport, setSelectedPassport] = useState<ExtraPassport | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    // Form States
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [dateInputValue, setDateInputValue] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Check for desktop size
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 640);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const form = useForm<AddPassportFormValues>({
        resolver: zodResolver(addPassportSchema),
        defaultValues: {
            passportSeries: '',
            pinfl: '',
            passportImages: []
        }
    });

    // Fetch passports
    const { data: passportsData, isLoading } = useQuery({
        queryKey: ['extra-passports'],
        queryFn: () => passportService.getPassports(1, 100),
        enabled: isOpen,
    });

    // Mutations
    const createPassportMutation = useMutation({
        mutationFn: passportService.createPassport,
        onSuccess: () => {
            toast.success(t('form.messages.success') || "Pasport muvaffaqiyatli qo'shildi");
            queryClient.invalidateQueries({ queryKey: ['extra-passports'] });
            handleBack();
        },
        onError: (error: unknown) => {
            const msg = (() => {
                if (typeof error === 'object' && error !== null) {
                    const e = error as { message?: string; data?: { detail?: string } };
                    return e.data?.detail ?? e.message ?? null;
                }
                return null;
            })() || t('form.messages.generalError') || "Pasport qo'shishda xatolik";

            toast.error(msg);
        }
    });

    const deletePassportMutation = useMutation({
        mutationFn: passportService.deletePassport,
        onSuccess: () => {
            toast.success(t('common.deleted') || "Pasport o'chirildi");
            queryClient.invalidateQueries({ queryKey: ['extra-passports'] });
        },
        onError: () => {
            toast.error(t('common.error') || "Xatolik yuz berdi");
        }
    });

    const onSubmit = (data: AddPassportFormValues) => {
        const formattedDate = format(data.dateOfBirth, 'yyyy-MM-dd');
        createPassportMutation.mutate({
            passport_series: data.passportSeries.toUpperCase(),
            pinfl: data.pinfl,
            date_of_birth: formattedDate,
            images: data.passportImages
        });
    };

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(t('common.confirmDelete') || "O'chirishni tasdiqlaysizmi?")) {
            deletePassportMutation.mutate(id);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} ${t('common.copied') || 'nusxalandi'}`);
    };

    const maskValue = (value?: string | null, visibleStart = 2, visibleEnd = 2) => {
        if (!value) return '-';
        if (value.length <= visibleStart + visibleEnd) return '*'.repeat(value.length);
        return `${value.slice(0, visibleStart)}${'*'.repeat(Math.min(6, value.length - visibleStart - visibleEnd))}${value.slice(-visibleEnd)}`;
    };

    const handleBack = () => {
        setIsAdding(false);
        form.reset();
        setFrontImage(null);
        setBackImage(null);
        setDateInputValue('');
    };

    const handlePassportInput = (v: string) => {
        const c = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return c.substring(0, 2) + (c.length > 2 ? c.substring(2, 9) : '');
    };

    const handleDateInput = (v: string, onChange: (d?: Date) => void) => {
        // Only allow numbers and slashes
        let c = v.replace(/[^\d/]/g, '');

        // If the user is deleting (new value is shorter than old state), just update state
        if (c.length < dateInputValue.length) {
            setDateInputValue(c);
            // Clear the actual form value if it's no longer a complete valid date
            if (c.length < 10) onChange(undefined);
            return;
        }

        // Auto-insert slashes
        if (c.length === 2 && !c.includes('/')) c += '/';
        if (c.length === 5 && c.split('/').length === 2) c += '/';

        // Max length 10 (DD/MM/YYYY)
        if (c.length > 10) c = c.substring(0, 10);

        setDateInputValue(c);

        // If complete, try to parse
        if (c.length === 10) {
            const d = parse(c, 'dd/MM/yyyy', new Date());
            if (isValid(d)) onChange(d);
        }
    };

    const inp = [
        'h-12 rounded-lg',
        'border border-[#dbe8f4]',
        'bg-[#f8fbfe]',
        'text-[#07182f]',
        'placeholder:text-[#9fb7cc]',
        'transition-colors duration-150',
        'focus:border-[#0b84e5] focus:ring-2 focus:ring-[#37c5f3]/25 focus:ring-offset-0 focus:outline-none',
    ].join(' ');

    return (
        <>
            {/* Drawer Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-[#07182f]/35 z-[999]"
                                onClick={onClose}
                            />

                            {/* Drawer Content */}
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={isDesktop ? desktopDrawerVariants : drawerVariants}
                                className="fixed bottom-0 left-0 right-0 sm:left-auto sm:top-0 sm:bottom-0 sm:w-[450px] h-[92vh] sm:h-screen bg-[#f4f8fc] z-[999] rounded-t-lg sm:rounded-none sm:rounded-l-lg flex flex-col shadow-[0_18px_48px_rgba(10,35,70,0.18)] border-t border-[#dbe8f4] sm:border-t-0 sm:border-l"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-[#dbe8f4] flex items-center justify-between flex-shrink-0 bg-white rounded-t-lg sm:rounded-t-none">
                                    <div className="flex items-center gap-2">
                                        {isAdding && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 -ml-2 rounded-full"
                                                onClick={handleBack}
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </Button>
                                        )}
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                                                {t('passport.documentsLabel', 'Hujjatlar')}
                                            </p>
                                            <h2 className="text-lg font-semibold text-[#07182f]">{isAdding ? t('passport.addNew', "Yangi pasport") : t('passport.extraPassports', "Qo'shimcha pasportlar")}</h2>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-[#dbe8f4] bg-white hover:bg-[#eef6ff]" onClick={onClose}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Scrollable Body */}
                                <div className="flex-1 relative overflow-hidden bg-[#f4f8fc]">
                                    <AnimatePresence mode="wait" initial={false} custom={isAdding ? 1 : -1}>
                                        {isAdding ? (
                                            <motion.div
                                                key="add-form"
                                                custom={1}
                                                variants={slideVariants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="absolute inset-0 overflow-y-auto p-4 pb-24"
                                            >
                                                <Form {...form}>
                                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                                        {/* Pasport Seriyasi */}
                                                        <FormField control={form.control} name="passportSeries" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-sm text-[#07182f] tracking-normal">
                                                                    {t('form.passportSeries')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input
                                                                            placeholder={t('form.passportSeriesPlaceholder') || "AA1234567"}
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(handlePassportInput(e.target.value))}
                                                                            maxLength={9}
                                                                            className={`${inp} uppercase font-mono tracking-normal placeholder:tracking-normal placeholder:font-normal`}
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <TranslatedFormMessage />
                                                            </FormItem>
                                                        )} />

                                                        {/* PINFL */}
                                                        <FormField control={form.control} name="pinfl" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-sm text-[#07182f] tracking-normal">
                                                                    {t('form.pinfl')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('form.pinflPlaceholder') || "14 ta raqam"}
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                                                                        maxLength={14}
                                                                        className={`${inp} font-mono tracking-normal placeholder:tracking-normal placeholder:font-normal`}
                                                                    />
                                                                </FormControl>
                                                                <TranslatedFormMessage />
                                                            </FormItem>
                                                        )} />

                                                        {/* Tug'ilgan sana */}
                                                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <FormLabel className="font-semibold text-sm text-[#07182f] tracking-normal">
                                                                    {t('form.dateOfBirth')}
                                                                </FormLabel>
                                                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                                    <div className="relative">
                                                                        <Input
                                                                            placeholder="DD/MM/YYYY"
                                                                            value={field.value ? format(field.value, 'dd/MM/yyyy') : dateInputValue}
                                                                            onChange={(e) => handleDateInput(e.target.value, field.onChange)}
                                                                            onFocus={() => { if (!dateInputValue && !field.value) setDateInputValue(''); }}
                                                                            className={`${inp} pr-12 font-mono tracking-normal placeholder:tracking-normal placeholder:font-normal`}
                                                                        />
                                                                        <PopoverTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg hover:bg-[#eef6ff]"
                                                                            >
                                                                                <CalendarIcon className="h-4 w-4 text-[#0b4edb]" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                    </div>
                                                                    <PopoverContent
                                                                        align="start"
                                                                        className="w-auto p-0 z-[1050] bg-white border-[#dbe8f4] rounded-lg overflow-hidden shadow-xl"
                                                                    >
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={field.value}
                                                                            onSelect={(date) => {
                                                                                field.onChange(date);
                                                                                if (date) {
                                                                                    setDateInputValue(format(date, 'dd/MM/yyyy'));
                                                                                    setIsCalendarOpen(false);
                                                                                }
                                                                            }}
                                                                            disabled={(d) => d > new Date() || d < new Date('1900-01-01')}
                                                                            captionLayout="dropdown"
                                                                            fromYear={1900}
                                                                            toYear={new Date().getFullYear()}
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                                <TranslatedFormMessage />
                                                            </FormItem>
                                                        )} />

                                                        {/* Rasmlar */}
                                                        <FormField control={form.control} name="passportImages" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-base text-[#07182f]">
                                                                    {t('form.passportImages')}
                                                                </FormLabel>
                                                                <div className="grid grid-cols-1 gap-4 mt-2">
                                                                    <ImageUpload
                                                                        label={t('form.passportImagesFront', "Old tomon")}
                                                                        value={frontImage}
                                                                        variant="akb"
                                                                        onChange={(file) => {
                                                                            setFrontImage(file);
                                                                            const currentBack = backImage;
                                                                            const newImages = [file, currentBack].filter((f): f is File => f !== null);
                                                                            field.onChange(newImages);
                                                                        }}
                                                                        error={
                                                                            form.formState.errors.passportImages?.message
                                                                                ? t(form.formState.errors.passportImages.message)
                                                                                : undefined
                                                                        }
                                                                    />
                                                                    <ImageUpload
                                                                        label={t('form.passportImagesBack', "Orqa tomon")}
                                                                        value={backImage}
                                                                        variant="akb"
                                                                        onChange={(file) => {
                                                                            setBackImage(file);
                                                                            const currentFront = frontImage;
                                                                            const newImages = [currentFront, file].filter((f): f is File => f !== null);
                                                                            field.onChange(newImages);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <TranslatedFormMessage />
                                                            </FormItem>
                                                        )} />

                                                        <Button
                                                            type="submit"
                                                            disabled={createPassportMutation.isPending}
                                                            className="w-full h-12 bg-[#0b4edb] hover:bg-[#073fba] text-white shadow-sm sticky bottom-0 z-10 rounded-lg"
                                                        >
                                                            {createPassportMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                                            {createPassportMutation.isPending ? t('common.saving', "Saqlanmoqda...") : t('common.save', "Saqlash")}
                                                        </Button>
                                                    </form>
                                                </Form>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="passports-list"
                                                custom={-1}
                                                variants={slideVariants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="absolute inset-0 overflow-y-auto p-4 pb-24"
                                            >
                                                {isLoading ? (
                                                    <div className="flex justify-center p-8">
                                                        <Loader2 className="h-6 w-6 animate-spin text-[#0b4edb]" />
                                                    </div>
                                                ) : passportsData?.items.length === 0 ? (
                                                    <div className="text-center py-12 text-[#63758a] flex flex-col items-center rounded-lg border border-[#dbe8f4] bg-white px-5 shadow-[0_8px_20px_rgba(10,35,70,0.05)]">
                                                        <div className="h-16 w-16 bg-[#eef6ff] border border-[#cfe0f1] rounded-lg flex items-center justify-center mb-4">
                                                            <FileText className="h-8 w-8 text-[#0b4edb]" />
                                                        </div>
                                                        <p className="font-semibold text-[#07182f] mb-1">{t('passport.noPassports', "Hozircha pasportlar yo'q")}</p>
                                                        <p className="text-sm text-[#63758a] mb-6 max-w-xs">{t('passport.addPrompt', "Yangi pasport qo'shish uchun pastdagi tugmani bosing")}</p>
                                                        <Button
                                                            onClick={() => setIsAdding(true)}
                                                            className="bg-[#0b4edb] hover:bg-[#073fba] text-white rounded-lg px-6"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            {t('passport.add', "Pasport qo'shish")}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {passportsData?.items.map((passport, index) => (
                                                            <motion.div
                                                                key={passport.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="group relative overflow-hidden rounded-lg bg-white p-4 border border-[#dbe8f4] shadow-sm cursor-pointer hover:bg-[#f8fbfe] hover:border-[#0b84e5] transition-all"
                                                                onClick={() => setSelectedPassport(passport)}
                                                            >
                                                                <div className="flex gap-4 items-center">
                                                                    {/* Image Thumbnail */}
                                                                    <div className="h-16 w-16 rounded-md bg-[#f2f6fa] overflow-hidden flex-shrink-0 border border-[#dbe8f4]">
                                                                        {passport.image_urls && passport.image_urls[0] ? (
                                                                            <img
                                                                                src={passport.image_urls[0]}
                                                                                alt="Passport"
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="h-full w-full flex items-center justify-center text-[#9fb7cc]">
                                                                                <FileText className="h-6 w-6" />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-lg truncate text-[#07182f]">{maskValue(passport.passport_series, 2, 2)}</h3>
                                                                        <p className="text-sm text-[#63758a] truncate">{t('form.pinfl', 'JSHSHIR (PINFL)')}: {maskValue(passport.pinfl, 2, 3)}</p>
                                                                        <p className="text-xs text-[#7d91a8] mt-1">{passport.date_of_birth}</p>
                                                                    </div>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-10 w-10 text-[#c44747] hover:text-[#a83a3a] hover:bg-[#fff1f1] rounded-lg"
                                                                        onClick={(e) => handleDelete(passport.id, e)}
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                </div>
                                                            </motion.div>
                                                        ))}

                                                        <Button
                                                            variant="outline"
                                                            className="w-full border-dashed border-2 py-6 text-[#63758a] hover:border-[#0b84e5] hover:text-[#0b4edb] hover:bg-[#eef6ff] transition-colors mt-6 rounded-lg"
                                                            onClick={() => setIsAdding(true)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            {t('passport.addNewFull', "Yangi pasport qo'shish")}
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Passport Preview Overlay */}
            {createPortal(
                <AnimatePresence>
                    {selectedPassport && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] bg-[#07182f]/95 overflow-y-auto"
                            onClick={() => setSelectedPassport(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-4xl mx-auto min-h-full flex flex-col justify-center p-4 py-16 sm:p-8"
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 sm:fixed sm:top-6 sm:right-6 z-[1010] text-white/70 hover:text-white hover:bg-white/10 rounded-lg bg-white/10"
                                    onClick={() => setSelectedPassport(null)}
                                >
                                    <X className="h-8 w-8" />
                                </Button>

                                <div className="w-full grid md:grid-cols-2 gap-6 items-start">
                                    {/* Images */}
                                    <div className="space-y-4">
                                        {selectedPassport.image_urls?.map((url, idx) => (
                                            <div key={idx} className="relative rounded-lg overflow-hidden shadow-[0_12px_30px_rgba(10,35,70,0.18)] border border-white/20 bg-white">
                                                <img
                                                    src={url}
                                                    alt={`Passport ${idx + 1}`}
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                        ))}
                                        {(!selectedPassport.image_urls || selectedPassport.image_urls.length === 0) && (
                                            <div className="h-64 rounded-lg bg-[#eef6ff] border border-[#cfe0f1] flex items-center justify-center text-[#0b4edb]">
                                                <FileText className="h-12 w-12 opacity-50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details Panel */}
                                    <div className="p-6 rounded-lg bg-white border border-[#dbe8f4] text-[#07182f] shadow-[0_12px_30px_rgba(10,35,70,0.14)] md:sticky md:top-8">
                                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                            <FileText className="h-6 w-6 text-[#0b4edb]" />
                                            {t('passport.details', "Pasport ma'lumotlari")}
                                        </h3>

                                        <div className="space-y-6">
                                            <div className="relative group">
                                                <p className="text-sm text-[#63758a] mb-1">{t('form.passportSeries', "Pasport seriyasi va raqami")}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-2xl font-mono font-semibold tracking-normal">{selectedPassport.passport_series}</p>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-[#7d91a8] hover:text-[#0b4edb] hover:bg-[#eef6ff] rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => handleCopy(selectedPassport.passport_series, t('form.passportSeries'))}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="my-4 h-px bg-[#dbe8f4]" />

                                            <div className="relative group">
                                                <p className="text-sm text-[#63758a] mb-1">{t('form.pinfl', "JSHSHIR (PINFL)")}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xl font-mono font-medium tracking-normal">{selectedPassport.pinfl}</p>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-[#7d91a8] hover:text-[#0b4edb] hover:bg-[#eef6ff] rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => handleCopy(selectedPassport.pinfl, t('form.pinfl'))}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="my-4 h-px bg-[#dbe8f4]" />

                                            <div>
                                                <p className="text-sm text-[#63758a] mb-1">{t('form.dateOfBirth', "Tug'ilgan sana")}</p>
                                                <p className="text-lg font-medium flex items-center gap-2">
                                                    <CalendarIcon className="h-4 w-4 text-[#0b4edb]" />
                                                    {selectedPassport.date_of_birth}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
