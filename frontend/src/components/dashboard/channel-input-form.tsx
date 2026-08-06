"use client";

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { Loader2, ArrowRight, Command } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  channel_url: z
    .string()
    .min(1, "Target parameter required.")
    .url("Awaiting valid YouTube coordinate protocol.")
    .refine(
      (val) => val.includes("youtube.com") || val.includes("youtu.be"),
      {
        message: "Unrecognized platform protocol. Require YouTube link.",
      }
    ),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (channelUrl: string) => void;
  isPending: boolean;
}

export function ChannelInputForm({ onSubmit, isPending }: Props) {
  const [focused, setFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const spotlightBackground = useTransform(
    [springX, springY],
    ([x, y]: number[]) =>
      `radial-gradient(200px circle at ${x}px ${y}px, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent)`
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel_url: "" },
  });

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const submit = (values: FormValues) => {
    setSuccess(true);
    onSubmit(values.channel_url);
  };

  const hasError = !!errors.channel_url;

  return (
    <form onSubmit={handleSubmit(submit)} className="flex w-full max-w-2xl flex-col gap-2">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={cn(
          "group relative flex w-full flex-col items-center gap-2 sm:flex-row rounded-[1.25rem] border bg-card/50 p-2 shadow-sm backdrop-blur-xl transition-all duration-500",
          focused
            ? "border-primary/40 shadow-[0_0_30px_-5px_color-mix(in_oklab,var(--color-primary)_20%,transparent)]"
            : "border-border/50",
          hasError && "border-destructive/50"
        )}
      >
        {/* Hover Highlight Effect simulating ambient light over glass */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[1.25rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: spotlightBackground }}
        />

        <div className="relative flex w-full flex-1 items-center gap-3 px-4 py-3">
          <Command
            className={cn(
              "h-4 w-4 shrink-0 transition-colors duration-300",
              focused ? "text-primary" : "text-muted-foreground"
            )}
          />
          <input
            {...register("channel_url")}
            disabled={isPending}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Assign target: https://www.youtube.com/@channel"
            className="w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
            aria-invalid={hasError ? "true" : "false"}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || success}
          className="relative inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-transform active:scale-95 sm:w-auto disabled:opacity-80"
        >
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Executing
              </motion.span>
            ) : success ? (
              <motion.span
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                Initiated
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                Deploy Agent <ArrowRight className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="h-6">
        <AnimatePresence>
          {hasError && (
            <motion.p
              id="url-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[13px] font-medium text-destructive ml-2"
              role="alert"
            >
              {errors.channel_url?.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}