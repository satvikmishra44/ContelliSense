"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-display font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <Label>Theme</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark mode.
            </p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Analysis complete alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show a toast when a new report finishes generating.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly digest</Label>
              <p className="text-sm text-muted-foreground">
                Summary of channel trends every Monday.
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}