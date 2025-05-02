"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useMe, { updateUserProfile } from "@/hooks/api/use-me";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function ChangeEmail() {
  const { user, mutate } = useMe();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!currentEmail.trim() || !newEmail.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check if current email matches user's email
    if (user && currentEmail !== user.email) {
      toast({
        title: "Error",
        description: "Current email does not match your account",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the API to update the email
      const response = await updateUserProfile({
        email: newEmail,
        password: password, // For verification
      });
      
      console.log("response", response);
      // If the backend returns a new token, update it
      // Update the local state with the new data
      mutate();

      toast({
        title: "Success",
        description: "Email updated successfully",
      });

      router.push("/login");
      // Reset form
      setCurrentEmail("");
      setNewEmail("");
      setPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update email. Please check your password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="current-email" className="text-secondary-foreground">
          Current Email
        </Label>
        <Input 
          id="current-email" 
          type="email" 
          value={currentEmail}
          onChange={(e) => setCurrentEmail(e.target.value)}
          placeholder={user?.email || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-email" className="text-secondary-foreground">
          New Email
        </Label>
        <Input 
          id="new-email" 
          type="email" 
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-secondary-foreground">
          Password
        </Label>
        <Input 
          id="password" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button 
        type="submit"
        className="w-48 bg-primary-green text-muted font-semibold hover:border-0"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Change Email"}
      </Button>
    </form>
  );
}
