"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AvaxConnectButton } from "../../AvaxConnectButton";
import { useState, useEffect } from "react";

export default function AppNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('nav')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <nav className="bg-[#1A0505]/80 backdrop-blur-sm sticky top-0 z-50 border-b border-red-900/20 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
            </div>
            <span className="text-lg md:text-xl font-bold">
              Drip <span className="text-blue-400">Wave</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/app/pools"
              className={`transition-colors ${
                pathname === "/app/pools"
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Pools
            </Link>
            <Link
              href="/app/prizes"
              className={`transition-colors ${
                pathname === "/app/prizes"
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Prizes
            </Link>
            <Link
              href="/app/account"
              className={`transition-colors ${
                pathname === "/app/account"
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Account
            </Link>
          </div>

          {/* Desktop Connect Button */}
          <div className="hidden md:block">
            <AvaxConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 hover:bg-red-600/20 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 backdrop-blur-sm bg-[#1A0505]/95 rounded-xl border border-blue-900/20 shadow-xl z-50">
            <div className="flex flex-col p-4 space-y-3">
              <Link
                href="/app/pools"
                className={`py-3 px-4 rounded-lg transition-colors text-base ${
                  pathname === "/app/pools"
                    ? "text-blue-400 bg-blue-600/10"
                    : "text-gray-300 hover:text-white hover:bg-blue-600/10"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Pools
              </Link>
              <Link
                href="/app/prizes"
                className={`py-3 px-4 rounded-lg transition-colors text-base ${
                  pathname === "/app/prizes"
                    ? "text-blue-400 bg-blue-600/10"
                    : "text-gray-300 hover:text-white hover:bg-blue-600/10"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Prizes
              </Link>
              <Link
                href="/app/account"
                className={`py-3 px-4 rounded-lg transition-colors text-base ${
                  pathname === "/app/account"
                    ? "text-blue-400 bg-blue-600/10"
                    : "text-gray-300 hover:text-white hover:bg-blue-600/10"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Account
              </Link>
              <div className="pt-3 border-t border-blue-900/20">
                <AvaxConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
