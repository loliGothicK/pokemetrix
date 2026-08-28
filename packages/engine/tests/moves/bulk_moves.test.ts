import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Cross Chop", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "machamp", moves: ["crosschop"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sludgebomb"] }),
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
    ],
  );
  const res = env.executeTurn(
    "move crosschop 1, move sleeptalk",
    "move sludgebomb 1, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
});

test("Move: Cross Poison", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["crosspoison"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sludgebomb"] }),
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
    ],
  );
  const res = env.executeTurn(
    "move crosspoison 1, move sleeptalk",
    "move sludgebomb 1, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
});

test("Move: Crush Claw", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "excadrill", moves: ["crushclaw"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sludgebomb"] }),
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
    ],
  );
  const res = env.executeTurn(
    "move crushclaw 1, move sleeptalk",
    "move sludgebomb 1, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
});
