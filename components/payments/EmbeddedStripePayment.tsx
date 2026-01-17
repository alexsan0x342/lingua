"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, Loader2, Zap, Star } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { useConfetti } from "@/hooks/use-confetti";
import { SuccessAnimation } from "@/components/success-animation";
import { useTranslations } from "@/components/general/I18nProvider";

// Initialize Stripe with error handling
const getStripePromise = () => {
  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    return Promise.resolve(null);
  }
  
  return loadStripe(publishableKey).catch(error => {
    return null;
  });
};

const stripePromise = getStripePromise();

interface EmbeddedStripePaymentProps {
  courseId: string;
  courseTitle: string;
  amount: number; // Amount in cents
  currency?: string;
}

interface PaymentFormProps extends EmbeddedStripePaymentProps {
  clientSecret: string;
  onSuccess: () => void;
}



// Payment form component
function PaymentForm({ courseId, courseTitle, amount, currency = "usd", clientSecret, onSuccess }: PaymentFormProps) {
  const t = useTranslations();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementsReady, setIsElementsReady] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const { triggerConfetti } = useConfetti();

  // Check for successful payment on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    
    if (paymentIntentId && stripe) {
      stripe.retrievePaymentIntent(paymentIntentId).then(({ paymentIntent }) => {
        if (paymentIntent?.status === 'succeeded') {

          
          // Clear URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete('payment_intent');
          url.searchParams.delete('payment_intent_client_secret');
          window.history.replaceState({}, '', url.toString());
          
          // Trigger success animations
          triggerConfetti();
          setTimeout(() => triggerConfetti(), 500);
          
          setShowSuccessAnimation(true);
          
          toast.success(t("toasts.payments.paymentSuccess"), {
            duration: 4000,
          });
          
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      });
    }
  }, [stripe, triggerConfetti, onSuccess]);

  // Add timeout for PaymentElement loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isElementsReady) {

        setLoadTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isElementsReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?courseId=${courseId}`,
        },
      });

      if (error) {
        // Handle specific error types
        if (error.type === "card_error" || error.type === "validation_error") {
          console.error("Payment failed:", error);
          toast.error(error.message || t("toasts.payments.paymentFailed"));
        } else {
          console.error("Unexpected error:", error);
          toast.error(t("toasts.payments.unexpectedError"));
        }
      } else {
        // 🎉 PAYMENT SUCCESS - TRIGGER THE EXCITEMENT! 🎉
        console.log("🎉 Payment succeeded!");
        
        // Trigger success animations
        triggerConfetti();
        setTimeout(() => triggerConfetti(), 500);
        
        setShowSuccessAnimation(true);
        
        toast.success(t("toasts.payments.paymentSuccess"), {
          duration: 4000,
        });
        
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(t("toasts.payments.unexpectedError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="w-full space-y-4">
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="min-h-[300px] w-full p-4 bg-card border border-border rounded-lg">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                fields: {
                  billingDetails: 'auto'
                }
              }}
              onReady={() => {
                setIsElementsReady(true);
                console.log("✅ PaymentElement ready and loaded successfully!");
              }}
              onLoadError={(error) => {
                console.error("❌ Stripe PaymentElement load error:", error);
                toast.error(t("toasts.payments.failedToLoadForm"));
                setIsElementsReady(false);
              }}
            />
          </div>
          
          {!isElementsReady && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          )}
        </div>
        
        {/* Success Animation Overlay */}
        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={() => setShowSuccessAnimation(false)}
          title="Payment Complete!"
          message="Welcome to your course!"
          type="payment"
        />
        
        <Button
          type="submit"
          disabled={!stripe || !isElementsReady || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </div>
          ) : (
            `Pay ${formatAmount(amount, currency)}`
          )}
        </Button>
      </form>
    </div>
  );
}

// Main component
export function EmbeddedStripePayment({ 
  courseId, 
  courseTitle, 
  amount, 
  currency = "usd" 
}: EmbeddedStripePaymentProps) {
  const t = useTranslations();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    window.location.href = `/dashboard`;
  };

  // Check if Stripe has loaded
  useEffect(() => {
    const checkStripe = async () => {
      try {
        console.log("🔄 Checking Stripe initialization...");
        const stripe = await stripePromise;
        if (stripe) {
          console.log("✅ Stripe loaded successfully", stripe);
          console.log("Stripe object methods:", Object.keys(stripe));
          setStripeLoaded(true);
        } else {
          console.error("❌ Stripe failed to load - null returned");
          setError("Payment system could not be loaded. Please check your connection and try again.");
        }
      } catch (err) {
        console.error("❌ Failed to load Stripe:", err);
        setError("Payment system could not be loaded. Please check your connection and try again.");
      }
    };
    
    checkStripe();
  }, []);

  // Auto-initialize payment intent when component mounts
  useEffect(() => {
    if (stripeLoaded) {
      console.log("Stripe loaded, creating payment intent...");
      createPaymentIntent();
    }
  }, [courseId, amount, stripeLoaded]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating payment intent for course:', courseId, 'amount:', amount);
      
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          amount,
        }),
      });

      console.log('Payment intent response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment intent error response:', errorData);
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      console.log('✅ Payment intent created successfully');
      console.log('Client secret length:', data.clientSecret?.length);
      console.log('Client secret format:', data.clientSecret?.substring(0, 30) + '...');
      console.log('Payment data:', { amount: data.amount, currency: data.currency });
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Failed to create payment intent:', err);
      setError(err instanceof Error ? err.message : t("toasts.payments.failedToInitialize"));
      toast.error(t("toasts.payments.failedToInitialize"));
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full space-y-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={createPaymentIntent} variant="outline" className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  if (!clientSecret && isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading payment form...</span>
        </div>
      </div>
    );
  }

  if (clientSecret && stripeLoaded) {
    // Validate client secret format
    if (!clientSecret.includes('pi_') && !clientSecret.includes('seti_')) {
      console.error("Invalid client secret format:", clientSecret.substring(0, 20) + "...");
      setError("Invalid payment configuration. Please try again.");
      return null;
    }
    
    console.log("Rendering Elements with clientSecret:", clientSecret.substring(0, 20) + "...");
    console.log("Stripe loaded status:", stripeLoaded);
    
    return (
      <div className="stripe-elements-wrapper">
        <Elements 
          stripe={stripePromise}
          options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: 'hsl(var(--primary))',
                colorBackground: 'hsl(var(--card))',
                colorText: 'hsl(var(--card-foreground))',
                colorDanger: 'hsl(var(--destructive))',
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                spacingUnit: '4px',
                borderRadius: 'calc(var(--radius) - 2px)',
              },
              rules: {
                '.Input': {
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  color: 'hsl(var(--card-foreground))',
                  fontSize: '14px',
                  padding: '10px 12px',
                  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                },
                '.Input:focus': {
                  borderColor: 'hsl(var(--ring))',
                  boxShadow: '0 0 0 2px hsl(var(--ring) / 0.2)',
                  outline: 'none',
                },
                '.Input--invalid': {
                  borderColor: 'hsl(var(--destructive))',
                },
                '.Label': {
                  color: 'hsl(var(--card-foreground))',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '6px',
                },
                '.Error': {
                  color: 'hsl(var(--destructive))',
                  fontSize: '12px',
                  marginTop: '4px',
                },
                '.Tab': {
                  backgroundColor: 'hsl(var(--muted))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  color: 'hsl(var(--muted-foreground))',
                  padding: '8px 12px',
                  transition: 'all 0.2s ease-in-out',
                },
                '.Tab:hover': {
                  backgroundColor: 'hsl(var(--muted) / 0.8)',
                  color: 'hsl(var(--card-foreground))',
                },
                '.Tab--selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  borderColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
                '.Block': {
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius))',
                  padding: '16px',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }
              }
            }
          }}
        >
        <PaymentForm
          courseId={courseId}
          courseTitle={courseTitle}
          amount={amount}
          currency={currency}
          clientSecret={clientSecret}
          onSuccess={handleSuccess}
        />
      </Elements>
      </div>
    );
  }

  // Fallback for any other state
  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Unable to load payment form</p>
        <Button onClick={createPaymentIntent} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    </div>
  );
}