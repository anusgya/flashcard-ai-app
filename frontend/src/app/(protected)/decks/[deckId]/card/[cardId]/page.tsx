"use client";

import { ArrowLeft, MoreVertical, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    deckId: string;
    cardId: string;
  };
}

// Reusable InfoBox component
const InfoBox = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) => (
  <div className="bg-background rounded-lg border border-divider">
    <div className="p-4 border-b border-divider flex items-center justify-between">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="text-secondary-foreground hover:text-foreground -mr-2"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default function CardDetailPage({ params }: PageProps) {
  return (
    <div className="h-screen pt-3 px-12">
      <div className="mb-8 ">
        <Link href={`/decks/${params.deckId}`}>
          <Button
            variant="outline"
            size="icon"
            className="text-secondary-foreground border border-divider rounded-full hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="bg-muted rounded-lg border border-divider h-[calc(100vh-7rem)]">
        <div className="grid grid-cols-2 divide-x divide-divider h-full">
          {/* Question Side */}
          <div className="p-8 space-y-6 h-full overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-semibold text-foreground font-inter flex-1 min-w-0 break-words">
                What is biology i don't know here
                sldjflksdjflksjdlfkjsdljflsdjflksjdflk?
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  className="text-primary-blue hover:text-primary-blue/90 font-inter text-xs whitespace-nowrap"
                >
                  get cheat code
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-secondary-foreground hover:text-foreground flex-shrink-0"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="text-foreground leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          {/* Mnemonic Side */}
          <div className="p-8 space-y-6 h-full overflow-auto">
            <InfoBox title="Mnemonic device" onClose={() => {}}>
              <div className="space-y-1">
                <p>
                  <span className="text-primary-blue">B</span>ig
                </p>
                <p>
                  <span className="text-primary-blue">I</span>deas
                </p>
                <p>
                  <span className="text-primary-blue">O</span>f
                </p>
                <p>
                  <span className="text-primary-blue">L</span>ife
                </p>
                <p>
                  <span className="text-primary-blue">O</span>rganized
                </p>
                <p>
                  <span className="text-primary-blue">G</span>enetically
                </p>
                <p>
                  <span className="text-primary-blue">Y</span>early
                </p>
              </div>
            </InfoBox>

            <InfoBox title="Example">
              <p className="text-foreground leading-relaxed">
                Cell Theory – Example: The human body is made up of trillions of
                cells, such as muscle cells and nerve cells. i don't know man i
                don't know what to do i am so sad hahaha hehhehehdslk lkajdklfj
                i aond' tknow anything which makes everything Lorem ipsum dolor
                sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris nisi ut
                aliquip ex ea commodo consequat.
              </p>
            </InfoBox>
            <InfoBox title="Example">
              <p className="text-foreground leading-relaxed">
                Cell Theory – Example: The human body is made up of trillions of
                cells, such as muscle cells and nerve cells. i don't know man i
                don't know what to do i am so sad hahaha hehhehehdslk lkajdklfj
                i aond' tknow anything which makes everything Lorem ipsum dolor
                sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris nisi ut
                aliquip ex ea commodo consequat.
              </p>
            </InfoBox>
          </div>
        </div>
      </div>
    </div>
  );
}
