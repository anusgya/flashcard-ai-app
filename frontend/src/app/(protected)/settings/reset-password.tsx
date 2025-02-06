"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPassword() {
  return (
    <form className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="current-password" className="text-secondary-foreground">
          Current Password
        </Label>
        <Input
          id="current-password"
          type="password"
          // placeholder="Enter current password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-secondary-foreground">
          New Password
        </Label>
        <Input
          id="new-password"
          type="password"
          // placeholder="Enter new password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-secondary-foreground" >
          Confirm New Password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          // placeholder="Confirm new password"
        />
      </div>
      <Button className="w-48 bg-primary-green text-muted">
        Update Password
      </Button>
    </form>
  );
}
