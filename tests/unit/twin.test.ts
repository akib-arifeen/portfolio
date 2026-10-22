import { describe, expect, it } from "vitest";
import { contact } from "@/lib/content";
import { MATCH_THRESHOLD, STARTERS, STOP_WORDS, answer, entries } from "@/lib/twin";
import type { TwinEntry } from "@/lib/twin";

/* ── helpers ─────────────────────────────────────────────────────── */

/** Test-side folding, written from the contract: lowercase, accents stripped, punctuation removed. */
function foldWords(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
const foldedQuestions = (e: TwinEntry) => e.questions.map((q) => foldWords(q).join(" "));
const entryById = (id: string) => entries.find((e) => e.id === id);

function fx(over: Partial<TwinEntry> & { id: string }): TwinEntry {
  return { questions: [`question ${over.id}`], keywords: [], answer: `Answer ${over.id}.`, sources: ["fixture"], ...over };
}

/** Run `fn` with `entries` temporarily replaced by fixtures (answer reads the exported array). */
function withEntries(fixtures: TwinEntry[], fn: () => void) {
  const saved = entries.splice(0, entries.length, ...fixtures);
  try {
    fn();
  } finally {
    entries.splice(0, entries.length, ...saved);
  }
}

/* ── constants ───────────────────────────────────────────────────── */

describe("constants", () => {
  it("MATCH_THRESHOLD is 3", () => {
    expect(MATCH_THRESHOLD).toBe(3);
  });
  it("STOP_WORDS holds the common function words", () => {
    for (const w of ["a", "the", "and", "of", "is", "you", "your", "my", "what", "how", "why", "tell", "about"]) {
      expect(STOP_WORDS.has(w), w).toBe(true);
    }
    expect(STOP_WORDS.has("react")).toBe(false);
  });
  it("STARTERS has three to five entries", () => {
    expect(STARTERS.length).toBeGreaterThanOrEqual(3);
    expect(STARTERS.length).toBeLessThanOrEqual(5);
  });
});

/* ── structure of the real knowledge base ────────────────────────── */

describe("entries: structure", () => {
  it("has at least 30 entries with unique ids", () => {
    expect(entries.length).toBeGreaterThanOrEqual(30);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry is complete: id, questions, answer, at least one source", () => {
    for (const e of entries) {
      expect(e.id.length, "id").toBeGreaterThan(0);
      expect(e.questions.length, `${e.id} questions`).toBeGreaterThanOrEqual(1);
      expect(e.questions[0].trim().length, `${e.id} questions[0]`).toBeGreaterThan(0);
      expect(e.answer.trim().length, `${e.id} answer`).toBeGreaterThan(0);
      expect(e.sources.length, `${e.id} sources`).toBeGreaterThanOrEqual(1);
      for (const s of e.sources) expect(s.trim().length).toBeGreaterThan(0);
    }
  });

  it("each answer is at most 3 sentences", () => {
    for (const e of entries) {
      const sentences = e.answer.split(/[.!?]+(?:\s+|$)/).filter((x) => x.trim().length > 0);
      expect(sentences.length, e.id).toBeLessThanOrEqual(3);
    }
  });

  it("no em or en dash anywhere in the content", () => {
    const bad = /[—–]/;
    for (const e of entries) {
      const all = [e.id, e.answer, ...e.questions, ...e.keywords, ...e.sources, e.action?.label ?? ""];
      for (const s of all) expect(bad.test(s), `${e.id}: ${s}`).toBe(false);
    }
  });

  it("STARTERS and follow-ups point at existing entries", () => {
    for (const id of STARTERS) expect(entryById(id), `starter ${id}`).toBeDefined();
    for (const e of entries) {
      for (const f of e.followUps ?? []) expect(entryById(f), `${e.id} -> ${f}`).toBeDefined();
    }
  });
});

/* ── retrieval over the real entries (properties) ────────────────── */

describe("answer: real entries", () => {
  it("asking an entry's own first question verbatim returns that entry", () => {
    for (const e of entries) {
      const r = answer(e.questions[0]);
      expect(r.entryId, e.questions[0]).toBe(e.id);
      expect(r.answer).toBe(e.answer);
      expect(r.sources).toEqual(e.sources);
    }
  });

  it("is insensitive to case, accents and punctuation", () => {
    for (const e of entries) {
      const q = e.questions[0];
      const id = answer(q).entryId;
      expect(answer(q.toUpperCase()).entryId, `upper: ${q}`).toBe(id);
      expect(answer(`${q}?!`).entryId, `punct: ${q}`).toBe(id);
      expect(answer(q.replace(/e/g, "é")).entryId, `accent: ${q}`).toBe(id);
      expect(answer(`  ${q.replace(/ /g, "   ")}  `).entryId, `space: ${q}`).toBe(id);
    }
  });

  it("stop words do not change the result", () => {
    for (const e of entries) {
      const q = e.questions[0];
      expect(answer(`${q} the a of is`).entryId, q).toBe(answer(q).entryId);
    }
  });

  it("one word from an entry's own question is enough to match something (3 >= threshold)", () => {
    for (const e of entries) {
      const w = foldWords(e.questions[0]).find((x) => !STOP_WORDS.has(x));
      if (!w) continue;
      expect(answer(w).entryId, `${e.id}: ${w}`).not.toBeNull();
    }
  });

  it("a lone keyword (2 points) is below the threshold, two keywords reach it", () => {
    const allQ = entries.flatMap(foldedQuestions);
    const otherKeywords = (e: TwinEntry) =>
      entries.filter((o) => o !== e).flatMap((o) => o.keywords.flatMap((k) => foldWords(k).join(" ")));
    // keywords unique to one entry: a single folded word, not a stop word, not in any question, not a keyword prefix elsewhere
    const clean = (e: TwinEntry) =>
      e.keywords
        .map((k) => foldWords(k))
        .filter((ws) => ws.length === 1)
        .map((ws) => ws[0])
        .filter(
          (k) =>
            !STOP_WORDS.has(k) &&
            !allQ.some((q) => q.includes(k)) &&
            !otherKeywords(e).some((ok) => ok === k || (k.length >= 4 && ok.startsWith(k))),
        );

    const withOne = entries.find((e) => clean(e).length >= 1);
    expect(withOne, "an entry with a unique single-word keyword").toBeDefined();
    const k = clean(withOne!)[0];
    const lone = answer(k);
    expect(lone.entryId).toBeNull();

    const withTwo = entries.find((e) => new Set(clean(e)).size >= 2);
    if (withTwo) {
      const [a, b] = [...new Set(clean(withTwo))];
      expect(answer(`${a} ${b}`).entryId).toBe(withTwo.id);
    }
  });
});

/* ── fallback ────────────────────────────────────────────────────── */

describe("answer: fallback", () => {
  const expectedFollowUps = () =>
    STARTERS.map((id) => ({ id, question: entryById(id)?.questions[0] }));

  for (const [label, input] of [
    ["gibberish", "qzxvbnm wrtplk"],
    ["empty input", ""],
    ["whitespace only", "   \t\n "],
    ["punctuation only", "?!?! ..."],
    ["stop words only", "what is the"],
  ] as const) {
    it(`${label}: entryId null, non-empty answer, no sources, starters as follow-ups`, () => {
      const r = answer(input);
      expect(r.entryId).toBeNull();
      expect(r.answer.trim().length).toBeGreaterThan(0);
      expect(r.sources).toEqual([]);
      expect(r.followUps).toEqual(expectedFollowUps());
      expect(r.action).toBeUndefined();
    });
  }

  it("invites an email to the contact address", () => {
    const r = answer("qzxvbnm wrtplk");
    expect(r.answer).toContain(contact.email);
  });
});

/* ── follow-ups on matched answers ───────────────────────────────── */

describe("answer: follow-ups on real entries", () => {
  it("at most 3, each { id, question: questions[0] } of an existing entry", () => {
    for (const e of entries) {
      const r = answer(e.questions[0]);
      expect(r.followUps.length, e.id).toBeLessThanOrEqual(3);
      for (const f of r.followUps) {
        const target = entryById(f.id);
        expect(target, `${e.id} -> ${f.id}`).toBeDefined();
        expect(f.question).toBe(target!.questions[0]);
      }
      const wanted = (e.followUps ?? []).slice(0, 3);
      expect(r.followUps.map((f) => f.id)).toEqual(wanted);
    }
  });

  it("passes the entry's action through", () => {
    for (const e of entries) {
      const r = answer(e.questions[0]);
      if (e.action) expect(r.action).toEqual(e.action);
      else expect(r.action).toBeUndefined();
    }
  });
});

/* ── never throws, never empty ───────────────────────────────────── */

describe("answer: robustness", () => {
  const odd = [
    "",
    " ",
    "?",
    "a",
    "the",
    "\u0000",
    "éèê",
    "x".repeat(5000),
    "what is the meaning of life, the universe and everything?",
    "<script>alert(1)</script>",
    "SELECT * FROM entries; --",
    "__proto__ constructor toString",
    "café naïve résumé",
    "1 2 3 4 5",
    "\n\n\n",
  ];
  for (const q of odd) {
    it(`handles ${JSON.stringify(q.slice(0, 30))}`, () => {
      let r: ReturnType<typeof answer> | undefined;
      expect(() => {
        r = answer(q);
      }).not.toThrow();
      expect(r!.answer.trim().length).toBeGreaterThan(0);
      expect(r!.followUps.length).toBeLessThanOrEqual(5);
      expect(Array.isArray(r!.sources)).toBe(true);
    });
  }

  it("is deterministic", () => {
    expect(answer("tell me about your projects")).toEqual(answer("tell me about your projects"));
  });
});

/* ── scoring rules, isolated with fixture entries ────────────────── */
/* These swap the contents of the exported `entries` array for the duration of each test, which relies on
   `answer` reading the live array. If `answer` snapshots entries at import time these fail by design. */

describe("scoring (fixtures)", () => {
  it("3 points for a word in an entry's questions reaches the threshold", () => {
    withEntries([fx({ id: "a", questions: ["zorp blat"] })], () => {
      expect(answer("blat").entryId).toBe("a");
      expect(answer("zorp").entryId).toBe("a");
    });
  });

  it("a word that is in no question and no keyword scores 0", () => {
    withEntries([fx({ id: "a", questions: ["zorp blat"], keywords: ["kwik"] })], () => {
      expect(answer("nothing").entryId).toBeNull();
    });
  });

  it("2 points for a keyword is below the threshold on its own", () => {
    withEntries([fx({ id: "a", questions: ["zorp blat"], keywords: ["kwik"] })], () => {
      expect(answer("kwik").entryId).toBeNull();
    });
  });

  it("question word plus keyword word adds up (3 + 2) and two keywords reach it (2 + 2)", () => {
    withEntries([fx({ id: "a", questions: ["zorp blat"], keywords: ["kwik", "yak"] })], () => {
      expect(answer("zorp kwik").entryId).toBe("a");
      expect(answer("kwik yak").entryId).toBe("a");
    });
  });

  it("keyword prefix counts only for words of 4 or more letters", () => {
    withEntries([fx({ id: "a", questions: ["zorp"], keywords: ["kwikword", "oxen"] })], () => {
      // "kwik" is 4 letters and a prefix of "kwikword": 2 points; "oxen" exact: 2 points -> 4
      expect(answer("kwik oxen").entryId).toBe("a");
      // "kwi" is only 3 letters: no prefix credit; "ox" 2 letters: no prefix credit. Only "oxen" scores (exact).
      expect(answer("kwi oxen").entryId).toBeNull();
      expect(answer("ox oxen").entryId).toBeNull();
    });
  });

  it("short words match a keyword exactly", () => {
    withEntries([fx({ id: "a", questions: ["zorp"], keywords: ["ox", "yak"] })], () => {
      expect(answer("ox yak").entryId).toBe("a");
    });
  });

  it("a word must be a prefix of the keyword, not the other way round or a substring", () => {
    withEntries([fx({ id: "a", questions: ["zorp"], keywords: ["kwikword", "typescript"] })], () => {
      expect(answer("word script").entryId).toBeNull();
      expect(answer("kwikwordier typescripts").entryId).toBeNull();
    });
  });

  it("stop words never score, even when they appear in a question", () => {
    withEntries([fx({ id: "a", questions: ["the of and zorp"] })], () => {
      expect(answer("the of and").entryId).toBeNull();
      expect(answer("the of and zorp").entryId).toBe("a");
    });
  });

  it("folding applies to both the query and the entry text", () => {
    withEntries([fx({ id: "a", questions: ["Café Zorp!"], keywords: ["Résumé"] })], () => {
      expect(answer("CAFE").entryId).toBe("a");
      expect(answer("cafe, zorp?").entryId).toBe("a");
      expect(answer("résumé resume").entryId).toBe("a");
    });
  });

  it("the entry with the highest score wins", () => {
    withEntries(
      [fx({ id: "a", questions: ["zorp"] }), fx({ id: "b", questions: ["zorp blat"] }), fx({ id: "c", questions: ["blat"] })],
      () => {
        expect(answer("zorp blat").entryId).toBe("b");
        expect(answer("blat").entryId).toBe("b"); // b and c tie on 3, b comes first
      },
    );
  });

  it("ties break by entry order", () => {
    const a = fx({ id: "a", questions: ["zorp"] });
    const b = fx({ id: "b", questions: ["zorp"] });
    withEntries([a, b], () => expect(answer("zorp").entryId).toBe("a"));
    withEntries([b, a], () => expect(answer("zorp").entryId).toBe("b"));
  });

  it("returns the entry's answer, sources and action", () => {
    const action = { label: "Open it", run: { type: "open", app: "notes" } } as const;
    withEntries([fx({ id: "a", questions: ["zorp"], answer: "I built zorp.", sources: ["S1", "S2"], action })], () => {
      const r = answer("zorp");
      expect(r.answer).toBe("I built zorp.");
      expect(r.sources).toEqual(["S1", "S2"]);
      expect(r.action).toEqual(action);
    });
  });

  it("follow-ups are capped at 3 and mapped to each target's first question", () => {
    withEntries(
      [
        fx({ id: "a", questions: ["zorp"], followUps: ["b", "c", "d", "e"] }),
        fx({ id: "b", questions: ["First b", "second b"] }),
        fx({ id: "c", questions: ["First c"] }),
        fx({ id: "d", questions: ["First d"] }),
        fx({ id: "e", questions: ["First e"] }),
      ],
      () => {
        expect(answer("zorp").followUps).toEqual([
          { id: "b", question: "First b" },
          { id: "c", question: "First c" },
          { id: "d", question: "First d" },
        ]);
      },
    );
  });

  it("an entry without followUps gives an empty list", () => {
    withEntries([fx({ id: "a", questions: ["zorp"] })], () => {
      expect(answer("zorp").followUps).toEqual([]);
    });
  });

  it("the fallback offers the STARTERS, resolved against the live entries", () => {
    const starterIds = [...STARTERS];
    const fixtures = starterIds.map((id) => fx({ id, questions: [`Starter ${id}`] }));
    withEntries(fixtures, () => {
      const r = answer("qzxvbnm");
      expect(r.entryId).toBeNull();
      expect(r.followUps).toEqual(starterIds.map((id) => ({ id, question: `Starter ${id}` })));
    });
  });
});

/* ── punctuation, whole-word matching, regression table ──────────── */

describe("punctuation becomes a space", () => {
  it("real entries: 'full-stack?' behaves like 'full stack'", () => {
    const plain = answer("full stack");
    const punct = answer("full-stack?");
    expect(punct.entryId).toBe(plain.entryId);
    expect(punct.answer).toBe(plain.answer);
  });

  it("every punctuation character separates words instead of merging them (fixture)", () => {
    withEntries([fx({ id: "a", questions: ["zorp blat"] })], () => {
      for (const q of ["zorp-blat", "zorp/blat", "zorp.blat", "zorp,blat", "zorp:blat", "zorp;blat", "(zorp)blat", "zorp!blat?", "zorp’blat", "zorp_blat"]) {
        expect(answer(q).entryId, q).toBe("a");
      }
      // merged, the two words would be one unknown word
      expect(answer("zorpblat").entryId).toBeNull();
    });
  });

  it("punctuation inside an entry's own questions also splits words (fixture)", () => {
    withEntries([fx({ id: "a", questions: ["Full-stack, end-to-end?"] })], () => {
      expect(answer("stack").entryId).toBe("a");
      expect(answer("end").entryId).toBe("a");
      expect(answer("full stack").entryId).toBe("a");
    });
  });

  it("a keyword with punctuation in the query still counts as separate words (fixture)", () => {
    withEntries([fx({ id: "a", questions: ["zorp"], keywords: ["kwik", "yak"] })], () => {
      expect(answer("kwik-yak").entryId).toBe("a");
    });
  });
});

describe("question words match whole words only", () => {
  it("a prefix of a question word gets no question score (fixture)", () => {
    withEntries([fx({ id: "a", questions: ["many projects here"] })], () => {
      expect(answer("proj").entryId).toBeNull();
      expect(answer("project").entryId).toBeNull();
      expect(answer("ects").entryId).toBeNull();
      expect(answer("projects").entryId).toBe("a");
    });
  });

  it("a longer query word than the question word gets no score either (fixture)", () => {
    withEntries([fx({ id: "a", questions: ["many project here"] })], () => {
      expect(answer("projects").entryId).toBeNull();
      expect(answer("project").entryId).toBe("a");
    });
  });

  it("the keyword prefix rule still applies: a 4-letter prefix of a keyword scores 2 (fixture)", () => {
    withEntries([fx({ id: "a", questions: ["many projects here"], keywords: ["projectmanagement", "kwik"] })], () => {
      expect(answer("proj").entryId).toBeNull(); // 2 < threshold, and no question credit
      expect(answer("proj kwik").entryId).toBe("a"); // 2 + 2
    });
  });
});

describe("regression table: realistic questions", () => {
  const table: [string, string][] = [
    ["how long have you worked there", "now"],
    ["what is your name", "who"],
    ["where do you live", "who"],
    ["tell me about your education", "education"],
    ["do you like music", "sound"],
    ["can I see your CV", "cv"],
    ["can you build me a website", "contact"],
    ["tell me about the photobooth", "photobooth"],
    ["what's your tech stack", "stack"],
    ["how can I reach you", "contact"],
  ];
  for (const [q, id] of table) {
    it(`"${q}" -> ${id}`, () => {
      expect(answer(q).entryId).toBe(id);
    });
  }

  it("every id in the table exists as an entry", () => {
    for (const [, id] of table) expect(entryById(id), id).toBeDefined();
  });
});
