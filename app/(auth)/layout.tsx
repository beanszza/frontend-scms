"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-6 bg-card z-1 sm:p-0">
      <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col sm:p-0">
        {children}
        <div className="lg:w-1/2 w-full h-full bg-primary/5 lg:grid items-center hidden">
          <div className="relative flex items-center justify-center z-1">
            <div className="flex flex-col items-center max-w-2xl">
              <Link href="/" className="block mb-4">
                <Image
                  width={2000}
                  height={500}
                  src="/images/logo/desktop.svg"
                  alt="SCMS Logo"
                  className="w-[700px] h-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutInner>{children}</AuthLayoutInner>;
}
