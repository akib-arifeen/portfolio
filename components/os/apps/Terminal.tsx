"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOs } from "@/components/os/OsContext";
import { complete, prompt, runCommand } from "@/lib/os/terminal";
import { HOME } from "@/lib/os/fs";
import type { AppProps, TermLine } from "@/lib/os/types";

function lastLogin(d: Date) {
  const day = d.toLocaleDateString("en-GB", { weekday: "short" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `Last login: ${day} ${time} on ttys001`;
}

/** The shell: scrollback, prompt and keyboard handling around the pure engine in lib/os/terminal.ts. */
export default function Terminal({ win }: AppProps) {
  const os = useOs();
  const [lines, setLines] = useState<TermLine[]>(() => [
    { text: lastLogin(new Date()), tone: "dim" },
    { text: "Type `help` to see what's here.", tone: "dim" },
  ]);
  const [cwd, setCwd] = useState(HOME);
  const [input, setInput] = useState("");

  const cwdRef = useRef(HOME);
  const history = useRef<string[]>([]);
  const cursor = useRef(0); // index into history while walking; history.length means "the line being typed"
  const draft = useRef("");
  const inputEl = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const ranLaunch = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, input]);

  const exec = useCallback((raw: string) => {
    const typed = raw.trim().replace(/\s+/g, " ");
    if (typed) {
      history.current.push(typed);
      cursor.current = history.current.length;
    }
    const res = runCommand(raw, { cwd: cwdRef.current, history: history.current, now: new Date() });
    const echo: TermLine = { text: `${prompt(cwdRef.current)} ${raw}`, tone: "echo" };
    setLines((prev) => (res.clear ? [...res.lines] : [...prev, echo, ...res.lines]));
    cwdRef.current = res.cwd;
    setCwd(res.cwd);
    const action = res.action;
    if (action) {
      if (action.type === "exit") timers.current.push(window.setTimeout(() => os.run(action), 400));
      else os.run(action);
    }
  }, [os]);

  // `open terminal --command`, menu items and search results arrive as win.arg.command
  const command = win.arg?.command;
  useEffect(() => {
    if (!command || ranLaunch.current === win.launch) return;
    ranLaunch.current = win.launch;
    exec(command);
  }, [command, win.launch, exec]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      exec(input);
      setInput("");
      draft.current = "";
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (e.key === "ArrowUp") {
        if (cursor.current === 0) return;
        if (cursor.current === h.length) draft.current = input;
        cursor.current -= 1;
      } else {
        if (cursor.current >= h.length) return;
        cursor.current += 1;
      }
      setInput(cursor.current === h.length ? draft.current : h[cursor.current]);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const r = complete(input, { cwd: cwdRef.current, history: history.current, now: new Date() });
      setInput(r.line);
      if (r.options.length) setLines((prev) => [...prev, { text: r.options.join("  "), tone: "dim" }]);
      return;
    }
    if (e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === "l") {
        e.preventDefault();
        setLines([]);
      } else if (k === "c") {
        e.preventDefault();
        setLines((prev) => [...prev, { text: `${prompt(cwdRef.current)} ${input}`, tone: "echo" }, { text: "^C", tone: "dim" }]);
        setInput("");
        draft.current = "";
        cursor.current = history.current.length;
      }
    }
  };

  const focusInput = () => {
    if (window.getSelection()?.toString()) return; // let people copy text out of the scrollback
    inputEl.current?.focus();
  };

  return (
    <div className="os-term" ref={scroller} onClick={focusInput}>
      <div role="log" aria-label="Terminal output">
        {lines.map((l, i) => (
          <div key={i} className="os-term__line" data-tone={l.tone ?? "out"}>{l.text || " "}</div>
        ))}
      </div>
      <label className="os-term__row">
        <span className="os-term__prompt" data-tone="echo">{prompt(cwd)}</span>
        <input
          ref={inputEl}
          className="os-term__input"
          aria-label="Terminal command"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus={win.focused}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
    </div>
  );
}
