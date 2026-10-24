import { films, studioPieces, techniqueCredits } from "@/lib/media";
import { VideoPlayer } from "./VideoPlayer";
import { FilmFrame } from "./FilmFrame";

/** The creative-media section of /projects: work samples, then the films, then what they owe. */
export function MediaGallery() {
  return (
    <section className="gallery" aria-labelledby="media-h">
      <div className="projects__group-head">
        <h2 id="media-h" className="projects__title">Creative media</h2>
        <p className="projects__blurb">
          Motion work rather than software: five pieces rendered with the video platform I built, and four films
          drawn frame by frame. Every clip is a real file served from this site, and nothing plays until you ask it to.
        </p>
      </div>

      <h3 className="gallery__sub">Studio pieces</h3>
      <p className="gallery__note">
        Rendered with the AI video generation platform I built at See Change Education. The presenter is a synthetic
        avatar, not a recording of a person.
      </p>
      <ul className="gallery__grid">
        {studioPieces.map((piece) => (
          <li key={piece.slug}>
            <VideoPlayer piece={piece} />
          </li>
        ))}
      </ul>

      <h3 className="gallery__sub">Drawing films</h3>
      <p className="gallery__note">
        Each film is a single page that draws every frame as a function of the frame number and a seed, then prints it
        through a halftone model. The video is the default; Try it live swaps in the film itself, running in a frame
        sandboxed to scripts only.
      </p>
      <ul className="gallery__grid gallery__grid--square">
        {films.map((film) => (
          <li key={film.slug}>
            <FilmFrame film={film} />
          </li>
        ))}
      </ul>

      <div className="gallery__credits">
        <h3 className="gallery__sub">Technique credits</h3>
        <dl className="gallery__pairs">
          {techniqueCredits.map((credit) => (
            <div key={credit.technique} className="gallery__pair">
              <dt>{credit.technique}</dt>
              <dd>{credit.credit}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
