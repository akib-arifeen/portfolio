import { formatSeconds, type StudioPiece } from "@/lib/media";

/** A Studio piece: a real file from this site, paused until a reader presses play. */
export function VideoPlayer({ piece }: { piece: StudioPiece }) {
  return (
    <figure className="gpiece">
      <video
        className="gpiece__video"
        controls
        preload="none"
        poster={piece.poster}
        width={piece.w}
        height={piece.h}
        aria-label={`${piece.title} (${formatSeconds(piece.seconds)})`}
      >
        <source src={piece.src} type="video/mp4" />
        This browser cannot play the clip. <a href={piece.src}>Download it instead</a>.
      </video>
      <figcaption className="gpiece__cap">
        <p className="gpiece__title">{piece.title}</p>
        <p className="gpiece__line">{piece.line}</p>
        <p className="gpiece__meta">{piece.w} × {piece.h} · {formatSeconds(piece.seconds)}</p>
      </figcaption>
      <a className="gpiece__alt" href={piece.src} download>
        Trouble playing it? Download the clip (MP4)
      </a>
    </figure>
  );
}
