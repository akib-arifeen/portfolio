"use client";

import { BOOTH_DAILY_LIMIT, facts, styles } from "@/lib/booth";
import type { Booth } from "./useBooth";

/** The booth's own touchscreen, rendered onto the 3D screen. Sized in em so it scales with the screen. */
export default function BoothScreen({ booth, width }: { booth: Booth; width: number }) {
  const b = booth;
  const showCamera = b.step === "pose" || b.step === "countdown";
  return (
    <div className="bscreen" style={{ width, height: Math.round(width * 0.7), fontSize: width / (width < 440 ? 29 : 34) }}>
      {b.step === "intro" && (
        <div className="bscreen__intro">
          <p className="bscreen__big">Step up!</p>
          <p className="bscreen__line">Pick a look, smile, and I’ll print you a card.</p>
          <div className="bscreen__row">
            <button type="button" className="bbtn bbtn--go" onClick={b.startCamera}>Start the camera</button>
            <button type="button" className="bbtn" onClick={b.useSample}>Use Akib’s photo</button>
          </div>
          <p className="bscreen__small">When the AI is on, your photo goes once to kie.ai (OpenAI GPT Image) to be restyled. Nothing is stored here. {BOOTH_DAILY_LIMIT} looks a day.</p>
        </div>
      )}

      {showCamera && (
        <div className="bscreen__pose">
          {b.live ? (
            <video ref={b.videoRef} className="bscreen__feed" muted playsInline aria-label="Camera preview" />
          ) : (
            b.capture && <img src={b.capture} alt="Your photo" className="bscreen__feed bscreen__feed--still" />
          )}
          {b.step === "countdown" ? (
            <span className="bscreen__count" key={b.count} aria-live="assertive">{b.count}</span>
          ) : (
            <div className="bscreen__controls">
              <div className="bscreen__looks" role="radiogroup" aria-label="Pick a look">
                {styles.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={b.style === s.id} className="blook" onClick={() => b.setStyle(s.id)}>
                    {s.name}
                  </button>
                ))}
              </div>
              <button type="button" className="bshutter" onClick={b.shoot} aria-label={b.live ? "Take the photo" : "Make my card"}>
                <span />
              </button>
            </div>
          )}
        </div>
      )}

      {b.step === "developing" && (
        <div className="bscreen__center">
          <p className="bscreen__big">Developing…</p>
          <span className="bscreen__bar" aria-hidden="true"><span /></span>
          <p className="bscreen__line" key={b.fact}>{facts[b.fact]}</p>
        </div>
      )}

      {b.step === "printing" && (
        <div className="bscreen__center">
          <p className="bscreen__big">Printing…</p>
          <p className="bscreen__line">Look down, it’s coming out.</p>
          <span className="bscreen__arrow" aria-hidden="true">↓</span>
        </div>
      )}

      {b.step === "done" && (
        <div className="bscreen__center">
          <p className="bscreen__big">{b.problem ? "Here’s your print." : "Looking good."}</p>
          {b.problem === "not-configured" && <p className="bscreen__line">The AI is resting, so it’s printed as it is.</p>}
          {b.problem === "failed" && <p className="bscreen__line">The restyle didn’t come through, so it’s printed as it is.</p>}
          <div className="bscreen__row">
            <button type="button" className="bbtn bbtn--go" onClick={b.tryAnother}>Try another look</button>
            <button type="button" className="bbtn" onClick={b.retake}>Retake</button>
          </div>
        </div>
      )}

      {b.step === "error" && (
        <div className="bscreen__center">
          {b.problem === "limit" ? (
            <>
              <p className="bscreen__big">That’s today’s looks.</p>
              <p className="bscreen__line">Come back tomorrow for {BOOTH_DAILY_LIMIT} more.</p>
            </>
          ) : b.problem === "failed" ? (
            <>
              <p className="bscreen__big">That didn’t load.</p>
              <p className="bscreen__line">Give it another go, or start with the camera.</p>
              <div className="bscreen__row">
                <button type="button" className="bbtn bbtn--go" onClick={b.useSample}>Try again</button>
                <button type="button" className="bbtn" onClick={b.startCamera}>Start the camera</button>
              </div>
            </>
          ) : (
            <>
              <p className="bscreen__big">No camera.</p>
              <p className="bscreen__line">Allow it in your browser, or use my photo instead.</p>
              <div className="bscreen__row">
                <button type="button" className="bbtn bbtn--go" onClick={b.startCamera}>Try again</button>
                <button type="button" className="bbtn" onClick={b.useSample}>Use Akib’s photo</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
