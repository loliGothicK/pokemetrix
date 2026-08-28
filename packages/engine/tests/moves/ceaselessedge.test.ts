import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Ceaseless Edge", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hisuian-samurott", ability: "torrent", moves: ["ceaselessedge"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn(
    "move ceaselessedge 1, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
  env.assertEngineLogsMatchShowdown(res.engineLogs, 0);
});
