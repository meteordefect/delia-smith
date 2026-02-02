import Link from "next/link";
import { Swords } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Swords className="h-6 w-6" />
          <span className="font-bold sm:inline-block">Delia Smith BJJ</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Home
          </Link>
          <Link
            href="#"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            About
          </Link>
          <Link
            href="#"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Classes
          </Link>
          <Link
            href="#"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
