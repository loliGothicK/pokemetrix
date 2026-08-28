import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Bitter Blade", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ceruledge", ability: "flashfire", moves: ["bitterblade"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  // Need to test healing. Instead of setHp, just execute the move.

  const res = env.executeTurn(
    "move bitterblade 1, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
  env.assertEngineLogsMatchShowdown(res.engineLogs, 0);
});
