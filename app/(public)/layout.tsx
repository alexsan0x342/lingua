import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";
import { Footer } from "@/components/general/Footer";

export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 lg:py-12 max-w-7xl">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
