"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Loader2, Sparkles, AlertCircle, ArrowRight, Link2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  channel_url: z
    .string()
    .min(1, "Channel URL is required")
    .url("Enter a valid YouTube channel URL")
    .refine((val) => val.includes("youtube.com"), {
      message: "Must be a YouTube channel URL",
    }),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (channelUrl: string) => void;
  isPending: boolean;
}

/* -------------------------------------------------------------------------
   MAGNETIC BUTTON
   Cursor "pulls" the button within a small radius, spring-released on
   leave. Combined with a press-compression scale and a shimmer sweep
   that plays on hover. This is the single most memorable micro-interaction
   on the page — it should feel like the button has weight.
------------------------------------------------------------------------- */
function MagneticSubmitButton({
  isPending,
  success,
  disabled,
}: {
  isPending: boolean;
  success: boolean;
  disabled: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 240, damping: 18, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.28);
    y.set(relY * 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="submit"
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "group relative flex h-[52px] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 font-medium text-[14px] transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        success
          ? "bg-emerald-500 text-white"
          : "bg-primary text-primary-foreground",
        disabled && !success && "cursor-not-allowed opacity-70"
      )}
    >
      {/* Shimmer sweep on hover */}
      {!disabled && (
        <motion.span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <motion.span
              key="success"
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <motion.path
                  d="M4 12l5 5L20 6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </motion.svg>
              Launched
            </motion.span>
          ) : isPending ? (
            <motion.span
              key="loading"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              Run analysis
              <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------
   HERO INPUT
   The input is the centerpiece — a breathing glow ring on focus, an
   animated conic border-beam that circles the field while focused, and
   inline error/valid iconography that springs in instead of red text
   appearing abruptly.
------------------------------------------------------------------------- */
export function ChannelInputForm({ onSubmit, isPending }: Props) {
  const [focused, setFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel_url: "" },
    mode: "onChange",
  });

  const value = watch("channel_url");
  const hasError = !!errors.channel_url;
  const isValid = touchedFields.channel_url && !hasError && value?.length > 0;

  const submit = (values: FormValues) => {
    setSuccess(true);
    onSubmit(values.channel_url);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col items-start gap-3 sm:flex-row"
    >
      <div className="w-full flex-1">
        <Label htmlFor="channel_url" className="sr-only">
          Channel URL
        </Label>

        <div className="relative">
          {/* Animated border-beam — only visible while focused */}
          <AnimatePresence>
            {focused && !isPending && (
              <motion.div
                aria-hidden
                className="absolute -inset-[1px] rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent, color-mix(in oklab, var(--color-primary) 70%, transparent), transparent 30%)",
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent, color-mix(in oklab, var(--color-primary) 70%, transparent), transparent 30%)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breathing ambient glow behind the field on focus */}
          <motion.div
            aria-hidden
            className="absolute -inset-3 rounded-2xl bg-primary/10 blur-xl"
            animate={{
              opacity: focused ? [0.5, 0.9, 0.5] : 0,
              scale: focused ? [1, 1.03, 1] : 0.95,
            }}
            transition={{ duration: 2.4, repeat: focused ? Infinity : 0, ease: "easeInOut" }}
          />

          <div className="relative rounded-xl bg-background p-[1.5px]">
            <div
              className={cn(
                "relative flex h-[52px] items-center gap-2.5 rounded-[10px] border bg-card px-4 transition-colors duration-300",
                hasError && touchedFields.channel_url
                  ? "border-red-500/50"
                  : isValid
                  ? "border-emerald-500/40"
                  : focused
                  ? "border-primary/40"
                  : "border-border/70"
              )}
            >
              <Link2
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-300",
                  focused ? "text-primary" : "text-muted-foreground/50"
                )}
              />
              <input
                id="channel_url"
                placeholder="https://www.youtube.com/@channelname"
                disabled={isPending}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete="off"
                spellCheck={false}
                className="h-full w-full bg-transparent text-[14.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                {...register("channel_url")}
              />

              <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <AnimatePresence mode="wait">
                  {hasError && touchedFields.channel_url ? (
                    <motion.span
                      key="error-icon"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </motion.span>
                  ) : isValid ? (
                    <motion.span
                      key="valid-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    >
                      <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500">
                        <motion.path
                          d="M4 12l5 5L20 6"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.35 }}
                        />
                      </motion.svg>
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {hasError && touchedFields.channel_url && (
            <motion.p
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 flex items-center gap-1.5 pl-1 text-[13px] text-red-500"
            >
              {errors.channel_url?.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <MagneticSubmitButton isPending={isPending} success={success} disabled={isPending} />
    </form>
  );
}