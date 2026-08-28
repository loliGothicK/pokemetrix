import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Ally Switch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alakazam", ability: "magicguard", moves: ["allyswitch"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn("move allyswitch, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
  env.assertEngineLogsMatchShowdown(res.engineLogs, 0);
});
