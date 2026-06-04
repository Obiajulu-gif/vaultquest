import "@/styles/globals.css";
import Providers from "@/components/providers/Providers";
import { Toaster } from "sonner";

export const metadata = {
  title: "VaultQuest — No-loss prize savings",
  description: "Deposit, earn yield, and win prizes without risking your principal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        {/* Global toast container */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
