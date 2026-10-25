import Image from "next/image";
import type { Media } from "@/lib/work";
import { LoopVideo } from "./LoopVideo";

/** One piece of media: image, video or embed. Used by covers and media blocks. */
export function MediaItem({ item, priority = false }: { item: Media; priority?: boolean }) {
  // The frame is 16:10. Media near that shape fills it; tall or very wide screenshots are contained on paper-2 so nothing is cropped away.
  const contain = item.kind !== "embed" && Math.abs(item.w / item.h - 1.6) > 0.25;
  const elClass = contain ? "media__el media__el--contain" : "media__el";
  const captionId = item.caption ? `media-cap-${item.src.replace(/[^a-z0-9]+/gi, "-")}` : undefined;
  let body: React.ReactNode;
  if (item.kind === "image") {
    body = (
      <Image
        src={item.src}
        alt={item.alt}
        width={item.w}
        height={item.h}
        priority={priority}
        unoptimized={item.src.endsWith(".svg")}
        sizes="(min-width: 60rem) 60rem, 100vw"
        className={elClass}
      />
    );
  } else if (item.kind === "video") {
    body = item.loop ? (
      <LoopVideo
        src={item.src}
        poster={item.poster}
        width={item.w}
        height={item.h}
        className={elClass}
        captionId={captionId}
      />
    ) : (
      <video
        className={elClass}
        src={item.src}
        poster={item.poster}
        width={item.w}
        height={item.h}
        controls
        muted
        playsInline
        preload="metadata"
        aria-describedby={captionId}
      />
    );
  } else {
    body = (
      <iframe
        className="media__embed"
        src={item.src}
        title={item.title}
        allow={item.allow}
        loading="lazy"
        style={{ aspectRatio: item.aspect }}
      />
    );
  }
  return (
    <figure className="media">
      {body}
      {item.kind === "video" ? (
        <a className="media__alt" href={item.src} download>
          Download the clip
        </a>
      ) : null}
      {item.caption ? <figcaption className="media__cap" id={captionId}>{item.caption}</figcaption> : null}
    </figure>
  );
}
