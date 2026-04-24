import { useProfile, useLogout } from '@/hooks/useProfile';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { QuickActions } from '@/components/profile/QuickActions';
import { PersonalInfo } from '@/components/profile/PersonalInfo';
import { SessionHistory } from '@/components/profile/SessionHistory';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, RefreshCw, UserCog, FileImage, ShieldCheck, X, Download } from 'lucide-react';
import { useState, useCallback, lazy, Suspense, memo, useTransition, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { UniqueBackground } from '@/components/ui/UniqueBackground';
import { WalletModal } from '@/components/wallet/WalletModal';
import { CardsManagerModal } from '@/components/wallet/CardsManagerModal';
import { ExtraPassportsModal } from '@/components/profile/ExtraPassportsModal';
import { toast } from 'sonner';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

// Lazy load the heavy modal
const EditProfileModal = lazy(() => import('@/components/profile/EditProfileModal').then(module => ({ default: module.EditProfileModal })));

// --- Passport Images Component ---
const PassportImages = memo(({ images }: { images: string[] }) => {
   const { t } = useTranslation();
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      queueMicrotask(() => setMounted(true));
   }, []);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            setSelectedImage(null);
         }
      };

      if (selectedImage) {
         window.addEventListener('keydown', handleKeyDown);
      }
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [selectedImage]);

   if (!images || images.length === 0) {
      return (
         <div className="
            relative overflow-hidden rounded-lg p-6 text-center
            bg-white border border-[#dbe8f4]
            shadow-[0_8px_20px_rgba(10,35,70,0.05)]
         ">
            <div className="w-12 h-12 bg-[#eef6ff] border border-[#cfe0f1] rounded-lg flex items-center justify-center mx-auto mb-3 text-[#0b4edb]">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-[#07182f] mb-1">{t('profile.documents.noDocuments')}</h3>
            <p className="text-xs text-[#63758a]">
               {t('profile.documents.noDocumentsDesc')}
            </p>
         </div>
      );
   }

   return (
      <>
         <div className="space-y-3">
            <div className="ml-1 flex items-center justify-between gap-3">
               <div>
                  <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb] dark:text-[#fff1f1]">
                     {t('profile.documents.secureLabel', 'Hujjatlar')}
                  </p>
                  <h3 className="text-sm font-semibold tracking-normal text-[#07182f] dark:text-[#f3f3f3]">
                     {t('profile.documents.title')}
                  </h3>
               </div>
               <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] px-2 text-[10px] font-black text-[#0b4edb]">ID</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x scrollbar-hide">
               {images.map((src, idx) => (
                  <div
                     key={idx}
                     className="
                        flex-shrink-0 relative overflow-hidden
                        w-40 sm:w-48 aspect-[3/2] snap-start rounded-lg
                        bg-[#f8fbfe] border border-[#dbe8f4]
                        shadow-[0_8px_20px_rgba(10,35,70,0.05)] group cursor-pointer
                     "
                     onClick={() => setSelectedImage(src)}
                  >
                     <img
                        src={src}
                        alt={`Passport ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-[#07182f]/0 group-hover:bg-[#07182f]/10 transition-colors duration-300" />
                     <div className="absolute bottom-2 right-2 p-1.5 bg-[#07182f]/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <FileImage className="w-4 h-4" />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Lightbox Modal via Portal */}
         {mounted && createPortal(
            <AnimatePresence>
               {selectedImage && (
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setSelectedImage(null)}
                     className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07182f]/95 p-4"
                  >
                     <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-5xl flex flex-col items-center justify-center outline-none"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <button
                           onClick={() => setSelectedImage(null)}
                           className="
                              absolute -top-16 right-0 md:right-auto md:-top-16 md:relative md:self-end md:mb-4
                              p-3 text-white/80 hover:text-white 
                              bg-white/10 hover:bg-white/20 
                              rounded-lg
                              transition-colors
                              z-50
                           "
                           aria-label="Close"
                        >
                           <X className="w-8 h-8" />
                        </button>
                        <img
                           src={selectedImage}
                           alt="Passport Preview"
                           className="
                              max-h-[80vh] md:max-h-[85vh] 
                              max-w-full md:max-w-[90vw] 
                              object-contain 
                              rounded-lg shadow-[0_18px_48px_rgba(10,35,70,0.24)]
                              border border-white/10
                           "
                        />
                     </motion.div>
                  </motion.div>
               )}
            </AnimatePresence>,
            document.body
         )}
      </>
   );
});
PassportImages.displayName = 'PassportImages';

const UserPage = ({ onLogout }: { onLogout?: () => void }) => {
   const { data: user, isLoading, isError, refetch } = useProfile();
   const { mutate: logout } = useLogout(onLogout);
   const { t } = useTranslation();
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
   const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
   const [isPassportsModalOpen, setIsPassportsModalOpen] = useState(false);
   const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
   const [isModalLoading, startTransition] = useTransition();
   const { canInstall, installMethod, handleInstall } = useInstallPrompt();

   const handleLogout = useCallback(() => {
      setIsLogoutModalOpen(false);
      logout();
   }, [logout]);

   const handleEditOpen = useCallback(() => {
      startTransition(() => {
         setIsEditModalOpen(true);
      });
   }, []);

   const handleEditClose = useCallback(() => {
      setIsEditModalOpen(false);
   }, []);

   const handleRefetch = useCallback(() => {
      refetch();
   }, [refetch]);

   const handleInstallClick = useCallback(async () => {
      if ((installMethod as string) === 'manual') {
         toast(t('profile.install.manualTitle', "Bosh ekranga qo'shish"), {
            description: t(
               'profile.install.manualDescription',
               "Brauzer menyusidan Install App, Add to Home Screen yoki shunga o'xshash bandni tanlang.",
            ),
         });
         return;
      }

      try {
         await handleInstall();

         if (installMethod === 'telegram') {
            toast(t('profile.install.telegramStarted', 'Telegram oynasida tasdiqlang'), {
               description: t(
                  'profile.install.telegramStartedDescription',
                  "Shortcut qo'shish oynasi Telegram ichida ochiladi.",
               ),
            });
         }
      } catch {
         toast.error(
            t('profile.install.error', "Ilovani bosh ekranga qo'shib bo'lmadi. Qayta urinib ko'ring."),
         );
      }
   }, [handleInstall, installMethod, t]);

   const installHint =
      installMethod === 'telegram'
         ? t('profile.install.telegramHint', "Telegram oynasida shortcut qo'shishni tasdiqlang.")
         : (installMethod as string) === 'manual'
            ? t('profile.install.manualHint', "Brauzer menyusidan install yoki Add to Home Screen ni tanlang.")
            : t('profile.install.browserHint', 'Brauzer install oynasi chiqadi.');

   const installAction = canInstall ? (
      <div className="space-y-2">
         <Button
            variant="outline"
            className="w-full h-14 rounded-lg text-lg font-medium shadow-sm border-[#dbe8f4] bg-white hover:bg-[#eef6ff] active:scale-95 transition-all text-[#0b4edb] dark:border-[#2B4166] dark:bg-[#f3f8ff] dark:hover:bg-[#f3f8ff] dark:text-[#0b4edb]"
            onClick={handleInstallClick}
         >
            <Download className="mr-2 h-5 w-5" />
            {t('profile.install.action', "Bosh ekranga qo'shish")}
         </Button>
         <p className="text-center text-xs text-[#7d91a8] px-2">
            {installHint}
         </p>
      </div>
   ) : null;

   if (isLoading) {
      return <ProfileSkeleton />;
   }

   if (isError || !user) {
      return (
         <div className="flex w-full flex-col items-center justify-center min-h-[100vh] p-6 text-center bg-[#f4f8fc] pt-20">
            <UniqueBackground />
            <div className="relative z-10">
               <div className="w-20 h-20 bg-[#fff1f1] rounded-full flex items-center justify-center mb-6 animate-pulse mx-auto">
                  <LogOut className="h-8 w-8 text-[#c44747]" />
               </div>
               <h2 className="text-2xl font-bold text-[#07182f] mb-2">{t('profile.error.title')}</h2>
               <p className="text-[#63758a] mb-8 max-w-xs mx-auto">
                  {t('profile.error.description')}
               </p>
               <Button
                  onClick={handleRefetch}
                  size="lg"
                  className="rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white shadow-sm"
               >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {t('profile.error.retry')}
               </Button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#f4f8fc] text-[#07182f] transition-colors duration-500 font-sans">
         <UniqueBackground />

         <AnimatePresence mode="wait">
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="relative z-10"
            >
               {/* Desktop Container Wrapper */}
               <div className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-5 md:px-6 lg:px-8">
                  <div className="flex flex-col pb-10 md:grid md:grid-cols-12 md:items-start md:gap-8">
                     <div className="w-full md:col-span-12 mb-4">
                        <div className="rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_10px_24px_rgba(10,35,70,0.06)]">
                           <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                              {t('profile.pageLabel', 'Shaxsiy kabinet')}
                           </p>
                           <h1 className="mt-1 text-3xl font-semibold text-[#07182f]">
                              {t('navigation.profile', 'Profil')}
                           </h1>
                           <p className="mt-1 text-sm text-[#63758a]">
                              {t('profile.pageDescription', "Hisob ma'lumotlari va xavfsizlik sozlamalari")}
                           </p>
                        </div>
                     </div>

                     {/* LEFT COLUMN (Desktop): Profile Hero & Quick Actions */}
                     <aside className="w-full md:col-span-5 lg:col-span-4 md:sticky md:top-8 self-start z-30">
                        <div className="relative mx-auto w-full max-w-md overflow-hidden md:mx-0 md:max-w-none">
                           <ProfileHero user={user} onBalanceClick={() => setIsWalletModalOpen(true)} />
                        </div>

                        {/* Desktop Only: Quick Actions & Buttons moved here */}
                        <div className="hidden md:flex flex-col gap-6 mt-6">
                           <QuickActions
                              onWalletClick={() => setIsWalletModalOpen(true)}
                              onCardsClick={() => setIsCardsModalOpen(true)}
                              onPassportsClick={() => setIsPassportsModalOpen(true)}
                           />

                           {/* Passport Images (Desktop) */}
                           <PassportImages images={user.passport_images} />

                           <div className="space-y-3">
                              {installAction}
                              <Button
                                 variant="outline"
                                 className="w-full h-14 rounded-lg text-lg font-medium shadow-sm border-[#dbe8f4] bg-white hover:bg-[#eef6ff] active:scale-95 transition-all text-[#0b4edb]"
                                 onClick={handleEditOpen}
                              >
                                 {isModalLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <UserCog className="mr-2 h-5 w-5" />}
                                 {isModalLoading ? t('profile.edit.loading') : t('profile.editProfile')}
                              </Button>
                              <Button
                                 variant="destructive"
                                 className="w-full h-14 rounded-lg text-lg font-medium shadow-sm bg-[#fff1f1] hover:bg-[#ffe7e7] text-[#c44747] border border-[#f0cccc] transition-all active:scale-95"
                                 onClick={() => setIsLogoutModalOpen(true)}
                              >
                                 <LogOut className="mr-2 h-5 w-5" />
                                 {t('profile.logout')}
                              </Button>
                              <p className="text-center text-xs text-[#7d91a8] mt-2">
                                 {t('profile.version')}
                              </p>
                           </div>
                        </div>
                     </aside>

                     {/* RIGHT COLUMN (Desktop): Main Content */}
                     <main className="w-full md:col-span-7 lg:col-span-8 relative z-20 md:mt-0">
                        {/* Mobile Negative Margin Wrapper */}
                        <div className="mt-4 md:mt-0 pb-10 md:pb-0 space-y-5 md:space-y-6">

                           {/* Mobile Only: Quick Actions */}
                           <div className="md:hidden mx-auto w-full max-w-md">
                              <QuickActions
                                 onWalletClick={() => setIsWalletModalOpen(true)}
                                 onCardsClick={() => setIsCardsModalOpen(true)}
                                 onPassportsClick={() => setIsPassportsModalOpen(true)}
                              />
                           </div>

                           {/* Mobile Only: Passport Images */}
                           <div className="md:hidden mx-auto w-full max-w-md">
                              <PassportImages images={user.passport_images} />
                           </div>

                           <PersonalInfo user={user} />

                           <SessionHistory />

                           {/* Mobile Only: Buttons */}
                           <div className="md:hidden mx-auto w-full max-w-md space-y-3 pt-4">
                              {installAction}
                              <Button
                                 variant="outline"
                                 className="w-full h-14 rounded-lg text-lg font-medium shadow-sm border-[#dbe8f4] bg-white hover:bg-[#eef6ff] active:scale-95 transition-all text-[#0b4edb] dark:border-[#2B4166] dark:bg-[#f3f8ff] dark:hover:bg-[#f3f8ff] dark:text-[#0b4edb]"
                                 onClick={handleEditOpen}
                              >
                                 {isModalLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <UserCog className="mr-2 h-5 w-5" />}
                                 {isModalLoading ? t('profile.edit.loading') : t('profile.editProfile')}
                              </Button>
                              <Button
                                 variant="destructive"
                                 className="w-full h-14 rounded-lg text-lg font-medium shadow-sm bg-[#fff1f1] hover:bg-[#ffe7e7] text-[#c44747] border border-[#f0cccc] transition-all active:scale-95 dark:bg-[#fff1f1] dark:hover:bg-[#ffe7e7] dark:text-[#c44747] dark:border-[#f0cccc]"
                                 onClick={() => setIsLogoutModalOpen(true)}
                              >
                                 <LogOut className="mr-2 h-5 w-5" />
                                 {t('profile.logout')}
                              </Button>
                              <p className="text-center text-xs text-[#7d91a8] mt-4 pb-8">
                                 {t('profile.version')}
                              </p>
                           </div>
                        </div>
                     </main>

                  </div>
               </div>

               <WalletModal
                  isOpen={isWalletModalOpen}
                  onClose={() => setIsWalletModalOpen(false)}
               />
               <CardsManagerModal
                  isOpen={isCardsModalOpen}
                  onClose={() => setIsCardsModalOpen(false)}
               />
               <ExtraPassportsModal
                  isOpen={isPassportsModalOpen}
                  onClose={() => setIsPassportsModalOpen(false)}
               />

               <Suspense fallback={null}>
                  {isEditModalOpen && (
                     <EditProfileModal
                        isOpen={isEditModalOpen}
                        onClose={handleEditClose}
                        user={user}
                     />
                  )}
               </Suspense>

               {/* Logout Confirmation Modal */}
               <AnimatePresence>
                  {isLogoutModalOpen && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           onClick={() => setIsLogoutModalOpen(false)}
                           className="absolute inset-0 bg-[#07182f]/35"
                        />
                        
                        {/* Modal Content */}
                        <motion.div
                           initial={{ opacity: 0, scale: 0.95, y: 20 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95, y: 20 }}
                           className="relative w-full max-w-sm bg-white border border-[#dbe8f4] rounded-lg p-6 shadow-[0_18px_48px_rgba(10,35,70,0.18)] overflow-hidden"
                        >
                           <div className="flex flex-col items-center text-center">
                              <div className="w-16 h-16 bg-[#fff1f1] rounded-lg flex items-center justify-center mb-4">
                                 <LogOut className="w-8 h-8 text-[#c44747]" />
                              </div>
                              <h3 className="text-xl font-bold text-[#07182f] mb-2">
                                 {t('profile.logoutConfirm.title', 'Tizimdan chiqish')}
                              </h3>
                              <p className="text-sm text-[#63758a] mb-6">
                                 {t('profile.logoutConfirm.description', 'Haqiqatan ham hisobingizdan chiqmoqchimisiz?')}
                              </p>
                              
                              <div className="flex w-full gap-3">
                                 <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-lg bg-white border-[#dbe8f4] text-[#63758a] hover:bg-[#eef6ff]"
                                    onClick={() => setIsLogoutModalOpen(false)}
                                 >
                                    {t('profile.logoutConfirm.cancel', 'Bekor qilish')}
                                 </Button>
                                 <Button
                                    variant="destructive"
                                    className="flex-1 h-12 rounded-lg bg-[#c44747] hover:bg-[#a83a3a] shadow-sm"
                                    onClick={handleLogout}
                                 >
                                    {t('profile.logoutConfirm.confirm', 'Chiqish')}
                                 </Button>
                              </div>
                           </div>
                        </motion.div>
                     </div>
                  )}
               </AnimatePresence>
            </motion.div>
         </AnimatePresence>
      </div>
   );
};

const ProfileSkeleton = memo(() => {
   return (
      <div className="min-h-screen bg-[#f4f8fc]">
         <UniqueBackground />
         <div className="mx-auto max-w-md px-4 pt-20 relative z-10 space-y-5 sm:px-5">
            <div className="rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_10px_24px_rgba(10,35,70,0.06)]">
               <Skeleton className="h-4 w-28 bg-[#e8eff6] rounded-lg mb-3" />
               <Skeleton className="h-8 w-44 bg-[#e8eff6] rounded-lg mb-2" />
               <Skeleton className="h-4 w-56 bg-[#e8eff6] rounded-lg" />
            </div>
            <Skeleton className="h-36 w-full rounded-lg bg-[#e8eff6]" />
            <div className="grid grid-cols-3 gap-4">
               <Skeleton className="h-24 w-full rounded-lg bg-[#e8eff6]" />
               <Skeleton className="h-24 w-full rounded-lg bg-[#e8eff6]" />
               <Skeleton className="h-24 w-full rounded-lg bg-[#e8eff6]" />
            </div>

            <div className="space-y-4">
               <Skeleton className="h-6 w-40 bg-[#e8eff6] rounded-lg" />
               <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                     <Skeleton key={i} className="h-20 w-full rounded-lg bg-[#e8eff6]" />
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
});
ProfileSkeleton.displayName = 'ProfileSkeleton';

export default UserPage;
