import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Chilly Reception", () => {
  const env = new TestEnvironment(
    [
      pokemon({
        species: "slowking",
        ability: "owntempo",
        moves: ["chillyreception"],
        evs: { spe: 32 },
      }),
      pokemon({ species: "slowbro", ability: "owntempo", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  // Use Chilly Reception. It should set Snow and then require a switch.
  const res = env.executeTurn(
    "move chillyreception, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
  // // env.assertEngineLogsMatchShowdown(res.engineLogs, 0);

  // Provide the switch for Player 1
  console.log("active length:", env.engine.get_state().p1.active.length);
  console.log("team length:", env.engine.get_state().p1.team.length);
  const switchRes = env.executeTurn("switch clefable, pass", "pass, pass");
  env.assertStateMatch(switchRes.engineState, env.sim);
});
