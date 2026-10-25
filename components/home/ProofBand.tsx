import Link from "next/link";
import CountUp from "./CountUp";

// Every figure is from WORK_RECORD.md section 7 (or the lesson pipeline estimate, labelled as one).
const proof = [
  { value: "200 to 300", label: "Guests at each photobooth event", href: "/blog/photobooth", cue: "AI photobooth" },
  { value: "50% faster", label: "Faster video generation, alongside new 4K output", href: "/blog/video-studio", cue: "AI video platform" },
  { value: "~80%", label: "Less time per lesson, an estimate", href: "/blog/lesson-pipeline", cue: "AI lesson pipeline" },
  { value: "150 GB", label: "Of Zoom cloud storage freed", href: "/blog/zoom-backup", cue: "Zoom automation" },
];

export default function ProofBand() {
  return (
    <section className="proof" aria-labelledby="proof-title">
      <h2 className="visually-hidden" id="proof-title">The work in numbers</h2>
      <div className="wrap">
        <ul className="proof__list">
          {proof.map((p) => (
            <li className="proof__cell" key={p.href} data-reveal>
              <Link className="proof__item" href={p.href} aria-label={`${p.value} ${p.label} ${p.cue}`}>
                <span className="proof__num"><CountUp text={p.value} /></span>
                <span className="proof__label">{p.label}</span>
                <span className="proof__cue">{p.cue} <span aria-hidden="true">&rarr;</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
