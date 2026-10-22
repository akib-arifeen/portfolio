// Case-study index: one module per slug in lib/cases/ (each owned by one content worker), in display order.
import type { Work } from "./work";
import videoStudio from "./cases/video-studio";
import photobooth from "./cases/photobooth";
import lessonPipeline from "./cases/lesson-pipeline";
import zoomBackup from "./cases/zoom-backup";
import agentQuest from "./cases/agent-quest";
import loopcraft from "./cases/loopcraft";
import gravityWars from "./cases/gravity-wars";
import leyci from "./cases/leyci";
import workoutPlanner from "./cases/workout-planner";
import culinaryCompanion from "./cases/culinary-companion";
import shortestPath from "./cases/shortest-path";
import twinkleStar from "./cases/twinkle-star";

export const works: Work[] = [
  videoStudio,
  photobooth,
  lessonPipeline,
  zoomBackup,
  agentQuest,
  loopcraft,
  gravityWars,
  leyci,
  workoutPlanner,
  culinaryCompanion,
  shortestPath,
  twinkleStar,
];
