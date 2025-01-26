"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Log in to your account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-input text-foreground placeholder:text-secondary-foreground"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className=" border-input text-foreground placeholder:text-secondary-foreground"
              required
            />
          </div>

          <Button
            type="submit"
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-primary-green text-primary-green-secondary font-semibold hover:bg-primary-green/90"
          >
            Login
          </Button>

          <div className="text-center">
            <a
              href="#"
              className="text-xs text-secondary-foreground hover:text-primary"
            >
              Forgot Password?
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-input"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-input text-secondary-foreground hover:bg-input hover:text-foreground"
            onClick={() => (window.location.href = "/register")}
          >
            Create an account
          </Button>
        </form>
      </div>
    </div>
  );
}
