"use client";

import { useMemo, useState } from "react";
import { allowFor, playPermissions } from "@/lib/os/playground";

/**
 * A game from another origin. It runs sandboxed to scripts and its own origin (so its storage and
 * audio work, but it never gets this page's origin), with no referrer. Camera and microphone are
 * withheld until the visitor opts in, and opting in reloads the frame so the app can ask again.
 */
export function PlayFrame({ src, title, allow }: { src: string; title: string; allow?: string }) {
  const perms = useMemo(() => playPermissions(allow), [allow]);
  const [shared, setShared] = useState(false);
  const asks = perms.camera || perms.microphone;
  const sharedList = [perms.camera ? "camera" : "", perms.microphone ? "microphone" : ""].filter(Boolean).join(" and ");

  return (
    <div className="play__stage">
      <iframe
        // remounting is how the allow attribute changes after the visitor decides
        key={shared ? "shared" : "private"}
        className="play__frame"
        src={src}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-downloads"
        allow={allowFor(perms, shared)}
        allowFullScreen
        referrerPolicy="no-referrer"
        loading="lazy"
      />

      <p className="play__help">
        If the game does not load, it may refuse to be embedded.{" "}
        <a href={src} target="_blank" rel="noreferrer">Open it in a new tab</a>.
      </p>

      {asks ? (
        <div className="play__permissions">
          <p>
            This game can use your {sharedList}. Nothing is shared until you allow it.
          </p>
          <button type="button" className="chip" onClick={() => setShared((on) => !on)} aria-pressed={shared}>
            {shared ? `Stop sharing ${sharedList}` : `Allow ${sharedList}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
