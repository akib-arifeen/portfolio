import type { Work } from "../work";

const work: Work = {
  slug: "zoom-backup",
  title: "Zoom recording automation",
  kicker: "See Change Education · 2026",
  summary:
    "A nightly job that backs up every class recording from Zoom to S3, matches it to the right lesson, proposes attendance and frees Zoom storage, with an alert at the end of the day for classes with no recording.",
  role: "Backup, matching, attendance, storage clean-up, the alerts and the job lock",
  when: "2026",
  stack: ["Spring Boot", "Zoom API", "AWS S3", "Redis", "MySQL", "Flyway", "React"],
  status: "in production",
  outcome: { value: "150 GB", note: "of Zoom cloud storage freed" },
  links: [],
  cover: {
    kind: "image",
    src: "/work/zoom-backup/cover.svg",
    alt: "An illustration of a class recording tile with an arrow pointing to a stack of storage layers marked with a check, above a small attendance list.",
    w: 1200,
    h: 750,
  },
  blocks: [
    {
      kind: "prose",
      heading: "The ask and what it became",
      paras: [
        "The ask was to save the Zoom recordings. I turned it into a system: every class recording is backed up to S3, linked to its lesson, and Zoom storage is freed, with attendance and an alert for anything missing.",
        "Deleting from Zoom is the scary part, so the clean-up shows a preview first. One recording that always fails backs off instead of blocking the queue, and a recording that runs out of retries lands in a visible needs-attention state instead of vanishing.",
        "I measured the live Zoom account instead of trusting the documentation. I had assumed attendance reports expire after 30 days, and Zoom answered for reports 31 days, 142 days and about 12 months old. Attendance is only proposed from those reports, never written without a person.",
      ],
    },
    {
      kind: "steps",
      heading: "How a recording gets backed up",
      items: [
        { title: "Discover", body: "The job signs in with Zoom's server-to-server OAuth and finds the recordings of finished classes." },
        { title: "Match", body: "Each recording is matched to one session and one lesson. When a participant name is truly ambiguous, a person decides." },
        { title: "Back up to S3", body: "One code path serves the nightly run, manual runs and back-filling old classes, and it can resume where it stopped." },
        { title: "Collect attendance", body: "Attendance is split on the lesson window, with logic for who is presumed to be the teacher, and can be fetched in bulk as far back as Zoom allows." },
        { title: "Free the storage", body: "The panel shows how many recordings can be released and previews the deletion before it happens." },
        { title: "Alert at day end", body: "At the end of the day an alert lists classes that are missing a recording or their materials." },
      ],
    },
    {
      kind: "code",
      heading: "A lock that tells a blip from a takeover",
      lang: "java",
      code: `enum Renewal { HELD, TAKEN, NO_ANSWER }

static final String EXTEND_IF_MINE =
    "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('pexpire',KEYS[1],ARGV[2]) else return 0 end";

Renewal renew(String key, String token, long ttlMs) {
    try {
        Object r = jedis.eval(EXTEND_IF_MINE, List.of(key), List.of(token, String.valueOf(ttlMs)));
        return Long.valueOf(1).equals(r) ? Renewal.HELD : Renewal.TAKEN;
    } catch (JedisException e) {
        return Renewal.NO_ANSWER; // says nothing about who owns the lock
    }
}

boolean keepLock(String key, String token, long ttlMs) {
    int misses = 0;
    while (sweepRunning()) {
        switch (renew(key, token, ttlMs)) {
            case TAKEN -> { return false; }
            case NO_ANSWER -> { if (++misses > MAX_MISSES) return false; }
            case HELD -> misses = 0;
        }
        sleep(ttlMs / 3);
    }
    return true;
}`,
      caption:
        "The backup runs as more than one container, so only one may sweep at a time. A renewal can say HELD, TAKEN or NO_ANSWER. A Redis timeout is NO_ANSWER, which proves nothing about ownership, so the sweep carries on, but only for a limited number of misses in a row. Only TAKEN stops it at once.",
      source: "Simplified sketch of the approach, not production code",
    },
    {
      kind: "decisions",
      heading: "Decisions I would defend",
      items: [
        {
          choice: "Write a small lock instead of adding ShedLock",
          why: "A new dependency and its own database table would buy what about 60 lines over the Redis we already run can do.",
          cost: "I own the lock code, and I could not reuse the existing helper, which has a fixed 5-minute expiry and no owner token.",
        },
        {
          choice: "Three renewal results, not a yes or no",
          why: "A single Redis timeout had aborted a whole nightly sweep mid-download, so an unreachable Redis is now told apart from a lost lock.",
          cost: "The sweep tolerates only a limited number of unknown renewals in a row.",
        },
        {
          choice: "A visible needs-attention state",
          why: "Recordings that run out of retries used to vanish silently, which is the worst way to lose a class.",
          cost: "Someone has to look at that list, but one bad recording no longer holds up the rest.",
        },
        {
          choice: "Propose attendance, never write it",
          why: "Students have no participant id, so the display name is the identity, and a missing report is not an empty class. A person confirms.",
          cost: "A human confirmation step, in exchange for never writing a wrong attendance record.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { value: "150 GB", label: "of Zoom cloud storage freed" },
        { value: "Every class", label: "backed up to S3 this year" },
        { value: "about 12 months", label: "how far back Zoom answered for attendance reports", note: "not the 30 days I had assumed" },
      ],
    },
  ],
  related: ["video-studio", "lesson-pipeline"],
};

export default work;
