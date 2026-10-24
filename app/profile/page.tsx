import type { Metadata } from "next";
import { contact } from "@/lib/content";
import { education, experience, headline, skills, statement } from "@/lib/profile";
import { SiteNav } from "@/components/SiteNav";
import { Timeline } from "@/components/profile/Timeline";
import "../work.css";
import "../profile.css";

const DESCRIPTION =
  "Software engineer working on generative AI and full-stack products. Experience, education, skills, and the CV as a PDF.";

export const metadata: Metadata = {
  title: "Profile",
  description: DESCRIPTION,
  openGraph: { title: "Profile · Akib Arifeen", description: DESCRIPTION },
};

export default function ProfilePage() {
  return (
    <main className="wrap profile">
      <SiteNav current="/profile" />

      <header className="profile__head">
        <p className="kicker">{headline}</p>
        <h1 className="profile__h1">Profile</h1>
        <p className="profile__lede">{statement}</p>
      </header>

      <section className="profile__section" aria-labelledby="experience-h">
        <h2 id="experience-h" className="profile__title">Experience</h2>
        <Timeline entries={experience} />
      </section>

      <section className="profile__section" aria-labelledby="education-h">
        <h2 id="education-h" className="profile__title">Education</h2>
        <ul className="profile__list">
          {education.map((e) => (
            <li key={e.org} className="edu">
              <p className="edu__when"><time dateTime={e.start}>{e.when}</time></p>
              <h3 className="edu__degree">{e.degree}</h3>
              <p className="edu__org">{e.org}</p>
              <ul className="edu__notes">
                {e.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="profile__section" aria-labelledby="skills-h">
        <h2 id="skills-h" className="profile__title">Skills</h2>
        <dl className="skills">
          {skills.map((s) => (
            <div key={s.group} className="skills__row">
              <dt>{s.group}</dt>
              <dd>{s.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="profile__section profile__cv" aria-labelledby="cv-h">
        <h2 id="cv-h" className="profile__title">CV</h2>
        <p className="profile__note">The whole CV is one page of PDF. It opens in a new tab, or saves if you would rather keep it.</p>
        <p className="links">
          <a className="chip chip--accent" href={contact.cv} target="_blank" rel="noreferrer">View CV</a>
          <a className="chip" href={contact.cv} download>Download CV</a>
        </p>
      </section>

      <section className="profile__section" aria-labelledby="contact-h">
        <h2 id="contact-h" className="profile__title">Contact</h2>
        <p className="links">
          <a className="chip" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="chip" href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="chip" href={contact.github} target="_blank" rel="noreferrer">GitHub</a>
        </p>
      </section>
    </main>
  );
}
