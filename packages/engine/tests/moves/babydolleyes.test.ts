import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Baby-Doll Eyes (つぶらなひとみ) lowers opponent`s Attack by 1 stage and has +1 priority", () => {
  const env = new TestEnvironment(
    [
      // Sylveon using Baby-Doll Eyes
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["babydolleyes"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      // Weavile using Swords Dance
      pokemon({ species: "weavile", ability: "pressure", moves: ["swordsdance"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["quickattack"] }),
    ],
  );

  env.executeAndAssert(
    "move babydolleyes 1, move sleeptalk",
    "move swordsdance, move quickattack 1",
  );

  // Weavile should have -1 Attack before using Swords Dance, meaning it ends up at +1 Attack
  const weavile = env.sim.p2.pokemon[0];
  expect(weavile.boosts.atk).toBe(1); // -1 from Baby-Doll Eyes + 2 from Swords Dance
});

test("Move: Baby-Doll Eyes fails against Clear Body", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["babydolleyes"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "metagross", ability: "clearbody", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn(
    "move babydolleyes 1, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);

  const metagross = env.sim.p2.pokemon[0];
  expect(metagross.boosts?.atk || 0).toBe(0); // Attack should not be lowered
});
