import Link from "next/link";
import Hero from "@/components/Hero";
import PlayStrip from "@/components/home/PlayStrip";
import ProofBand from "@/components/home/ProofBand";
import RevealObserver from "@/components/home/RevealObserver";
import WorkGrid from "@/components/home/WorkGrid";
import SoundClips from "@/components/SoundClips";
import { contact } from "@/lib/content";
import { notes } from "@/lib/desk";

// "How I work" is the laptop's note of the same name, split into its three ideas. No new claims.
const how = notes.find((n) => n.id === "how")?.body ?? [];
const [fuzzy, react] = (how[0] ?? "").split(/(?<=\.)\s+/);
const principles = [
  { title: "Start from the fuzzy sentence", text: fuzzy },
  { title: "Build something people can react to", text: react },
  { title: "Care about the finish", text: how[1] },
].filter((p): p is { title: string; text: string } => Boolean(p.text));

export default function Page() {
  return (
    <main>
      <Hero />
      <RevealObserver />

      <ProofBand />

      <section className="section" id="work" aria-labelledby="work-title">
        <div className="wrap">
          <div className="section__head" data-reveal>
            <h2 className="section__title" id="work-title">Selected work</h2>
            <p className="section__lede">
              Most of this started as a one-line ask. I took each one from idea to something people use: design,
              code, voice and the servers it runs on.
            </p>
          </div>
          <WorkGrid />
          <p className="section__more">
            <Link className="more" href="/work">All work <span aria-hidden="true">&rarr;</span></Link>
            <Link className="more" href="/writing">Writing <span aria-hidden="true">&rarr;</span></Link>
          </p>
        </div>
      </section>

      <section className="section" id="play" aria-labelledby="play-title">
        <div className="wrap">
          <div className="section__head" data-reveal>
            <h2 className="section__title" id="play-title">Things you can play with</h2>
            <p className="section__lede">Some of the work runs right here. Open one and try it.</p>
          </div>
          <PlayStrip />
        </div>
      </section>

      <section className="section" id="sound" aria-labelledby="sound-title">
        <div className="wrap">
          <div className="section__head" data-reveal>
            <h2 className="section__title" id="sound-title">Sound</h2>
            <p className="section__lede">
              The part of the work you hear. I script and direct voice, mix narration, and design interface sounds
              so a product feels finished, not just functional.
            </p>
          </div>
          <SoundClips />
        </div>
      </section>

      <section className="section" id="about" aria-labelledby="about-title">
        <div className="wrap about">
          <div className="about__prose" data-reveal>
            <h2 className="section__title" id="about-title">About</h2>
            <p>
              I’m Akib, a software engineer at See Change Education in Hong Kong, and a computer science student at
              City University of Hong Kong.
            </p>
            <p>
              I like problems with fuzzy edges. When an idea arrives without a spec, I work out what it should be,
              build it end to end, and keep going until it holds up in front of real people, at an event, in a
              classroom or on a GPU at 2am.
            </p>
            <p>
              Outside the code I care about how things look and sound: motion, voice, and the small details that make
              software feel made by someone.
            </p>
            <img className="about__portrait" src="/desk/akib.jpg" alt="Akib Arifeen" width={519} height={600} loading="lazy" decoding="async" />
          </div>
          <div className="about__side" data-reveal>
            <h3 className="about__sub">How I work</h3>
            <ol className="how">
              {principles.map((p) => (
                <li key={p.title}>
                  <p className="how__title">{p.title}</p>
                  <p className="how__text">{p.text}</p>
                </li>
              ))}
            </ol>
            <dl className="skills">
              <div><dt>Build</dt><dd>TypeScript, Python, Java · React, Next.js, Spring Boot, FastAPI</dd></div>
              <div><dt>AI</dt><dd>LLM agents and prompting, MCP, speech and image models, self-hosted GPU inference</dd></div>
              <div><dt>Run</dt><dd>AWS, Docker, Nginx, Linux, CI/CD</dd></div>
              <div><dt>Make</dt><dd>UI and motion design, voice direction, sound, video</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <footer className="letter">
        <div className="wrap">
          <p className="letter__body">
            Thanks for walking through. If something here would help your team, write to me at{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>
          <p className="letter__sign">Akib, Hong Kong, 2026</p>
          <nav className="letter__links" aria-label="Elsewhere">
            <a href={contact.linkedin}>LinkedIn</a>
            <a href={contact.github}>GitHub</a>
            <a href={contact.cv} download>Download CV</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
