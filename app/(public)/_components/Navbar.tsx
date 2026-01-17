"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "./UserDropdown";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { Menu, X, ChevronDown as ChevronDownIcon, Home as HomeIcon, BookOpen, LayoutDashboard as LayoutDashboardIcon, LogOut as LogOutIcon, Settings as SettingsIcon, User as UserIcon, Bell as BellIcon, HelpCircle as HelpIcon, Globe } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavbarLanguageSwitcher } from "@/components/general/NavbarLanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/use-singout";
import { useTranslations } from "@/components/general/I18nProvider";

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const { settings, loading } = useSiteSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const handleSignOut = useSignOut();
  const t = useTranslations();
  
  // Mark component as mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use consistent default for SSR, then actual logo after hydration
  // Always use /logo.svg to avoid hydration mismatch with DB settings
  const logoUrl = !mounted ? '/logo.svg' : (logoError ? '/logo.svg' : (settings?.logo_url || '/logo.svg'));
  
  // Handle logo load error
  const handleLogoError = () => {
    setLogoError(true);
  };

  // Don't render dynamic content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 sm:h-18 md:h-20 items-center justify-between mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group transition-transform duration-200 hover:scale-[1.02]">
            <div className="relative h-8 sm:h-9 md:h-10 w-[100px] sm:w-[120px] md:w-[140px] flex items-center">
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="h-8 sm:h-9 md:h-10 w-auto max-w-full object-contain transition-all duration-200 group-hover:brightness-110" 
              />
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  // Dynamic navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: t("navigation.home"), href: "/" },
      { name: t("navigation.courses"), href: "/courses" },
      { name: t("navigation.dashboard"), href: "/dashboard" },
    ];

    // Add admin link if user is admin
    if (session?.user?.role === "admin") {
      baseItems.push({ name: t("navigation.admin"), href: "/admin" });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 sm:h-18 md:h-20 items-center justify-between mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group transition-transform duration-200 hover:scale-[1.02]">
          <div className="relative h-8 sm:h-9 md:h-10 w-[100px] sm:w-[120px] md:w-[140px] flex items-center">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="h-8 sm:h-9 md:h-10 w-auto max-w-full object-contain transition-all duration-200 group-hover:brightness-110" 
              onError={handleLogoError}
            />
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground rounded-md hover:bg-accent/80 inline-flex items-center justify-center"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <NavbarLanguageSwitcher />
          <ThemeToggle />

          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 relative overflow-hidden group border-border/40 hover:border-primary/50">
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col gap-0">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-6 border-b bg-gradient-to-r from-background to-accent/10">
                <div className="flex items-center space-x-3">
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="h-9 w-auto max-w-[110px] object-contain" 
                    onError={handleLogoError}
                  />
                </div>
              </div>

              {/* User Profile Section (if logged in) */}
              {session && (
                <div className="px-6 py-6 border-b bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                        {session?.user.name && session.user.name.length > 0
                          ? session.user.name.charAt(0).toUpperCase()
                          : session?.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold truncate mb-1">
                        {session?.user.name && session.user.name.length > 0
                          ? session.user.name
                          : session?.user.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session?.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation */}
              <nav className="flex-1 px-6 py-6 overflow-y-auto">
                <div className="space-y-2">
                  {navigationItems.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-4 py-3.5 text-base font-medium text-muted-foreground transition-all duration-200 hover:text-primary hover:bg-accent rounded-xl group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-200">{item.name}</span>
                    </Link>
                  ))}
                  
                  {/* Settings Button */}
                  {session && (
                    <>
                      <div className="my-4 border-t border-border/50" />
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3.5 text-base font-medium text-muted-foreground transition-all duration-200 hover:text-primary hover:bg-accent rounded-xl group"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <SettingsIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-200">{t("navigation.settings")}</span>
                      </Link>
                    </>
                  )}
                </div>
              </nav>

              {/* Footer Actions */}
              <div className="px-6 py-6 border-t bg-gradient-to-t from-muted/20 to-background">
                {isPending ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                  </div>
                ) : session ? (
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base font-medium justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 group"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOutIcon size={20} className="mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    {t("auth.logout")}
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link
                      href="/login"
                      className={buttonVariants({ variant: "outline", className: "w-full h-12 text-base font-medium hover:bg-accent transition-all duration-200" })}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("auth.login")}
                    </Link>
                    <Link 
                      href="/login" 
                      className={buttonVariants({ className: "w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200" })}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("common.getStarted")}
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop user menu - restore original compact style */}
          <div className="hidden md:block">
            {isPending ? null : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent">
                      <Avatar className="h-9 w-9 ring-2 ring-border group-hover:ring-primary transition-all duration-200">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-base">
                          {session?.user.name && session.user.name.length > 0
                            ? session.user.name.charAt(0).toUpperCase()
                            : session?.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDownIcon
                        size={16}
                        className="text-muted-foreground transition-transform duration-200 group-hover:rotate-180"
                        aria-hidden="true"
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56 p-2">
                  <DropdownMenuLabel className="flex min-w-0 flex-col px-2 py-2">
                    <span className="text-foreground truncate text-sm font-semibold">
                      {session?.user.name && session.user.name.length > 0
                        ? session.user.name
                        : session?.user.email.split("@")[0]}
                    </span>
                    <span className="text-muted-foreground truncate text-xs font-normal mt-0.5">
                      {session.user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                      <Link href="/">
                        <HomeIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span>{t("navigation.home")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                      <Link href="/courses">
                        <BookOpen size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span>{t("navigation.courses")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                      <Link href="/dashboard">
                        <LayoutDashboardIcon
                          size={16}
                          className="text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>{t("navigation.dashboard")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                      <Link href="/dashboard/profile">
                        <UserIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span>{t("navigation.profile")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                      <Link href="/settings">
                        <SettingsIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span>{t("navigation.settings")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                      <Link href="/notifications">
                        <BellIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span>{t("navigation.notifications")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer py-2.5 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOutIcon size={16} className="opacity-70" aria-hidden="true" />
                    <span>{t("auth.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "ghost", className: "font-medium hover:bg-accent" })}
                >
                  {t("auth.login")}
                </Link>
                <Link href="/signup" className={buttonVariants({ className: "font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-md hover:shadow-lg" })}>
                  {t("common.getStarted")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
