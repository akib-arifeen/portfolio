import type { Work } from "../work";

const work: Work = {
  slug: "shortest-path",
  title: "Shortest-path engine",
  kicker: "Final year project · City University of Hong Kong",
  summary:
    "An engine for exact shortest-path queries on large road networks, built to answer many-to-many travel-time tables and to measure what makes them fast.",
  role: "Designing, building and benchmarking the engine",
  when: "In progress",
  stack: ["C++17", "CMake", "OpenMP"],
  status: "in progress",
  links: [{ label: "Ask for the code", href: "mailto:aarifeen2-c@my.cityu.edu.hk" }],
  cover: {
    kind: "image",
    src: "/work/shortest-path/cover.svg",
    alt: "A small road network drawn as dots and lines, with three source dots on the left and three target dots on the right joined by highlighted routes.",
    w: 1200,
    h: 750,
  },
  blocks: [
    {
      kind: "prose",
      heading: "The question",
      paras: [
        "Given a road network, how long does it take to get from each of several starting points to each of several destinations? The engine answers that exactly, as a table, and also answers single point-to-point and one-to-many queries.",
        "The project is a study as much as a tool. I want to know which ideas make those tables faster on real road graphs, and by how much.",
        "The repository is private while the project is in progress. I am happy to share the code on request.",
      ],
    },
    {
      kind: "steps",
      heading: "Three things I am measuring",
      items: [
        { title: "Search reuse", body: "One search from a source can serve many targets, instead of starting again for each pair." },
        { title: "Multi-core parallelism", body: "Independent queries run on several cores at once." },
        { title: "Vertex reordering", body: "The order the graph is stored in memory changes how well the processor cache is used." },
      ],
    },
    {
      kind: "facts",
      heading: "A first result",
      items: [
        { value: "264,346", label: "nodes in the New York road graph", note: "733,846 arcs, from the DIMACS challenge data" },
        { value: "44,326", label: "nodes settled by Dijkstra on one query", note: "from node 1 to node 200,000" },
        { value: "12,367", label: "nodes settled by A* on the same query", note: "same distance, 618,568" },
      ],
    },
    {
      kind: "decisions",
      heading: "How I keep it honest",
      items: [
        {
          choice: "Test every engine against a reference",
          why: "A fast answer that is wrong is worthless, so every engine is checked against a plain reference Dijkstra.",
          cost: "I keep a simple, slow reference implementation in the tests and run it on every change.",
        },
        {
          choice: "Refuse to time engines that disagree",
          why: "Timings only mean something when the answers match, so the benchmark driver will not time anything if the engines disagree.",
          cost: "A disagreement stops the whole run. Every benchmark file starts with a header describing the environment.",
        },
        {
          choice: "Time on the real machine, not in a container",
          why: "Containers on Apple Silicon get no hardware counters, so I do not trust a timing taken in one.",
          cost: "The Linux container is for correctness checks and simulated cache counts only.",
        },
      ],
    },
    {
      kind: "prose",
      heading: "Where it stands",
      paras: [
        "Version 0.1 has Dijkstra, A*, one-to-many tables, multi-threaded batches, a command-line tool, a benchmark driver, and tests that check every engine against the reference. It builds with CMake and has continuous integration on Linux and macOS.",
        "It is still in progress, and I will add results here as the experiments finish.",
      ],
    },
  ],
  related: ["gravity-wars", "zoom-backup"],
};

export default work;
