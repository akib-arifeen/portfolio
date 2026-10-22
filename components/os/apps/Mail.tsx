"use client";

import { useState } from "react";
import { useOs } from "@/components/os/OsContext";
import type { AppProps } from "@/lib/os/types";

const EMAIL = "aarifeen2-c@my.cityu.edu.hk";
const TO = `Akib Arifeen <${EMAIL}>`;
const LINKEDIN = "https://linkedin.com/in/akibarifeen";
const GITHUB = "https://github.com/akib-arifeen";

export default function Mail({ win }: AppProps) {
  void win;
  const os = useOs();
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("Hello from your portfolio");
  const [body, setBody] = useState("");

  function send() {
    const text = from.trim() ? `${body}\n\nFrom: ${from.trim()}` : body;
    const url = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = url;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      os.notify({ app: "mail", title: "Email copied", body: EMAIL, ttlMs: 3000 });
    } catch {
      os.notify({ app: "mail", title: "Could not copy", body: `Here it is: ${EMAIL}`, ttlMs: 5000 });
    }
  }

  return (
    <form className="ac ac-mail" onSubmit={(e) => { e.preventDefault(); send(); }}>
      <div className="ac-mail-bar" role="toolbar" aria-label="Compose">
        <button type="submit" className="ac-tool ac-tool--primary">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 11.5 20 4l-5.5 16-3.2-6.3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          <span>Send</span>
        </button>
        <button type="button" className="ac-tool" onClick={copy}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          <span>Copy email</span>
        </button>
        <span className="ac-mail-spacer" />
        <a className="ac-tool" href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a className="ac-tool" href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
      <div className="ac-mail-fields">
        <label className="ac-field">
          <span>To</span>
          <input type="text" value={TO} readOnly />
        </label>
        <label className="ac-field">
          <span>From</span>
          <input type="email" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your email (optional)" autoComplete="email" />
        </label>
        <label className="ac-field">
          <span>Subject</span>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
      </div>
      <label className="ac-mail-body">
        <span className="ac-sr">Message</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write to me. I read everything." />
      </label>
      <p className="ac-mail-foot">Send opens your own mail app with this message filled in.</p>
    </form>
  );
}
