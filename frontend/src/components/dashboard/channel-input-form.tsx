"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Loader2, Sparkles } from "lucide-react";

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

export function ChannelInputForm({ onSubmit, isPending }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      channel_url: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.channel_url))}
      className="flex flex-col sm:flex-row gap-3 items-start"
    >
      <div className="flex-1 w-full">
        <Label htmlFor="channel_url" className="sr-only">
          Channel URL
        </Label>

        <Input
          id="channel_url"
          placeholder="https://www.youtube.com/@channelname"
          disabled={isPending}
          {...register("channel_url")}
        />

        {errors.channel_url && (
          <p className="mt-1 text-sm text-red-500">
            {errors.channel_url.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="gap-2 shrink-0">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isPending ? "Analyzing..." : "Run analysis"}
      </Button>
    </form>
  );
}