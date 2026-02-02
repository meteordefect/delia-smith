import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

interface CountryData {
  country: string;
  country_code: string;
  gym_count: number;
}

async function getCountries(): Promise<CountryData[]> {
  const gymsDir = path.join(process.cwd(), "data", "gyms");
  const files = await fs.readdir(gymsDir);
  const countries: CountryData[] = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(gymsDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(content);
      countries.push({
        country: data.country,
        country_code: data.country_code,
        gym_count: data.gym_count,
      });
    }
  }

  return countries.sort((a, b) => a.country.localeCompare(b.country));
}

export default async function Home() {
  const countries = await getCountries();
  const totalGyms = countries.reduce((sum, c) => sum + c.gym_count, 0);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-semibold text-foreground">Delia Smith BJJ</h1>
          <p className="mt-4 text-lg text-secondary">
            {totalGyms} gyms across {countries.length} countries
          </p>
        </header>

        <section>
          <h2 className="text-sm font-medium text-secondary uppercase tracking-wide mb-6">
            Select a country
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <Link
                key={c.country_code}
                href={`/${c.country_code.toLowerCase()}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-all hover:border-accent hover:shadow-sm"
              >
                <span className="font-medium text-foreground group-hover:text-accent transition-colors">
                  {c.country}
                </span>
                <span className="text-sm text-secondary">
                  {c.gym_count} {c.gym_count === 1 ? "gym" : "gyms"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
