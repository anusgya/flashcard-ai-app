"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmail() {
  return (
    <form className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="current-email" className="text-secondary-foreground">
          Current Email
        </Label>
        <Input id="current-email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-email" className="text-secondary-foreground">
          New Email
        </Label>
        <Input id="new-email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-secondary-foreground">
          Password
        </Label>
        <Input id="password" type="password" />
      </div>
      <Button className="w-48 bg-primary-green text-muted font-semibold">
        Update Email
      </Button>
    </form>
  );
}
