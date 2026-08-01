"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CommandPalette } from "./command-palette";

export function Header() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/80 backdrop-blur px-6 py-3">
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground gap-2"
        onClick={() => setPaletteOpen(true)}
      >
        <Search className="h-4 w-4" />
        Search or run command
        <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
      </Button>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}