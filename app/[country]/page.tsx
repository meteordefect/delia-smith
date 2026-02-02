import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

import CountrySelector from "../components/CountrySelector";
import { Gym, CountryData } from "../types";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="mb-8 h-[50vh] min-h-[400px] w-full animate-pulse rounded-xl border border-border bg-gray-100" />
  ),
});

async function getCountryCodes(): Promise<string[]> {
  const gymsDir = path.join(process.cwd(), "data", "gyms");
  const files = await fs.readdir(gymsDir);
  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""));
}

async function getCountryData(countryCode: string): Promise<CountryData | null> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "gyms",
    `${countryCode}.json`
  );
  try {
    const fileContents = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContents) as CountryData;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const countryCodes = await getCountryCodes();
  return countryCodes.map((country) => ({ country }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const data = await getCountryData(country);
  if (!data) {
    return { title: "Country Not Found | BJJ Tracker" };
  }
  return {
    title: `${data.country} BJJ Gyms | BJJ Tracker`,
    description: `Explore ${data.gym_count} Brazilian Jiu-Jitsu gyms in ${data.country}`,
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const data = await getCountryData(country);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-secondary hover:text-foreground transition-colors"
          >
            ← Back to countries
          </Link>
          <CountrySelector currentCountryCode={data.country_code} />
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-foreground">
            {data.country}
          </h1>
          <p className="mt-2 text-secondary">
            {data.gym_count} BJJ {data.gym_count === 1 ? "gym" : "gyms"}
          </p>
        </header>

        <Map gyms={data.gyms} countryCode={data.country_code} />

        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.gyms.map((gym) => (
              <article
                key={gym.place_id}
                className="rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-md"
              >
                <h2 className="font-medium text-foreground">{gym.name}</h2>
                <p className="mt-1 text-sm text-secondary line-clamp-2">
                  {gym.address}
                </p>
                <div className="mt-4 flex gap-3">
                  <a
                    href={gym.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    View on Maps
                  </a>
                  {gym.website && (
                    <a
                      href={gym.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-secondary hover:text-foreground"
                    >
                      Website
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
