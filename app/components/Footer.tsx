import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold leading-8 text-foreground">
              Delia Smith BJJ
            </h3>
            <p className="mt-4 text-sm leading-6 text-secondary">
              Empowering students through the art of Brazilian Jiu-Jitsu. Join us
              on the mats to learn, grow, and connect.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link
                href="#"
                className="text-secondary hover:text-accent transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-secondary hover:text-accent transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-secondary hover:text-accent transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            <div>
              <h3 className="text-sm font-semibold leading-6 text-foreground">
                Program
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Fundamentals
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Advanced
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Kids Class
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Private Training
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-foreground">
                Studio
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Instructors
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm leading-6 text-secondary hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-border pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-secondary">
            &copy; {new Date().getFullYear()} Delia Smith BJJ. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
