"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#10020233] border-b border-blue-900/20 z-50">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Drip Wave Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-lg font-bold text-white">
              Drip <span className="text-blue-500">Wave</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-blue-500 hover:text-blue-400 transition-colors">
              Home
            </Link>
            <Link
              href="/winners"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Winners
            </Link>
            <Link
              href="/doc"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Doc
            </Link>
            <Link href="/app">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                Launch DApp
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="w-6 h-0.5 bg-white transition-all duration-300"></span>
            <span className="w-6 h-0.5 bg-white transition-all duration-300"></span>
            <span className="w-6 h-0.5 bg-white transition-all duration-300"></span>
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-blue-900/20 py-4">
            <div className="flex flex-col gap-4">
              <Link 
                href="/" 
                className="text-blue-500 hover:text-blue-400 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/winners"
                className="text-gray-300 hover:text-white transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Winners
              </Link>
              <Link
                href="/doc"
                className="text-gray-300 hover:text-white transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Doc
              </Link>
              <Link href="/app" onClick={() => setIsMenuOpen(false)}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-2">
                  Launch DApp
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
