import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Trash2, Plus, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/api/services/walletService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CardsManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const slideVariants = {
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

export function CardsManagerModal({ isOpen, onClose }: CardsManagerModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');

    // Fetch cards
    const { data: cardsData, isLoading } = useQuery({
        queryKey: ['walletCards'],
        queryFn: walletService.getWalletCards,
        enabled: isOpen,
    });

    // Mutations
    const addCardMutation = useMutation({
        mutationFn: walletService.addWalletCard,
        onSuccess: () => {
            toast.success(t('wallet.cards.successAdd', "Karta qo'shildi"));
            queryClient.invalidateQueries({ queryKey: ['walletCards'] });
            handleBack();
        },
        onError: () => {
            toast.error(t('wallet.cards.errorAdd', "Karta qo'shishda xatolik"));
        }
    });

    const deleteCardMutation = useMutation({
        mutationFn: walletService.deleteWalletCard,
        onSuccess: () => {
            toast.success(t('wallet.cards.successDelete', "Karta o'chirildi"));
            queryClient.invalidateQueries({ queryKey: ['walletCards'] });
        },
        onError: () => {
            toast.error(t('wallet.cards.errorDelete', "Karta o'chirishda xatolik"));
        }
    });

    const resetForm = () => {
        setCardNumber('');
        setCardHolder('');
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9\s]/g, '');
        if (val.length <= 19) {
            setCardNumber(formatCardNumber(val));
        }
    };

    const handleAddCard = () => {
        const rawCardNumber = cardNumber.replace(/\s/g, '');

        // Basic validation before sending
        if (!rawCardNumber || !cardHolder) {
            toast.error(t('wallet.cards.errorIncomplete', "Ma'lumotlarni to'liq kiriting"));
            return;
        }
        if (rawCardNumber.length !== 16) {
            toast.error(t('wallet.cards.errorLength', "Karta raqami 16 ta raqamdan iborat bo'lishi kerak"));
            return;
        }

        addCardMutation.mutate({
            card_number: rawCardNumber,
            holder_name: cardHolder
        });
    };

    const handleDeleteCard = (id: number) => {
        if (confirm(t('wallet.cards.confirmDelete', "Kartani o'chirishni tasdiqlaysizmi?"))) {
            deleteCardMutation.mutate(id);
        }
    };

    const handleBack = () => {
        setIsAdding(false);
        resetForm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-[#f4f8fc] border-[#dbe8f4] overflow-hidden h-[90vh] sm:h-auto flex flex-col rounded-lg shadow-[0_18px_48px_rgba(10,35,70,0.18)]">
                <DialogHeader>
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
                                {t('wallet.cards.centerLabel', 'Hamyon')}
                            </p>
                            <DialogTitle className="text-[#07182f]">{isAdding ? t('wallet.cards.newCard', "Yangi karta") : t('wallet.cards.myCards', "Mening Kartalarim")}</DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 relative flex-1 grid overflow-hidden">
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
                                className="space-y-4 col-start-1 row-start-1 w-full h-full bg-transparent px-1 overflow-y-auto"
                            >
                                <div className="space-y-4 pb-6">
                                    <div className="p-6 rounded-lg bg-white text-[#07182f] shadow-[0_8px_20px_rgba(10,35,70,0.05)] mb-6 border border-[#dbe8f4]">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="h-8 w-12 rounded-lg border border-[#cfe0f1] bg-[#eef6ff]" />
                                            <CreditCard className="h-6 w-6 text-[#0b4edb]" />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-[#63758a] font-semibold uppercase mb-1">{t('wallet.cards.cardNumber', "Karta raqami")}</p>
                                                <p className="font-mono text-base sm:text-xl tracking-normal truncate">{cardNumber || '0000 0000 0000 0000'}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="text-xs text-[#63758a] font-semibold uppercase mb-1">{t('wallet.cards.cardHolder', "Egasi")}</p>
                                                    <p className="font-medium uppercase tracking-normal truncate max-w-[200px]">{cardHolder || 'ISMI FAMILIYASI'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('wallet.cards.cardNumber', "Karta raqami")}</Label>
                                        <Input
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            maxLength={19}
                                            className="h-12 font-mono rounded-lg border-[#dbe8f4] bg-[#f8fbfe] text-[#07182f] focus:border-[#0b84e5] focus:ring-[#37c5f3]/25"
                                            inputMode="numeric"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('wallet.cards.cardHolderName', "Egasi ismi")}</Label>
                                        <Input
                                            placeholder="ISMI FAMILIYASI"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                            className="h-12 rounded-lg border-[#dbe8f4] bg-[#f8fbfe] text-[#07182f] focus:border-[#0b84e5] focus:ring-[#37c5f3]/25"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleAddCard}
                                        disabled={addCardMutation.isPending}
                                            className="w-full h-12 rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white shadow-sm"
                                    >
                                        {addCardMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        {addCardMutation.isPending ? t('wallet.cards.saving', "Saqlanmoqda...") : t('wallet.cards.save', "Saqlash")}
                                    </Button>

                                    <Button variant="ghost" className="w-full" onClick={handleBack}>
                                        {t('wallet.cards.cancel', "Bekor qilish")}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="cards-list"
                                custom={-1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-4 col-start-1 row-start-1 w-full h-full bg-transparent px-1 overflow-y-auto"
                            >
                                {isLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-[#0b4edb]" />
                                    </div>
                                ) : cardsData?.cards.length === 0 ? (
                                    <div className="text-center py-12 text-[#63758a] flex flex-col items-center rounded-lg border border-[#dbe8f4] bg-white px-5">
                                        <div className="h-16 w-16 bg-[#eef6ff] border border-[#cfe0f1] rounded-lg flex items-center justify-center mb-4">
                                            <CreditCard className="h-8 w-8 text-[#0b4edb]" />
                                        </div>
                                        <p className="font-semibold text-[#07182f] mb-1">{t('wallet.cards.noCards', "Hozircha kartalar yo'q")}</p>
                                        <p className="text-sm text-[#63758a] mb-6 max-w-xs">{t('wallet.cards.addPrompt', "To'lovlarni tezroq amalga oshirish uchun karta qo'shing")}</p>
                                        <Button
                                            onClick={() => setIsAdding(true)}
                                            className="bg-[#0b4edb] hover:bg-[#073fba] text-white rounded-lg px-6"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t('wallet.cards.addCard', "Karta qo'shish")}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pb-20">
                                        {cardsData?.cards.map((card, index) => (
                                            <motion.div
                                                key={card.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="group relative overflow-hidden rounded-lg bg-white p-5 text-[#07182f] shadow-[0_8px_20px_rgba(10,35,70,0.05)] border border-[#dbe8f4]"
                                            >
                                                <div className="relative z-10 flex justify-between items-start">
                                                    <div>
                                                        <p className="font-mono text-xl tracking-normal">{card.masked_number}</p>
                                                        <p className="mt-4 text-xs font-semibold text-[#63758a] uppercase tracking-normal">
                                                            {card.holder_name}
                                                        </p>
                                                    </div>
                                                    <div className="h-8 w-12 rounded-lg border border-[#cfe0f1] bg-[#eef6ff]" />
                                                </div>

                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 bg-[#c44747] hover:bg-[#a93636]"
                                                    onClick={() => handleDeleteCard(card.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </motion.div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="w-full border-dashed border-2 py-6 text-[#63758a] hover:border-[#0b84e5] hover:text-[#0b4edb] hover:bg-[#eef6ff] transition-colors mt-4 rounded-lg"
                                            onClick={() => setIsAdding(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t('wallet.cards.addNewCard', "Yangi karta qo'shish")}
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog >
    );
}
