"use client";

import { useOs } from "@/components/os/OsContext";
import type { AppProps } from "@/lib/os/types";

const SPECS: [string, string][] = [
  ["Engineer", "Akib Arifeen"],
  ["Based in", "Hong Kong"],
  ["Works at", "See Change Education"],
  ["Studying", "Computer science, CityUHK"],
  ["Builds with", "TypeScript, Python, Java"],
  ["Specialty", "AI products with voice, sound and motion"],
  ["Serial number", "AKIB-2026"],
];

export default function About({ win }: AppProps) {
  void win;
  const os = useOs();
  return (
    <div className="os-about">
      <img className="os-about__avatar" src="/desk/akib.jpg" alt="Akib Arifeen" width={88} height={88} />
      <h1 className="os-about__name">akibOS 26</h1>
      <p className="os-about__version">Version 26.1</p>
      <dl className="os-about__specs">
        {SPECS.map(([label, value]) => (
          <div key={label} className="os-about__spec">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="os-about__actions">
        <button type="button" className="os-about__btn" onClick={() => os.open("preview", { path: "/Users/akib/Documents/Akib Arifeen CV.pdf" })}>
          Résumé…
        </button>
        <button type="button" className="os-about__btn os-about__btn--primary" onClick={() => os.open("mail")}>
          Hire me
        </button>
      </div>
      <p className="os-about__fine">Not affiliated with Apple. Made by hand in Hong Kong.</p>
    </div>
  );
}
