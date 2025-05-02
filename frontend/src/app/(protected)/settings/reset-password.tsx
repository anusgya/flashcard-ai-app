"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/hooks/api/use-me";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "@/hooks/api/use-me";

export function ResetPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Password match validation
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Password strength validation
    if (newPassword.length < 3) {
      toast({
        title: "Error",
        description: "Password must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the API to update the password
      const response = await updateUserProfile({
        password: newPassword, // For verification
      });
      toast({
        title: "Success",
        description: "Password updated successfully. Please log in again with your new password.",
      });

      router.push("/login");
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect to login after password change
     
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="current-password" className="text-secondary-foreground">
          Current Password
        </Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-secondary-foreground">
          New Password
        </Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-secondary-foreground" >
          Confirm New Password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button 
        type="submit"
        className="w-48 bg-primary-green text-muted hover:border-0"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}
