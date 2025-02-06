"use client";

import { Flashcard } from "@/components/ui/flashcard";
import { useRouter } from "next/navigation";

const sampleCard = {
  question: "What is social engineering?",
  answer:
    "Social engineering is a psychological manipulation technique used by cybercriminals to trick individuals into divulging confidential information, such as passwords, credit card numbers, or access to systems. Instead of directly hacking systems, attackers exploit human emotions like trust, fear, or urgency to achieve their goals. Social engineering is a psychological manipulation technique used by cybercriminals to trick individuals into divulging confidential information, such as passwords, credit card numbers, or access to systems. Instead of directly hacking systems, attackers exploit human emotions like trust, fear, or urgency to achieve their goals.Social engineering is a psychological manipulation technique used by cybercriminals to trick individuals into divulging confidential information, such as passwords, credit card numbers, or access to systems. Instead of directly hacking systems, attackers exploit human emotions like trust, fear, or urgency to achieve their goals.Social engineering is a psychological manipulation technique used by cybercriminals to trick individuals into divulging confidential information, such as passwords, credit card numbers, or access to systems. Instead of directly hacking systems, attackers exploit human emotions like trust, fear, or urgency to achieve their goals.Social engineering is a psychological manipulation technique used by cybercriminals to trick individuals into divulging confidential information, such as passwords, credit card numbers, or access to systems. Instead of directly hacking systems, attackers exploit human emotions like trust, fear, or urgency to achieve their goals.",
};

export default function LearnPage() {
  const router = useRouter();

  const handleEdit = () => {
    // Navigate to edit page
    router.push("/cards/edit/1");
  };

  const handleAnswer = (difficulty: "again" | "hard" | "good" | "perfect") => {
    // Handle spaced repetition logic here
    console.log("Difficulty:", difficulty);
  };

  return (
    // <Flashcard
    //   question={sampleCard.question}
    //   answer={sampleCard.answer}
    //   onEdit={handleEdit}
    //   onAnswer={handleAnswer}
    // />
    <div className="flex flex-col h-screen">
      {/* <div className="flex gap-4 font-fragment-mono">
        <span className="text-primary-blue">new: 1</span>
        <span className="text-primary-orange">due: 1</span>
        <span className="text-primary-green">learn: 1</span>
      </div> */}
      <Flashcard
        question="What is biology?"
        answer="Biology is the study of living organisms..."
        mnemonics="Big Ideas Of Life Organized Genetically Yearly"
        examples={[
          "Cell Theory - Example: The human body is made up of trillions of cells...",
          "Another example...",
        ]}
        imageUrl="/path-to-image.jpg"
        audioUrl="/path-to-audio.mp3"
        onEdit={() => {}}
        onAnswer={(difficulty) => {}}
      />
    </div>
  );
}
