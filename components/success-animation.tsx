"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Gift, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  title: string;
  message: string;
  type?: "payment" | "redemption";
}

export function SuccessAnimation({ 
  isVisible, 
  onComplete, 
  title, 
  message, 
  type = "redemption" 
}: SuccessAnimationProps) {
  const [showPapers, setShowPapers] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start the animation sequence
      const timer1 = setTimeout(() => setShowPapers(true), 100);
      const timer2 = setTimeout(() => setShowConfetti(true), 300);
      const timer3 = setTimeout(() => onComplete(), 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setShowPapers(false);
      setShowConfetti(false);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="relative max-w-md w-full mx-4 shadow-2xl border-2">
        <CardContent className="p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                {type === "redemption" ? (
                  <Gift className="w-10 h-10 text-primary" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-primary" />
                )}
              </div>
              
              {/* Sparkles Animation */}
              {showConfetti && (
                <>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
                  <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-secondary-foreground animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <Sparkles className="absolute top-1 -left-3 w-5 h-5 text-accent-foreground animate-pulse" style={{ animationDelay: '1s' }} />
                </>
              )}
            </div>
          </div>

          {/* Title and Message */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground">{message}</p>
          </div>

          {/* Floating Papers Animation */}
          {showPapers && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              {/* Paper pieces */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/60 rounded-sm opacity-80"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
              
              {/* Larger paper pieces */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={`large-${i}`}
                  className="absolute w-3 h-3 bg-accent rounded-sm opacity-70"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-1 mb-4">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-3000 ease-out"
              style={{ width: isVisible ? '100%' : '0%' }}
            />
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-sm">
              {type === "redemption" ? "Code redeemed successfully!" : "Payment processed!"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.8;
          }
          25% {
            transform: translateY(-10px) rotate(90deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-10px) rotate(270deg);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
