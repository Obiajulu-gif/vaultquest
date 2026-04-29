import "./globals.css";
import { Inter } from "next/font/google";
import { Provider } from "@/Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Drip Wave - No-Loss Prize Savings Protocol",
  icon: "/images/logo.png",
  description:
    "A secure and transparent prize-linked savings protocol built on Stellar/Soroban. Save your deposits while earning interest and a chance to win prizes. Your capital is always safe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
