"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import countriesData from "../../scripts/countries.json";

interface CountrySelectorProps {
  currentCountryCode?: string;
  className?: string;
}

export default function CountrySelector({ currentCountryCode, className = "" }: CountrySelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const countries = countriesData.sort((a, b) => a.name.localeCompare(b.name));
  
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentCountry = countries.find(c => c.code === currentCountryCode);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full max-w-xs ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-left text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {currentCountry ? currentCountry.name : "Select a country"}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg">
          <div className="sticky top-0 bg-surface p-2 border-b border-border">
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="py-1" role="listbox">
            {filteredCountries.length === 0 ? (
              <li className="px-4 py-2 text-sm text-secondary">No countries found</li>
            ) : (
              filteredCountries.map((country) => (
                <li
                  key={country.code}
                  role="option"
                  aria-selected={country.code === currentCountryCode}
                  className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 ${
                    country.code === currentCountryCode ? "bg-gray-50 font-medium text-accent" : "text-foreground"
                  }`}
                  onClick={() => {
                    router.push(`/${country.code.toLowerCase()}`);
                    setIsOpen(false);
                  }}
                >
                  {country.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
