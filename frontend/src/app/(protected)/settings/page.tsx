"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
// import { AvatarSelection } from "./settings/avatar-selection";
import { AvatarSelection } from "./avatar-selection";
import { ResetPassword } from "./reset-password";
import { ChangeEmail } from "./change-email";
import { DailyLimits } from "./daily-limits";

export default function Settings() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-6 py-16 px-12">
        {/* Header */}

        <div className="text-foreground text-xl font-semibold "> Settings</div>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="avatar" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              Avatar Selection
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <AvatarSelection />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="password" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              Reset Password
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ResetPassword />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="email" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              Change Email
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ChangeEmail />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="limits" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              Set Daily Limits
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <DailyLimits />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
