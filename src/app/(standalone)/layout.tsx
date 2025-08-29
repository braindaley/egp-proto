import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ZipCodeProvider } from "@/hooks/use-zip-code";
import { SessionProvider } from "@/contexts/SessionContext";
import QueryProvider from "@/providers/query-client-provider";

const inter = Inter({ subsets: ["latin"] });

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ZipCodeProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ZipCodeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}