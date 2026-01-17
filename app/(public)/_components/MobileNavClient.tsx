"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserDropdown } from "./UserDropdown";

interface MobileNavClientProps {
  navigationItems: Array<{ name: string; href: string }>;
  session: any;
  siteName: string;
}

export function MobileNavClient({ navigationItems, session, siteName }: MobileNavClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <button className="p-2 text-foreground hover:text-primary transition-colors">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b">
              <span className="font-bold text-lg">{siteName}</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-foreground hover:text-primary transition-colors"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            
            <div className="flex-1 py-6">
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-6 py-3 text-lg font-medium text-foreground hover:text-primary hover:bg-muted transition-colors rounded-lg mx-3"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="border-t p-6">
              {session ? (
                <UserDropdown 
                  name={session.user.name || 'User'} 
                  email={session.user.email || ''} 
                  image={session.user.image || '/placeholder-avatar.png'}
                />
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={buttonVariants({ variant: "outline", className: "w-full" })}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={buttonVariants({ className: "w-full" })}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}