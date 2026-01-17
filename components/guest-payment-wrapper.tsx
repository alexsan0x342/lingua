"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { EmbeddedStripePayment } from "@/components/payments/EmbeddedStripePayment";
import Link from "next/link";

interface GuestPaymentWrapperProps {
  courseId: string;
  courseTitle: string;
  amount: number;
  currency?: string;
}

export function GuestPaymentWrapper({ 
  courseId, 
  courseTitle, 
  amount, 
  currency = "usd" 
}: GuestPaymentWrapperProps) {
  const { data: session } = authClient.useSession();
  const isGuest = !session;

  // If user is logged in, show payment directly
  if (!isGuest) {
    return (
      <EmbeddedStripePayment
        courseId={courseId}
        courseTitle={courseTitle}
        amount={amount}
        currency={currency}
      />
    );
  }

  // For guest users, show login prompt instead of allowing guest payment
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <LogIn className="w-5 h-5" />
          Login Required
        </CardTitle>
        <CardDescription>
          Please log in to your account to purchase this course
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          You need to be logged in to make a purchase. This helps us provide better service and manage your enrollments.
        </p>
        
        <div className="space-y-3">
          <Link href="/login" className="w-full">
            <Button className="w-full" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
          </Link>
          
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
