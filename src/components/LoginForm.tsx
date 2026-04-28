import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { LogIn, MapPin, Phone, User } from 'lucide-react';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login as loginApi, getTelegramWebAppData, fetchAuthMe } from '@/api/services/auth';
import StatusAnimation from './StatusAnimation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { regions, DISTRICTS } from '@/lib/validation';
import TranslatedFormMessage from './TranslatedFormMessage';
import {
  akbHeading,
  akbInput,
  akbMutedText,
  akbPrimaryButton,
  akbSurface,
} from '@/components/user_panel/premium';

const loginSchema = z.object({
  clientCode: z.string().min(1, 'login.validation.clientCodeRequired').regex(/^[A-Z][A-Z0-9-/]*$/, 'login.validation.clientCodeInvalid'),
  phoneNumber: z.string().min(1, 'login.validation.phoneNumberRequired').regex(/^\d{9}$/, 'login.validation.phoneNumberInvalid'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const addressSchema = z.object({
  region: z.string().min(1, 'form.validation.regionRequired'),
  district: z.string().min(1, 'form.validation.districtRequired'),
});
type AddressFormData = z.infer<typeof addressSchema>;

interface LoginFormProps {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: (role: string) => void;
}

export default function LoginForm({ onNavigateToRegister, onLoginSuccess }: LoginFormProps) {
  const { t } = useTranslation();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const [showAddressDrawer, setShowAddressDrawer] = useState(false);
  const [credentials, setCredentials] = useState<{ clientCode: string; phoneNumber: string } | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Reverse Auth Guard: agar token mavjud bo'lsa, /auth/me dan haqiqiy roleni olib yo'naltirish
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token || !onLoginSuccess) return;

    // Token bor — haqiqiy roleni backenddan olamiz
    fetchAuthMe()
      .then((userData) => {
        onLoginSuccess(userData.role ?? 'user');
      })
      .catch(() => {
        // Token eskirgan yoki noto'g'ri — o'chirib tashlaymiz, login ko'rsatamiz
        sessionStorage.removeItem('access_token');
      });
  }, [onLoginSuccess]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { clientCode: '', phoneNumber: '' },
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { region: '', district: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitStatus('loading');
    setSubmitMessage(t('login.messages.loading'));
    try {
      const telegramData = getTelegramWebAppData();
      // if (!telegramData?.user) throw new Error(t('login.messages.telegramError'));
      const response = await loginApi({
        client_code: data.clientCode,
        phone_number: `+998${data.phoneNumber}`,
        telegram_id: telegramData?.user?.id,
      });

      if (response.access_token) {
        sessionStorage.setItem('access_token', response.access_token);
        setSubmitStatus('success');
        setSubmitMessage(t('login.messages.success', { name: response.full_name }));
        form.reset();
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(response.role);
          }
        }, 1500);
      }

    } catch (error: unknown) {
      const status = typeof error === 'object' && error && 'status' in (error as object) ? (error as { status?: number }).status : undefined;
      const detail = typeof error === 'object' && error && 'data' in (error as object) ? (error as { data?: { detail?: string } }).data?.detail : undefined;
      const message = typeof error === 'object' && error && 'message' in (error as object) ? (error as { message?: string }).message : undefined;

      if (status === 428 || detail === 'address_required') {
        setSubmitStatus('idle');
        setSubmitMessage('');
        setCredentials({ clientCode: data.clientCode, phoneNumber: data.phoneNumber });
        setShowAddressDrawer(true);
      } else {
        setSubmitStatus('error');
        setSubmitMessage(detail || message || t('login.messages.generalError'));
      }
    }
  };

  const onAddressSubmit = async (data: AddressFormData) => {
    if (!credentials) return;
    setSubmitStatus('loading');
    setSubmitMessage(t('login.messages.loading'));
    try {
      const telegramData = getTelegramWebAppData();
      const response = await loginApi({
        client_code: credentials.clientCode,
        phone_number: `+998${credentials.phoneNumber}`,
        telegram_id: telegramData?.user?.id,
        region: data.region,
        district: data.district,
      });

      if (response.access_token) {
        sessionStorage.setItem('access_token', response.access_token);
        setShowAddressDrawer(false);
        setSubmitStatus('success');
        setSubmitMessage(t('login.messages.success', { name: response.full_name }));
        form.reset();
        addressForm.reset();
        setCredentials(null);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(response.role);
          }
        }, 1500);
      }
    } catch (error: unknown) {
      setSubmitStatus('error');
      const detail = typeof error === 'object' && error && 'data' in (error as object) ? (error as { data?: { detail?: string } }).data?.detail : undefined;
      const message = typeof error === 'object' && error && 'message' in (error as object) ? (error as { message?: string }).message : undefined;
      setSubmitMessage(detail || message || t('login.messages.generalError'));
    }
  };

  const handleAnimationComplete = () => {
    setSubmitStatus('idle');
    setSubmitMessage('');
  };

  const handleClientCodeInput = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-/]/g, '');

  const handlePhoneInput = (v: string) => {
    const c = v.replace(/\D/g, '');
    let f = c.substring(0, 2);
    if (c.length > 2) f += ' ' + c.substring(2, 5);
    if (c.length > 5) f += ' ' + c.substring(5, 7);
    if (c.length > 7) f += ' ' + c.substring(7, 9);
    return { formatted: f, raw: c };
  };

  const inp = `${akbInput} text-base`;
  const labelClass = 'flex items-center gap-2 text-sm font-semibold text-[#0b2b53] dark:text-[#dce8f7]';
  const selectContentClass = 'z-[10010] max-h-60 rounded-lg border-[#dbe8f4] bg-white text-[#07182f] shadow-[0_16px_36px_rgba(15,47,87,0.14)] dark:border-[#22364d] dark:bg-[#121e2f] dark:text-[#f3f7fc] dark:shadow-[0_20px_44px_rgba(2,10,20,0.34)]';
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

      <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-transparent px-4 pb-4 pt-24 sm:px-6 sm:pb-6 sm:pt-28">
        <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center gap-4">
          <header>
            <h1 className={`text-2xl ${akbHeading}`}>
              {t('login.title')}
            </h1>
            <p className={`${akbMutedText} mt-2 text-sm leading-6`}>
              {t('login.subtitle')}
            </p>
          </header>

          <div className={`relative overflow-hidden p-5 sm:p-6 ${akbSurface}`}>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Client Code */}
                <FormField control={form.control} name="clientCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      <User className="h-4 w-4 text-[#0b84e5]" />
                      {t('login.clientCode')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('login.clientCodePlaceholder')}
                        {...field}
                        onChange={(e) => field.onChange(handleClientCodeInput(e.target.value))}
                        className={`${inp} uppercase font-mono placeholder:font-normal`}
                      />
                    </FormControl>
                    <TranslatedFormMessage />
                  </FormItem>
                )} />

                {/* Phone */}
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      <Phone className="h-4 w-4 text-[#0b84e5]" />
                      {t('login.phoneNumber')}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0b2b53] dark:text-[#dce8f7]">+998</span>
                          <div className="h-4 w-px bg-[#cfe0f1] dark:bg-[#2c4762]" />
                        </div>
                        <Input
                          placeholder={t('login.phoneNumberPlaceholder')}
                          value={handlePhoneInput(field.value).formatted}
                          onChange={(e) => field.onChange(handlePhoneInput(e.target.value).raw)}
                          className={`${inp} pl-[4.5rem] font-mono placeholder:font-normal`}
                        />
                      </div>
                    </FormControl>
                    <TranslatedFormMessage />
                  </FormItem>
                )} />

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitStatus === 'loading'}
                    className={`w-full text-base ${akbPrimaryButton}`}
                  >
                    <LogIn className="h-4 w-4" />
                    {t('login.submit')}
                  </Button>
                </div>

                <div className="text-center pb-1">
                  <p className={`text-sm ${akbMutedText}`}>
                    {t('login.noAccount')}{' '}
                    <button
                      type="button"
                      onClick={onNavigateToRegister}
                      className="font-semibold text-[#0b4edb] underline underline-offset-2 decoration-[#37c5f3]/60 transition-colors hover:text-[#073fba] dark:text-[#69a0ff] dark:hover:text-[#8ab7ff]"
                    >
                      {t('login.register')}
                    </button>
                  </p>
                </div>

              </form>
            </Form>
          </div>
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {showAddressDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-[#07182f]/25 backdrop-blur-sm"
                onClick={() => setShowAddressDrawer(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-[10000] mx-auto flex h-[80vh] max-w-lg flex-col overflow-y-auto rounded-t-lg border border-[#dbe8f4] bg-[#f8fbfe] p-5 pb-8 shadow-[0_-18px_44px_rgba(15,47,87,0.16)] dark:border-[#22364d] dark:bg-[#121e2f] dark:shadow-[0_-18px_44px_rgba(2,10,20,0.42)]"
              >
                <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[#cfe0f1] dark:bg-[#2c4762]" />
                <div className="text-center mb-6">
                  <h2 className={`text-xl ${akbHeading}`}>
                    {t('login.addressDrawer.title', 'Yashash manzilingizni kiriting')}
                  </h2>
                  <p className={`text-sm ${akbMutedText} mt-1`}>
                    {t('login.addressDrawer.subtitle', 'Davom etish uchun viloyat va tumaningizni belgilang')}
                  </p>
                </div>

                <Form {...addressForm}>
                  <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-5">
                    <FormField control={addressForm.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          <MapPin className="h-4 w-4 text-[#0b84e5]" />
                          {t('form.region')}
                        </FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          addressForm.setValue('district', '');
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

                    <FormField control={addressForm.control} name="district" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          <MapPin className="h-4 w-4 text-[#0b84e5]" />
                          {t('form.district')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!addressForm.watch('region')}
                        >
                          <FormControl>
                            <SelectTrigger className={`${inp} w-full`}>
                              <SelectValue placeholder={t('form.districtPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={selectContentClass}>
                            {addressForm.watch('region') && DISTRICTS[addressForm.watch('region')]?.map((d) => (
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

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={submitStatus === 'loading'}
                        className={`w-full text-base ${akbPrimaryButton}`}
                      >
                        {t('login.addressDrawer.submit', 'Saqlash va Kirish')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
