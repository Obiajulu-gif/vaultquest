import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-[#100202] py-12">
      <div className="container mx-auto px-4">
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
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
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center space-y-4">
            <Link href="/" className="text-white hover:text-blue-500 text-base transition-colors">
              Home
            </Link>
            <Link href="/winners" className="text-white hover:text-blue-500 text-base transition-colors">
              Winners
            </Link>
            <Link href="/doc" className="text-white hover:text-blue-500 text-base transition-colors">
              Doc
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © 2025 Hello, Drip Wave, LLC
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Drip Wave Logo"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm font-bold text-white">
              Drip <span className="text-blue-500">Wave</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white text-sm transition-colors">
              Home
            </Link>
            <Link href="/winners" className="text-gray-300 hover:text-white text-sm transition-colors">
              Winners
            </Link>
            <Link href="/doc" className="text-gray-300 hover:text-white text-sm transition-colors">
              Doc
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © 2025 Hello, Drip Wave, LLC
          </div>
        </div>
      </div>
    </footer>
  );
}

