"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useRouter } from "next/navigation"
import { AvatarSelection } from "./avatar-selection"
import { ResetPassword } from "./reset-password"
import { ChangeEmail } from "./change-email"
import { ChangeUsername } from "./change-username"
import { DailyLimits } from "./daily-limits"
import { motion } from "framer-motion"


export default function Settings() {
  const router = useRouter()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full space-y-6 py-16 px-12">
        {/* Header */}
        <div className="flex gap-2 flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-foreground text-2xl font-bold"
        >
        Settings
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-fragment-mono text-sm text-secondary-foreground"
        >
        Manage your account here
        </motion.div>
        </div>

        <motion.div variants={container} initial="hidden" animate="show">
          <Accordion type="single" collapsible className="space-y-4">
            <motion.div variants={item}>
              <AccordionItem value="avatar" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline  font-semibold "> 🦊  Select Avatar</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <AvatarSelection />
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            <motion.div variants={item}>
              <AccordionItem value="username" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline  font-semibold ">
                 👤  Change Username
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ChangeUsername />
                </AccordionContent>
              </AccordionItem>
            </motion.div>



            <motion.div variants={item}>
              <AccordionItem value="email" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline  font-semibold ">
                 ✉️  Change Email
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ChangeEmail />
                </AccordionContent>
              </AccordionItem>
            </motion.div>
            <motion.div variants={item}>
              <AccordionItem value="password" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline  font-semibold ">🔑  Reset Password</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ResetPassword />
                </AccordionContent>
              </AccordionItem>
            </motion.div>



      


            {/* <motion.div variants={item}>
              <AccordionItem value="limits" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">Set Daily Limits</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <DailyLimits />
                </AccordionContent>
              </AccordionItem>
            </motion.div> */}
          </Accordion>
        </motion.div>
      </div>
    </motion.div>
  )
}
