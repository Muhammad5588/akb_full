import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, FileText, Home, IdCard, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { useState, useEffect, type ReactNode } from 'react';
import { register as registerApi, getTelegramWebAppData } from '@/api/services/auth';
import StatusAnimation from './StatusAnimation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import ImageUpload from './ImageUpload';
import TranslatedFormMessage from './TranslatedFormMessage';
import { formSchema, regions, DISTRICTS, type RegistrationFormData } from '@/lib/validation';
import {
  akbHeading,
  akbInput,
  akbMutedText,
  akbPrimaryButton,
  akbSurface,
} from '@/components/user_panel/premium';

interface RegistrationFormProps {
  onNavigateToLogin?: () => void;
}

interface AuthSectionProps {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}

function AuthSection({ children, description, icon, title }: AuthSectionProps) {
  return (
    <section className="space-y-4 border-b border-[#e5edf6] pb-5 last:border-b-0 last:pb-0 dark:border-[#22364d]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef7ff] text-[#0b4edb] dark:border-[#2c4762] dark:bg-[#11233b] dark:text-[#69a0ff]">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#07182f] dark:text-[#f3f7fc]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#63758a] dark:text-[#9ab0c5]">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function RegistrationForm({ onNavigateToLogin }: RegistrationFormProps) {
  const { t } = useTranslation();

  // Reverse Auth Guard fallback: redirect if already authenticated
  useEffect(() => {
    if (sessionStorage.getItem('access_token') && onNavigateToLogin) {
      onNavigateToLogin();
    }
  }, [onNavigateToLogin]);

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [dateInputValue, setDateInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      passportSeries: '',
      pinfl: '',
      region: '',
      district: '',
      address: '',
      phoneNumber: '',
      passportImages: [],
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setSubmitStatus('loading');
    setSubmitMessage(t('form.messages.loading'));
    try {
      const telegramData = getTelegramWebAppData();
      if (!telegramData?.user) throw new Error(t('form.messages.telegramError'));
      const registerData = {
        full_name: data.fullName,
        passport_series: data.passportSeries,
        pinfl: data.pinfl,
        region: data.region,
        district: data.district,
        address: data.address,
        phone_number: `+998${data.phoneNumber}`,
        date_of_birth: format(data.dateOfBirth, 'yyyy-MM-dd'),
        telegram_id: telegramData.user.id,
        passport_images: data.passportImages,
      };
      const response = await registerApi(registerData);
      setSubmitStatus('success');
      setSubmitMessage(response.message || t('form.messages.success'));
      form.reset();
      setFrontImage(null);
      setBackImage(null);
      setDateInputValue('');
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin();
        }
      }, 1500);
    } catch (error: unknown) {
      setSubmitStatus('error');
      const message = typeof error === 'object' && error !== null && 'message' in (error as object) ? (error as { message?: string }).message : undefined;
      setSubmitMessage(message || t('form.messages.generalError'));

    }
  };

  const handleAnimationComplete = () => {
    setSubmitStatus('idle');
    setSubmitMessage('');
  };

  const handlePassportInput = (v: string) => {
    const c = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return c.substring(0, 2) + (c.length > 2 ? c.substring(2, 9) : '');
  };

  const handlePhoneInput = (v: string) => {
    const c = v.replace(/\D/g, '');
    let f = c.substring(0, 2);
    if (c.length > 2) f += ' ' + c.substring(2, 5);
    if (c.length > 5) f += ' ' + c.substring(5, 7);
    if (c.length > 7) f += ' ' + c.substring(7, 9);
    return { formatted: f, raw: c };
  };

  const handleDateInput = (v: string, onChange: (d?: Date) => void) => {
    const c = v.replace(/[^\d/]/g, '');
    let f = c;
    if (c.length >= 2 && !c.includes('/')) f = c.substring(0, 2) + '/' + c.substring(2);
    if (c.length >= 5 && c.split('/').length === 2) {
      const p = c.split('/');
      f = p[0] + '/' + p[1].substring(0, 2) + '/' + p[1].substring(2);
    }
    setDateInputValue(f);
    if (f.length === 10) {
      const d = parse(f, 'dd/MM/yyyy', new Date());
      if (isValid(d)) onChange(d);
    }
  };

  const inp = `${akbInput} text-base`;
  const labelClass = 'flex items-center gap-2 text-sm font-semibold text-[#0b2b53] dark:text-[#dce8f7]';
  const plainLabelClass = 'text-sm font-semibold text-[#0b2b53] dark:text-[#dce8f7]';
  const selectContentClass = 'max-h-60 rounded-lg border-[#dbe8f4] bg-white text-[#07182f] shadow-[0_16px_36px_rgba(15,47,87,0.14)] dark:border-[#22364d] dark:bg-[#121e2f] dark:text-[#f3f7fc] dark:shadow-[0_20px_44px_rgba(2,10,20,0.34)]';
  const selectItemClass = 'cursor-pointer rounded-md text-[#0b2b53] focus:bg-[#eef7ff] focus:text-[#0b4edb] hover:bg-[#eef7ff] dark:text-[#dce8f7] dark:focus:bg-[#11233b] dark:focus:text-[#4b86ff] dark:hover:bg-[#11233b]';

  return (
    <>
      {submitStatus !== 'idle' && (
        <StatusAnimation
          status={submitStatus}
          message={submitMessage}
          onComplete={handleAnimationComplete}
        />
      )}

      <div className="min-h-screen w-full bg-transparent px-4 py-5 pb-8 sm:px-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
          <header className="pt-1">
            <h1 className={`text-2xl ${akbHeading}`}>
              {t('form.title')}
            </h1>
            <p className={`${akbMutedText} mt-2 text-sm leading-6`}>
              AKB Cargo xizmatlaridan foydalanish uchun ma'lumotlarni to'ldiring.
            </p>
          </header>

          <div className={`relative overflow-hidden p-5 sm:p-6 ${akbSurface}`}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <AuthSection
                  icon={<IdCard className="h-4 w-4" />}
                  title="Shaxsiy ma'lumotlar"
                  description="Ism, passport va tug'ilgan sana ma'lumotlarini kiriting."
                >
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <UserRound className="h-4 w-4 text-[#0b84e5]" />
                        {t('form.fullName')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fullNamePlaceholder')} {...field} className={inp} />
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="passportSeries" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={plainLabelClass}>
                          {t('form.passportSeries')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('form.passportSeriesPlaceholder')}
                            {...field}
                            onChange={(e) => field.onChange(handlePassportInput(e.target.value))}
                            maxLength={9}
                            className={`${inp} uppercase font-mono placeholder:font-normal`}
                          />
                        </FormControl>
                        <TranslatedFormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="pinfl" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={plainLabelClass}>
                          {t('form.pinfl')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('form.pinflPlaceholder')}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                            maxLength={14}
                            className={`${inp} font-mono placeholder:font-normal`}
                          />
                        </FormControl>
                        <TranslatedFormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={labelClass}>
                        <CalendarIcon className="h-4 w-4 text-[#0b84e5]" />
                        {t('form.dateOfBirth')}
                      </FormLabel>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <div className="relative">
                          <Input
                            placeholder="DD/MM/YYYY"
                            value={field.value ? format(field.value, 'dd/MM/yyyy') : dateInputValue}
                            onChange={(e) => handleDateInput(e.target.value, field.onChange)}
                            onFocus={() => { if (!dateInputValue && !field.value) setDateInputValue(''); }}
                            className={`${inp} pr-12 font-mono placeholder:font-normal`}
                          />
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg text-[#0b84e5] hover:bg-[#eef7ff] dark:text-[#69d2f8] dark:hover:bg-[#11233b]"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </div>
                        <PopoverContent
                          align="start"
                          className="w-auto overflow-hidden rounded-lg border-[#dbe8f4] bg-white p-0 text-[#07182f] shadow-[0_16px_36px_rgba(15,47,87,0.14)] dark:border-[#22364d] dark:bg-[#121e2f] dark:text-[#f3f7fc] dark:shadow-[0_20px_44px_rgba(2,10,20,0.34)]"
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
                            className="bg-white text-[#07182f] [&_[data-selected-single=true]]:!bg-[#0b4edb] [&_[data-selected-single=true]]:!text-white [&_[data-range-end=true]]:!bg-[#0b4edb] [&_[data-range-start=true]]:!bg-[#0b4edb] dark:bg-[#121e2f] dark:text-[#f3f7fc] dark:[&_[data-selected-single=true]]:!bg-[#4b86ff] dark:[&_[data-range-end=true]]:!bg-[#4b86ff] dark:[&_[data-range-start=true]]:!bg-[#4b86ff]"
                          />
                        </PopoverContent>
                      </Popover>
                      <TranslatedFormMessage />
                    </FormItem>
                  )} />
                </AuthSection>

                <AuthSection
                  icon={<Home className="h-4 w-4" />}
                  title="Manzil ma'lumotlari"
                  description="Hudud, aniq manzil va aloqa raqamini belgilang."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          <MapPin className="h-4 w-4 text-[#0b84e5]" />
                          {t('form.region')}
                        </FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('district', '');
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={`${inp} w-full`}>
                              <SelectValue placeholder={t('form.regionPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={selectContentClass}>
                            {regions.map((r) => (
                              <SelectItem
                                key={r.value}
                                value={r.value}
                                className={selectItemClass}
                              >
                                {t(r.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <TranslatedFormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="district" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          <MapPin className="h-4 w-4 text-[#0b84e5]" />
                          {t('form.district')}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('region')}>
                          <FormControl>
                            <SelectTrigger className={`${inp} w-full`}>
                              <SelectValue placeholder={t('form.districtPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={selectContentClass}>
                            {form.watch('region') && DISTRICTS[form.watch('region')]?.map((d) => (
                              <SelectItem
                                key={d.value}
                                value={d.value}
                                className={selectItemClass}
                              >
                                {t(d.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <TranslatedFormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <Home className="h-4 w-4 text-[#0b84e5]" />
                        {t('form.address')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.addressPlaceholder')} {...field} className={inp} />
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <Phone className="h-4 w-4 text-[#0b84e5]" />
                        {t('form.phoneNumber')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
                            <span className="text-sm font-semibold text-[#0b2b53] dark:text-[#dce8f7]">+998</span>
                            <div className="h-4 w-px bg-[#cfe0f1] dark:bg-[#2c4762]" />
                          </div>
                          <Input
                            placeholder={t('form.phoneNumberPlaceholder')}
                            value={handlePhoneInput(field.value).formatted}
                            onChange={(e) => field.onChange(handlePhoneInput(e.target.value).raw)}
                            className={`${inp} pl-[4.5rem] font-mono placeholder:font-normal`}
                          />
                        </div>
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )} />
                </AuthSection>

                <AuthSection
                  icon={<FileText className="h-4 w-4" />}
                  title="Hujjatlar"
                  description="Passport rasmlarini yorug' va o'qilishi oson holatda yuklang."
                >
                  <FormField control={form.control} name="passportImages" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={plainLabelClass}>
                        {t('form.passportImages')}
                      </FormLabel>
                      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ImageUpload
                          label={t('form.passportImagesFront')}
                          value={frontImage}
                          variant="akb"
                          onChange={(file) => {
                            setFrontImage(file);
                            field.onChange([file, backImage].filter((f): f is File => f !== null));
                          }}
                          error={
                            form.formState.errors.passportImages?.message
                              ? t(form.formState.errors.passportImages.message)
                              : undefined
                          }
                        />
                        <ImageUpload
                          label={t('form.passportImagesBack')}
                          value={backImage}
                          variant="akb"
                          onChange={(file) => {
                            setBackImage(file);
                            field.onChange([frontImage, file].filter((f): f is File => f !== null));
                          }}
                        />
                      </div>
                      <TranslatedFormMessage />
                    </FormItem>
                  )} />
                </AuthSection>

                <div className="flex items-start gap-3 rounded-lg bg-[#eef7ff] px-4 py-3 text-sm leading-5 text-[#0b2b53] dark:bg-[#11233b] dark:text-[#dce8f7]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4edb] dark:text-[#69a0ff]" />
                  <p>Ma'lumotlar tekshiruvga yuboriladi. Tasdiqlangandan keyin AKB Cargo hisobingizdan foydalanishingiz mumkin.</p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitStatus === 'loading'}
                    className={`w-full text-base ${akbPrimaryButton}`}
                  >
                    {t('form.submit')}
                  </Button>
                </div>

                <div className="text-center pb-1">
                  <p className={`text-sm ${akbMutedText}`}>
                    {t('form.haveAccount')}{' '}
                    <button
                      type="button"
                      onClick={onNavigateToLogin}
                      className="font-semibold text-[#0b4edb] underline underline-offset-2 decoration-[#37c5f3]/60 transition-colors hover:text-[#073fba] dark:text-[#69a0ff] dark:hover:text-[#8ab7ff]"
                    >
                      {t('form.login')}
                    </button>
                  </p>
                </div>

              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}