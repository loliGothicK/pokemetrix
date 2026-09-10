import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Attract", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", ability: "swarm", moves: ["attract"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn("move attract 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
  env.assertEngineLogsMatchShowdown(res.engineLogs, 0);
});
