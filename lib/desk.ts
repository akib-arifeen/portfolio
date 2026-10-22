// Content for the laptop ("Akib's laptop") — the personal, deeper layer behind the main page.
// Notes are drafts written from WORK_RECORD.md in Akib's voice; edit freely.

export type Note = { id: string; title: string; date: string; body: string[] };

export const notes: Note[] = [
  {
    id: "welcome",
    title: "Read me first",
    date: "Oct 2026",
    body: [
      "Hi, I’m Akib. This is my laptop, and you’re welcome to poke around. Notes has write-ups of how things were really built, Photos is life outside the code, Music is what’s on repeat while I build, and Calendar is the timeline of what shipped and when.",
      "Tip one: press Cmd or Ctrl + K to search everything on this laptop, projects, notes, photos and commands included.",
      "Tip two: open Terminal and type `neofetch`. It’s a small shell, and `help` lists what else it understands.",
      "Tip three: the Playground has things you can play right here, no tab switching. Mail is the quickest way to reach me.",
    ],
  },
  {
    id: "booth",
    title: "Building the photobooth",
    date: "Aug 2026",
    body: [
      "The ask was “a photobooth”. It turned into a small character-led show: ARI waves when you walk up, talks back in English or Cantonese, tells you a fun fact while your photo renders, interviews you on camera for marketing, and prints the result.",
      "The part nobody sees: browsers can’t print silently to a booth printer. So I wrote a tiny print agent that lives on the booth laptop, ships as a single hidden .exe, starts itself at login and needs no admin rights.",
      "One bug worth telling: a finished photo could leave the booth stuck at 99% forever. The kind of thing you only meet with a real queue of guests.",
      "It ran at SCMUN 2026 and a 300-guest company dinner, and it’s now being offered to schools.",
    ],
  },
  {
    id: "studio",
    title: "A video studio in five weeks",
    date: "Oct 2026",
    body: [
      "No spec, just a request to make videos from lessons. I built a pipeline where separate agents plan, write, fact-check, direct and review each video, with a human approving every stage.",
      "Everything heavy runs on our own GPU box: talking-avatar video, custom voices, transcription. A memory-gated queue releases the GPU between stages and guards RAM and VRAM.",
      "Favourite small win: music scores rendered one window at a time took 433 seconds. Rendered side by side, 99.",
    ],
  },
  {
    id: "zoom",
    title: "When “save the recordings” became a system",
    date: "Aug 2026",
    body: [
      "The request was to back up the class recordings. The useful version also matches each recording to its lesson, collects attendance, frees Zoom space once a file is safe in S3, and warns staff at the end of the day when a class is missing its recording.",
      "150 GB freed so far, and nobody has to remember to do it.",
    ],
  },
  {
    id: "how",
    title: "How I like to work",
    date: "2026",
    body: [
      "Most of my best work started as one fuzzy sentence. I’d rather ask two sharp questions and then build something people can react to than wait for a perfect spec.",
      "I care about the finish: the sound when you click, the line a character says, the second the printer takes. That’s usually the part people remember.",
    ],
  },
];

export type Photo = { src: string; caption: string; date: string };

export const photos: Photo[] = [
  { src: "/desk/photos/p12.jpg", caption: "Summer", date: "June 2025" },
  { src: "/desk/photos/p21.jpg", caption: "HKPC visit with CityUHK", date: "July 2024" },
  { src: "/desk/photos/p3.jpg", caption: "Runner-up, inter-hall tug of war", date: "November 2024" },
  { src: "/desk/photos/p19.jpg", caption: "SCMUN student leaders", date: "August 2024" },
  { src: "/desk/photos/p1.jpg", caption: "Chinese New Year festival at CityUHK", date: "February 2024" },
  { src: "/desk/photos/p8.jpg", caption: "Hall board game club", date: "March 2025" },
  { src: "/desk/photos/p14.jpg", caption: "Football", date: "January 2024" },
  { src: "/desk/photos/p9.jpg", caption: "Tiger committee awards", date: "June 2024" },
  { src: "/desk/photos/p13.jpg", caption: "Hall team", date: "November 2024" },
  { src: "/desk/photos/p2.jpg", caption: "Tiger gathering, end of semester", date: "July 2024" },
  { src: "/desk/photos/p23.jpg", caption: "Organising the hall calligraphy event", date: "June 2024" },
  { src: "/desk/photos/p6.jpg", caption: "CityUHK Magic Club", date: "February 2024" },
  { src: "/desk/photos/p18.jpg", caption: "Eid", date: "February 2025" },
  { src: "/desk/photos/p10.jpg", caption: "Volunteering at Food Angel", date: "May 2024" },
  { src: "/desk/photos/p11.jpg", caption: "Global Festival Night, CityUHK", date: "December 2024" },
];

export const playlists: { name: string; embed: string }[] = [
  { name: "summer flows 0.02", embed: "https://open.spotify.com/embed/album/3NRNR4txhuRLhnQUUlqWXH" },
  { name: "My Heart It Beats for You", embed: "https://open.spotify.com/embed/playlist/5esmerdzc4jeDKQRyy8tom" },
  { name: "For Lovers", embed: "https://open.spotify.com/embed/album/0gwS2D9sukMLXNvleEnYr2" },
  { name: "summer,", embed: "https://open.spotify.com/embed/playlist/4bKLRu5jpvThL3lqRb1RNf" },
  { name: "ABSOLUTE HEARTBREAK", embed: "https://open.spotify.com/embed/album/11Ax1twWIvL2xltYzbH3Up" },
  { name: "CHARLIE", embed: "https://open.spotify.com/embed/album/2LTqBgZUH4EkDcj8hdkNjK" },
  { name: "love is not dying", embed: "https://open.spotify.com/embed/album/5mkf4N44kdEwYgaOk3hRLF" },
  { name: "poochie", embed: "https://open.spotify.com/embed/playlist/5G0OhkLulLUAhCsSzT3xWN" },
  { name: "i think you think too much of me", embed: "https://open.spotify.com/embed/album/7AVvQhnDEUidKyJsXmQ7ju" },
];
