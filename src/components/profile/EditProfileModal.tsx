import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from '@/hooks/useProfile';
import { type ProfileResponse } from '@/types/profile';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { regions, DISTRICTS } from '@/lib/validation';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: ProfileResponse;
    onSaved?: () => void;
}

export const EditProfileModal = ({ isOpen, onClose, user, onSaved }: EditProfileModalProps) => {
    const { mutate, isPending } = useUpdateProfile();
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: '',
        region: '',
        district: ''
    });

    useEffect(() => {
        if (user) {
            queueMicrotask(() => {
                const regionKey = regions.find(r => r.value === user.region)?.value || '';
                setFormData({
                    full_name: user.full_name,
                    phone: user.phone,
                    address: user.address,
                    region: regionKey,
                    district: user.district || ''
                });
            });
        }
    }, [user, isOpen]);

    const handleRegionChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            region: value,
            district: ''
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(formData, {
            onSuccess: () => {
                onSaved?.();
                onClose();
                toast.success(t('profile.edit.saved'));
            }
        });
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

    const currentDistricts = formData.region ? DISTRICTS[formData.region] || [] : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#f4f8fc] border-[#dbe8f4] max-h-[90vh] overflow-y-auto rounded-lg shadow-[0_18px_48px_rgba(10,35,70,0.18)]">
                <DialogHeader>
                    <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                        {t('profile.edit.secureLabel', 'Profil sozlamalari')}
                    </p>
                    <DialogTitle className="text-2xl font-semibold text-[#07182f]">{t('profile.edit.title')}</DialogTitle>
                    <DialogDescription className="text-[#63758a]">
                        {t('profile.edit.description')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-right">{t('profile.edit.fullName')}</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className={inp}
                            required
                            minLength={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-right">{t('profile.edit.phone')}</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={inp}
                            required
                            pattern="^\+?[0-9\s]*$"
                        />
                    </div>

                    {/* Region Select */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-sm text-[#07182f] tracking-normal flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#0b4edb]" />
                            {t('profile.edit.region')}
                        </Label>
                        <Select onValueChange={handleRegionChange} value={formData.region}>
                            <SelectTrigger className={`${inp} w-full`}>
                                <SelectValue placeholder={t('form.regionPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#dbe8f4] rounded-lg overflow-hidden shadow-xl max-h-60">
                                {regions.map((r) => (
                                    <SelectItem
                                        key={r.value}
                                        value={r.value}
                                        className="rounded-lg cursor-pointer hover:bg-[#eef6ff] text-[#07182f]"
                                    >
                                        {t(r.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* District Select */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-sm text-[#07182f] tracking-normal flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#0b4edb] opacity-70" />
                            {t('profile.edit.district')}
                        </Label>
                        <Select
                            onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
                            value={formData.district}
                            disabled={!formData.region}
                        >
                            <SelectTrigger className={`${inp} w-full`}>
                                <SelectValue placeholder={t('form.districtPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#dbe8f4] rounded-lg overflow-hidden shadow-xl max-h-60">
                                {currentDistricts.map((d) => (
                                    <SelectItem
                                        key={d.value}
                                        value={d.value}
                                        className="rounded-lg cursor-pointer hover:bg-[#eef6ff] text-[#07182f]"
                                    >
                                        {t(d.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-right">{t('profile.edit.address')}</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className={inp}
                        />
                    </div>

                    <DialogFooter className="mt-6 gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-lg border-[#dbe8f4] bg-white text-[#63758a] hover:bg-[#eef6ff]">
                            {t('profile.edit.cancel')}
                        </Button>
                        <Button type="submit" disabled={isPending} className="rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('profile.edit.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
