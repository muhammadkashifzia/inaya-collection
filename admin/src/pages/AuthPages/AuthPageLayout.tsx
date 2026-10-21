import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import React from "react";

/** Split-screen sign-in layout in the Anaya Collection brand colours. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        {children}
        <div className="hidden h-full w-full items-center bg-ink-900 lg:grid lg:w-1/2 dark:bg-white/5">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />
            <div className="flex max-w-sm flex-col items-center text-center">
              <span className="mb-6">
                <img src="/images/logo/anaya-collection-logo.png" alt="Anaya Collection" className="h-20 w-auto" />
              </span>
              <p className="mt-2 text-xs tracking-[0.4em] text-ink-300 uppercase">Store admin</p>
              <p className="mt-8 text-sm text-ink-200">Manage products, orders, customers and your storefront in one place.</p>
            </div>
          </div>
        </div>
        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
