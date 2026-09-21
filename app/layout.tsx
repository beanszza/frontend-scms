import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import LayoutProvider from "@/providers/LayoutProvider";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutEventListener } from "@/components/auth/LogoutEventListener";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP System",
  description: "Manufacturing Industry Capstone Project",
};

const THIS_SYSTEM_CODE = "SCMS";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // /signin is a Route Handler (Step 7), so it never reaches this layout.
  // This only fires on the rare race where middleware saw a valid session
  // that had since expired by the time this layout's own auth() call ran -
  // send it back through /signin rather than rendering children unguarded.
  if (!session) redirect("/signin");

  if (!session.systems.includes(THIS_SYSTEM_CODE)) {
    return (
      <html lang="en" className={`${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-screen bg-background text-foreground font-sans">
          <main className="p-6">
            <h1 className="text-xl font-semibold">Access denied</h1>
            <p>
              You are signed in, but do not have access to {THIS_SYSTEM_CODE}.
            </p>
            <a className="underline" href="/api/logout">
              Sign out
            </a>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
          <LogoutEventListener
            accessToken={session.accessToken}
            issuer={process.env.AUTH_ISSUER!}
          />
          <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}