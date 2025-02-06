"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export function Confetti() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setIsActive(false);
    }
  }, [isActive]);

  return { triggerConfetti: () => setIsActive(true) };
}
