import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contact } from "@/lib/content";
import { education, experience, headline, skills, statement } from "@/lib/profile";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MONTH = /^\d{4}-\d{2}$/;

const visible = [headline, statement, ...experience.flatMap((e) => [e.role, e.org, e.where, e.when, ...e.points])];

describe("experience", () => {
  it("runs from the current role backwards", () => {
    expect(experience[0].end).toBeUndefined();
    expect(experience.filter((e) => e.end === undefined).length).toBe(1);
    // Newest activity first: a current role counts as later than any finished one.
    const recency = experience.map((e) => e.end ?? "9999-99");
    expect(recency).toEqual([...recency].sort().reverse());
    expect(new Set(experience.map((e) => e.id)).size).toBe(experience.length);
  });

  it("names the role, the organisation, the place and the dates the CV gives", () => {
    expect(experience.map((e) => [e.role, e.org, e.where, e.when])).toEqual([
      ["Software Engineer", "See Change Education, Asia Allied Group", "Hong Kong", "Sep 2025 to Present"],
      ["Full Stack Developer, part-time", "852HealthKare", "Remote", "Nov 2025 to Jan 2026"],
      ["AI Engineer Intern", "Seth Biotech", "Hong Kong", "Jun 2024 to Jul 2024"],
    ]);
  });

  it("keeps every date a real month, in order", () => {
    for (const e of experience) {
      expect(e.start, e.id).toMatch(MONTH);
      if (e.end) {
        expect(e.end, e.id).toMatch(MONTH);
        expect(e.end > e.start, e.id).toBe(true);
      }
    }
  });

  it("gives every role at least one thing it actually did", () => {
    for (const e of experience) {
      expect(e.points.length, e.id).toBeGreaterThan(0);
      for (const p of e.points) expect(p.trim().length, e.id).toBeGreaterThan(30);
    }
  });

  it("keeps the CV's own figures rather than new ones", () => {
    const text = experience.flatMap((e) => e.points).join(" ");
    for (const figure of ["50%", "200 to 300", "32-lesson", "80%", "150 GB", "1,000+", "95%"]) {
      expect(text, figure).toContain(figure);
    }
  });
});

describe("education and skills", () => {
  it("states the degree, the university and the dates on the CV", () => {
    expect(education.length).toBe(1);
    const e = education[0];
    expect(e.degree).toBe("B.Sc. Computer Science, Minor in Data Science");
    expect(e.org).toBe("City University of Hong Kong");
    expect(e.when).toBe("Aug 2023 to Aug 2027");
    expect(e.start).toBe("2023-08");
    expect(e.end).toBe("2027-08");
  });

  it("groups skills without turning them into a score", () => {
    expect(skills.map((s) => s.group)).toEqual(["Languages", "Frameworks", "AI", "Infrastructure", "Practices", "Design"]);
    for (const s of skills) {
      expect(s.items.length, s.group).toBeGreaterThan(0);
      for (const item of s.items) expect(item.trim().length, s.group).toBeGreaterThan(0);
    }
  });
});

describe("what a reader sees", () => {
  it("uses the site's voice, not the CV's dash", () => {
    for (const s of visible) {
      expect(s, s).not.toMatch(/[\u2013\u2014]/);
      expect(s, s).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("carries no phone number and no student ID", () => {
    const text = visible.join("\n");
    expect(text).not.toMatch(/9463|\+852|student\s*id/i);
    expect(text).not.toMatch(/\b\d{4}\s\d{4}\b/);
  });

  it("states no claim the CV does not make", () => {
    const text = visible.join("\n");
    expect(text).not.toMatch(/expert|world-class|passionate|10x/i);
  });

  it("links the CV that already exists, unchanged", () => {
    expect(contact.cv).toBe("/akib-arifeen-cv.pdf");
    const pdf = `${ROOT}public${contact.cv}`;
    expect(statSync(pdf).size).toBeGreaterThan(10_000);
    expect(readFileSync(pdf).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("uses the email the CV prints", () => {
    expect(contact.email).toBe("aarifeen2-c@my.cityu.edu.hk");
  });
});
