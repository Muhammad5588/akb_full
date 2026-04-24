import { useEffect, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ban, ChevronRight, AlertTriangle, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProhibitedItem {
  id: number;
  title: string;
  examples: string | null;
}

interface ProhibitedDataResponse {
  success: boolean;
  data: {
    images: string[];
    header_title: string;
    header_subtitle: string;
    items: ProhibitedItem[];
    footer_note: string;
  };
}

const fetchProhibitedItems = async (): Promise<ProhibitedDataResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    data: {
      images: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
      ],
      header_title: "Aviada yuborish taqiqlangan mahsulotlar",
      header_subtitle:
        "DIQQAT! Quyidagi tovarlar havo yo'li orqali yuborilishi taqiqlanadi. Qoidabuzarlik uchun javobgarlik yuboruvchiga yuklatiladi.",
      items: [
        { id: 1, title: "Batareyalar va quvvat manbalari", examples: "(masalan: powerbank, lithium batareyalar, akkumulyatorlar)" },
        { id: 2, title: "Portlovchi va yonuvchi moddalar", examples: "(masalan: benzin, gaz ballonlar, pirotexnika, o'q-dorilar)" },
        { id: 3, title: "Magnitli buyumlar", examples: "(masalan: karnay, magnitli o'yinchoqlar)" },
        { id: 4, title: "O'tkir va kesuvchi buyumlar", examples: "(masalan: pichoqlar, qaychilar, arra)" },
        { id: 5, title: "Kukun va changsimon moddalar", examples: "(masalan: un, kukun bo'yoqlar, tozalash vositalari)" },
        { id: 6, title: "Oziq-ovqat mahsulotlari", examples: "(masalan: go'sht, baliq, sut mahsulotlari, mevalar)" },
        { id: 7, title: "Suyuqliklar", examples: "(masalan: atir, spirtli ichimliklar, kimyoviy eritma)" },
        { id: 8, title: "Kosmetika va parfyumeriya", examples: "(masalan: lak, atseton, sprey, aerozollar)" },
        { id: 9, title: "Qimmatbaho buyumlar", examples: "(masalan: soatlar, quloqchinlar, oltin, kumush buyumlar)" },
        { id: 10, title: "Tibbiy preparatlar va dorilar", examples: "(masalan: tabletkalar, siroplar, in'yeksiyalar)" },
      ],
      footer_note:
        "Iltimos, yuk jo'natishdan avval ushbu ro'yxat bilan tanishib chiqing. Taqiqlangan yuklar aniqlansa, javobgarlik to'liq yuboruvchiga yuklatiladi.",
    },
  };
};

const SkeletonLoader = memo(() => (
  <div className="animate-pulse space-y-5 p-5">
    <div className="h-44 rounded-lg bg-[#dbe8f4]" />
    <div className="space-y-2 rounded-lg border border-[#dbe8f4] bg-[#f8fbfe] p-4">
      <div className="h-5 w-3/4 rounded-lg bg-[#dbe8f4]" />
      <div className="h-3 w-full rounded bg-[#dbe8f4]" />
      <div className="h-3 w-5/6 rounded bg-[#dbe8f4]" />
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-[#dbe8f4]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[#dbe8f4]" />
          <div className="h-3 w-4/5 rounded bg-[#dbe8f4]" />
        </div>
      </div>
    ))}
  </div>
));

const ImageCarousel = memo(({ images }: { images: string[] }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!images.length) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="w-[90%] flex-shrink-0 snap-center overflow-hidden rounded-lg border border-[#dbe8f4] bg-[#f8fbfe] sm:w-full"
          >
            <img
              src={url}
              alt={t("prohibitedItems.imageAlt", { index: i + 1 })}
              className="h-44 w-full object-cover sm:h-52"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            className="hidden h-7 w-7 items-center justify-center rounded-lg bg-[#07182f]/80 text-white transition hover:bg-[#07182f] sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            className="hidden h-7 w-7 items-center justify-center rounded-lg bg-[#07182f]/80 text-white transition hover:bg-[#07182f] sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
});

interface ProhibitedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProhibitedItemsModal = ({ isOpen, onClose }: ProhibitedItemsModalProps) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prohibitedItems"],
    queryFn: fetchProhibitedItems,
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const items = data?.data;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="prohibited-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] flex items-end justify-center bg-[#07182f]/35 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            key="prohibited-modal"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-lg border border-[#dbe8f4] bg-white shadow-2xl sm:max-h-[85vh] sm:w-[450px] sm:max-w-[90vw] sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 border-b border-[#dbe8f4] bg-white">
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-[#cfe0f1]" />
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1f1]">
                    <Ban className="h-5 w-5 text-[#c44747]" />
                  </div>
                  <h2 className="text-base font-bold text-[#07182f]">
                    {t("prohibitedItems.title")}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe8f4] bg-[#f8fbfe] transition-colors active:scale-95 hover:bg-[#eef6ff]"
                >
                  <X className="h-5 w-5 text-[#63758a]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isLoading && <SkeletonLoader />}

              {isError && (
                <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#fff1f1]">
                    <AlertTriangle className="h-7 w-7 text-[#c44747]" />
                  </div>
                  <p className="text-sm font-medium text-[#63758a]">
                    {t("prohibitedItems.error")}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="rounded-lg bg-[#0b4edb] px-5 py-2 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-[#073fba]"
                  >
                    {t("prohibitedItems.retry")}
                  </button>
                </div>
              )}

              {items && (
                <div className="space-y-4 pb-4">
                  {items.images.length > 0 && (
                    <div className="px-4 pt-4">
                      <ImageCarousel images={items.images} />
                    </div>
                  )}

                  <div className="mx-4 rounded-lg border border-[#f3caca] bg-[#fff1f1] p-4">
                    <h3 className="mb-1.5 text-sm font-extrabold leading-snug text-[#c44747]">
                      {items.header_title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#8f3a3a]">
                      {items.header_subtitle}
                    </p>
                  </div>

                  <div className="space-y-2 px-4">
                    {items.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.25 }}
                        className="flex items-start gap-3 rounded-lg border border-[#dbe8f4] bg-[#f8fbfe] p-3"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff1f1]">
                          <Ban className="h-4 w-4 text-[#c44747]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug text-[#07182f]">
                            {item.title}
                          </p>
                          {item.examples && (
                            <p className="mt-0.5 text-xs leading-relaxed text-[#63758a]">
                              {item.examples}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mx-4 rounded-lg border border-[#cfe0f1] bg-[#eef6ff] p-4">
                    <p className="text-xs font-medium leading-relaxed text-[#31506e]">
                      {items.footer_note}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-20 border-t border-[#dbe8f4] bg-white p-4">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-[#0b4edb] py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] hover:bg-[#073fba]"
              >
                {t("prohibitedItems.understood")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default memo(ProhibitedItemsModal);
