"use client";

import Link from "next/link";
import { contact } from "@/lib/content";
import { education, experience, skills, statement } from "@/lib/profile";

export default function ProfileApp() {
  return (
    <section aria-labelledby="profile-app-title">
      <header className="portal-section-head">
        <p className="portal-kicker">Profile & CV</p>
        <h2 id="profile-app-title">The engineering record behind the workspace.</h2>
        <p>{statement}</p>
        <div className="profile-app__actions">
          <Link className="portal-read" href="/profile">Open the full profile <span aria-hidden="true">↗</span></Link>
          <a className="portal-read" href={contact.cv} download>Download my CV <span aria-hidden="true">↓</span></a>
        </div>
      </header>
      <div className="profile-app__grid">
        <section>
          <h3>Experience</h3>
          {experience.map((entry) => (
            <article className="profile-app__entry" key={entry.id}>
              <p className="portal-kicker">{entry.when}</p>
              <h4>{entry.role}</h4>
              <p>{entry.org} · {entry.where}</p>
              <ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </article>
          ))}
        </section>
        <aside>
          <h3>Education</h3>
          {education.map((entry) => (
            <article className="profile-app__entry" key={entry.degree}>
              <p className="portal-kicker">{entry.when}</p>
              <h4>{entry.degree}</h4>
              <p>{entry.org}</p>
              <ul>{entry.notes.map((note) => <li key={note}>{note}</li>)}</ul>
            </article>
          ))}
          <h3>Working knowledge</h3>
          <dl className="profile-app__skills">
            {skills.map((group) => <div key={group.group}><dt>{group.group}</dt><dd>{group.items.join(" · ")}</dd></div>)}
          </dl>
        </aside>
      </div>
    </section>
  );
}
