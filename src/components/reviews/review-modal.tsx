"use client";

import { useState, useRef } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Star, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewModalProps = {
  bookingId: string;
  providerName: string;
  providerNameAr: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const CATEGORY_KEYS = ["punctuality", "quality", "communication", "value"] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_LABELS: Record<CategoryKey, Record<string, string>> = {
  punctuality: { en: "Punctuality", ar: "الالتزام بالوقت" },
  quality: { en: "Quality", ar: "جودة العمل" },
  communication: { en: "Communication", ar: "التواصل" },
  value: { en: "Value for Money", ar: "القيمة مقابل السعر" },
};

function StarRow({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = (hovered || value) > i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110"
            aria-label={`Rate ${i + 1} star${i > 0 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizeClass,
                "transition-colors",
                filled ? "text-yellow-400 fill-yellow-400" : "text-warm-200"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewModal({
  bookingId,
  providerName,
  providerNameAr,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { locale, isRtl } = useLocale();

  const [rating, setRating] = useState(0);
  const [categories, setCategories] = useState<Record<CategoryKey, number>>({
    punctuality: 0,
    quality: 0,
    communication: 0,
    value: 0,
  });
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = locale === "ar" ? providerNameAr : providerName;

  function resetForm() {
    setRating(0);
    setCategories({ punctuality: 0, quality: 0, communication: 0, value: 0 });
    setTitle("");
    setComment("");
    setImages([]);
    setError("");
    setSuccess(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || images.length >= 3) return;
    const remaining = 3 - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    setImageUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", "reviews");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data.url);
        }
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 3));
    } catch {
      setError(locale === "ar" ? "فشل رفع الصورة" : "Image upload failed");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(locale === "ar" ? "يرجى تحديد التقييم" : "Please select a rating");
      return;
    }
    if (comment.trim().length < 10) {
      setError(
        locale === "ar"
          ? "التعليق يجب أن يكون 10 أحرف على الأقل"
          : "Comment must be at least 10 characters"
      );
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          title: title || undefined,
          comment,
          images,
          categories,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (locale === "ar" ? "حدث خطأ" : "Something went wrong"));
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        resetForm();
        onSuccess();
        onClose();
      }, 1800);
    } catch {
      setError(locale === "ar" ? "فشل الإرسال" : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="rounded-full bg-green-100 p-4 animate-bounce-once">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-heading font-bold text-warm-900">
              {locale === "ar" ? "شكراً على تقييمك!" : "Thank you for your review!"}
            </h2>
            <p className="text-sm text-warm-500 text-center">
              {locale === "ar"
                ? "تقييمك يساعد الآخرين في اختيار أفضل مزود"
                : "Your review helps others find great providers"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {locale === "ar" ? "تقييم الخدمة" : "Review Service"}
              </DialogTitle>
              <DialogDescription>
                {locale === "ar"
                  ? `شاركنا تجربتك مع ${displayName}`
                  : `Share your experience with ${displayName}`}
              </DialogDescription>
            </DialogHeader>

            {/* Overall Rating */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-warm-800">
                {locale === "ar" ? "التقييم العام" : "Overall Rating"}
                <span className="text-red-500 ms-1">*</span>
              </p>
              <StarRow value={rating} onChange={setRating} size="lg" />
            </div>

            {/* Category Ratings */}
            <div className="space-y-3 border border-warm-100 rounded-[12px] p-4 bg-warm-50">
              <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide">
                {locale === "ar" ? "تقييم تفصيلي" : "Detailed Ratings"}
              </p>
              {CATEGORY_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-warm-700 min-w-0 flex-1">
                    {CATEGORY_LABELS[key][locale] ?? CATEGORY_LABELS[key].en}
                  </span>
                  <StarRow
                    value={categories[key]}
                    onChange={(v) => setCategories((prev) => ({ ...prev, [key]: v }))}
                    size="sm"
                  />
                </div>
              ))}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-warm-700">
                {locale === "ar" ? "عنوان التقييم (اختياري)" : "Review Title (optional)"}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={locale === "ar" ? "ملخص تجربتك..." : "Summarize your experience..."}
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-warm-700">
                {locale === "ar" ? "تعليقك" : "Your Comment"}
                <span className="text-red-500 ms-1">*</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "أخبرنا عن تجربتك (10 أحرف على الأقل)..."
                    : "Tell us about your experience (min 10 characters)..."
                }
                rows={4}
                minLength={10}
              />
              <p className="text-xs text-warm-400 text-end">{comment.length} / 500</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-warm-700">
                {locale === "ar" ? "صور (اختياري، حتى 3)" : "Photos (optional, up to 3)"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {images.map((url, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-[10px] overflow-hidden border border-warm-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 end-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="h-20 w-20 rounded-[10px] border-2 border-dashed border-warm-200 flex flex-col items-center justify-center gap-1 text-warm-400 hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                  >
                    {imageUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span className="text-[10px]">{locale === "ar" ? "رفع" : "Upload"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-[8px] px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : null}
                {locale === "ar" ? "إرسال التقييم" : "Submit Review"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
