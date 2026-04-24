import { z } from "zod";

export const DELIVERY_METHODS = ["uzpost", "bts", "akb", "yandex", "self_pickup"] as const;

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  uzpost: "UzPost",
  bts: "BTS",
  akb: "AKB Dostavka",
  yandex: "Yandex",
  self_pickup: "O'zi olib ketdi",
};

export const markTakenSchema = z.object({
  delivery_method: z.enum(DELIVERY_METHODS, {
    error: "Yetkazib berish usulini tanlang",
  }),
  photos: z
    .array(z.instanceof(File), {
      error: "Kamida bitta rasm yuklang",
    })
    .min(1, "Kamida bitta rasm yuklang")
    .max(10, "Maksimal 10 ta rasm yuklash mumkin"),
  comment: z.string().optional(),
});

export type MarkTakenFormValues = z.infer<typeof markTakenSchema>;
