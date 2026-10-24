"use client";

import { BOOTH_DAILY_LIMIT, facts, styles } from "@/lib/booth";
import type { Booth, BoothStep } from "./useBooth";

const stepKicker: Partial<Record<BoothStep, string>> = {
  pose: "Live from your camera",
  countdown: "Live from your camera",
  preview: "Your photo",
  developing: "In the dark room",
  printing: "Out of the slot",
  done: "Out of the slot",
};

export default function BoothScreen({ booth: b, onStepAway }: { booth: Booth; onStepAway: () => void }) {
  const styleName = styles.find((s) => s.id === b.style)?.name ?? "Unstyled";
  const showCamera = b.step === "pose" || b.step === "countdown";
  const showStill = b.step === "preview" || b.step === "developing";
  const showCard = b.step === "printing" || b.step === "done";

  const looks = (
    <fieldset className="booth__styles">
      <legend className="visually-hidden">Pick a look</legend>
      {styles.map((s) => (
        <label key={s.id} className="look">
          <input
            type="radio"
            name="booth-style"
            value={s.id}
            checked={b.style === s.id}
            onChange={() => b.setStyle(s.id)}
          />
          <span className="look__name">{s.name}</span>
          <span className="look__line">{s.line}</span>
        </label>
      ))}
    </fieldset>
  );

  return (
    <div className="booth">
      <div className="booth__stage" data-step={b.step}>
        {showCamera && b.live && (
          <video ref={b.videoRef} className="booth__feed" muted playsInline aria-label="Camera preview" />
        )}
        {showCamera && !b.live && b.capture && (
          // the stream can drop between steps; the last frame is still honest
          // eslint-disable-next-line @next/next/no-img-element -- a data URL made in the browser
          <img className="booth__feed booth__feed--still" src={b.capture} alt="Your photo" />
        )}
        {showStill && b.capture && (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL made in the browser
          <img className="booth__feed booth__feed--still" src={b.capture} alt="Your photo, not restyled yet" />
        )}
        {showCard && b.card && (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL made in the browser
          <img
            className="booth__card"
            src={b.card}
            alt={b.problem ? "Your printed card, with the photo as it is" : `Your printed card in the ${styleName} style`}
          />
        )}

        {b.step === "intro" && (
          <figure className="booth__sample">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local photograph of the real print, not a generated preview */}
            <img
              className="booth__sample-img"
              src="/work/photobooth/booth-print-preview.jpg"
              width={1600}
              height={930}
              alt="The printed card this booth produces, shown in demo mode with my own photo"
            />
            <figcaption className="booth__sample-cap">The print you leave with</figcaption>
          </figure>
        )}

        {b.step === "error" && (
          <div className="booth__poster booth__poster--quiet" aria-hidden="true">
            <span className="booth__poster-kicker">Booth 004</span>
            <span className="booth__poster-title">
              {b.problem === "limit" ? "Closed for today" : b.problem === "failed" ? "Nothing to develop" : "No camera"}
            </span>
            <span className="booth__poster-line">The room is still open</span>
          </div>
        )}

        {b.step === "countdown" && (
          <span className="booth__count" key={b.count} aria-live="assertive">{b.count}</span>
        )}

        {b.step === "developing" && (
          <div className="booth__develop">
            <span className="booth__develop-line" aria-hidden="true" />
            <span className="booth__develop-label">Developing</span>
          </div>
        )}

        {b.step === "printing" && (
          <span className="booth__feed-label" aria-hidden="true">Printing</span>
        )}
      </div>

      <div className="booth__panel">
        <div className="booth__panel-head">
          <p className="booth__kicker">{stepKicker[b.step] ?? "The photo booth"}</p>
          <button type="button" className="booth__away" onClick={onStepAway}>
            Step away <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="booth__body" key={`${b.step}-${b.problem ?? "ok"}`}>
          {b.step === "intro" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>Step up and say cheese.</h2>
              <p className="booth__text">
                A camera, a few looks and a printer. Nothing you take is stored here.
              </p>
              <ol className="booth__steps">
                <li className="booth__step">
                  <span className="booth__step-n" aria-hidden="true">1</span>
                  <span><strong>Pick a look.</strong> {styles.length} to choose from, from hand-painted anime to comic ink.</span>
                </li>
                <li className="booth__step">
                  <span className="booth__step-n" aria-hidden="true">2</span>
                  <span><strong>Take the photo.</strong> Your camera, or the sample photo I keep here.</span>
                </li>
                <li className="booth__step">
                  <span className="booth__step-n" aria-hidden="true">3</span>
                  <span><strong>Leave with a print.</strong> It comes out in this window, ready to download.</span>
                </li>
              </ol>
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--primary" onClick={b.startCamera}>Start the camera</button>
                <button type="button" className="booth-btn" onClick={b.useSample}>Use my photo instead</button>
              </div>
              <p className="booth__fine">
                When the AI is on, your photo goes once to kie.ai (OpenAI GPT Image) to be restyled. {BOOTH_DAILY_LIMIT} looks a day.
              </p>
            </>
          )}

          {b.step === "error" && b.problem === "camera" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>No camera, no problem.</h2>
              <p className="booth__text">Allow camera access in your browser and try again — or use my photo instead.</p>
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--primary" onClick={b.startCamera}>Try the camera again</button>
                <button type="button" className="booth-btn" onClick={b.useSample}>Use my photo instead</button>
              </div>
            </>
          )}

          {b.step === "error" && b.problem === "limit" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>That’s today’s {BOOTH_DAILY_LIMIT} looks.</h2>
              <p className="booth__text">The booth resets tomorrow. The room is still open, and so is the laptop.</p>
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--primary" onClick={onStepAway}>Step away</button>
                <button type="button" className="booth-btn" onClick={b.retake}>Retake instead</button>
              </div>
            </>
          )}

          {b.step === "error" && (b.problem === "failed" || b.problem === null) && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>That didn’t load.</h2>
              <p className="booth__text">Start the camera instead, or step away and come back.</p>
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--primary" onClick={b.startCamera}>Start the camera</button>
                <button type="button" className="booth-btn" onClick={onStepAway}>Step away</button>
              </div>
            </>
          )}

          {(b.step === "pose" || b.step === "countdown") && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>
                {b.step === "countdown" ? "Hold still." : "Pick a look, then take the photo."}
              </h2>
              {b.step === "countdown" ? (
                <>
                  <p className="booth__text" role="status">The shutter goes in {b.count}.</p>
                  <div className="booth__actions">
                    <button type="button" className="booth-btn booth-btn--primary" onClick={b.cancelCountdown}>Cancel the countdown</button>
                  </div>
                </>
              ) : (
                <>
                  {looks}
                  <div className="booth__actions">
                    <button type="button" className="booth-btn booth-btn--primary" onClick={b.shoot}>Take the photo</button>
                    <button type="button" className="booth-btn" onClick={b.useSample}>Use my photo instead</button>
                  </div>
                  <p className="booth__fine">You’ll see the photo before anything is sent.</p>
                </>
              )}
            </>
          )}

          {b.step === "preview" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>Ready to develop?</h2>
              <p className="booth__text">This is the photo that goes to the AI. You can retake it first.</p>
              {looks}
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--primary" onClick={b.confirm}>Develop my card</button>
                <button type="button" className="booth-btn" onClick={b.retake}>Retake</button>
              </div>
              <p className="booth__fine">
                Your photo goes once to kie.ai (OpenAI GPT Image) to be restyled. If the AI is off, you still get the photo as it is.
              </p>
            </>
          )}

          {b.step === "developing" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>Developing…</h2>
              <p className="booth__text" aria-live="polite">{facts[b.fact]}</p>
              <p className="booth__fine">Restyled as {styleName}. This usually takes a few seconds.</p>
              <div className="booth__actions">
                <button type="button" className="booth-btn" onClick={onStepAway}>Step away</button>
              </div>
            </>
          )}

          {b.step === "printing" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>Printing…</h2>
              <p className="booth__text">Your card is coming out of the slot.</p>
            </>
          )}

          {b.step === "done" && (
            <>
              <h2 className="booth__title" id="booth-heading" data-booth-heading tabIndex={-1}>
                {b.problem ? "Here’s your print." : "Here’s your card."}
              </h2>
              <p className="booth__text">
                {b.problem === "not-configured"
                  ? "The AI is resting, so this is your photo as it is."
                  : b.problem === "failed"
                    ? "The restyle didn’t come through, so this is your photo as it is."
                    : `Restyled as ${styleName}.`}
              </p>
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--primary" onClick={b.download}>Download the card</button>
                <button type="button" className="booth-btn" onClick={b.tryAnother}>Try another look</button>
                <button type="button" className="booth-btn" onClick={b.retake}>Retake</button>
              </div>
              <div className="booth__actions">
                <button type="button" className="booth-btn booth-btn--quiet" onClick={onStepAway}>Step away</button>
              </div>
            </>
          )}
        </div>

        <p className="booth__note">
          {b.step === "developing"
            ? "Nothing is stored on this site."
            : "A real booth I built for events: 200 to 300 guests a night."}
        </p>
      </div>
    </div>
  );
}
