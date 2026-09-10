import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Alluring Voice confuses target if stats were raised this turn", () => {
  const env = new TestEnvironment(
    [
      // Sylveon using Alluring Voice
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["alluringvoice"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      // Weavile using Swords Dance (faster than Sylveon)
      pokemon({ species: "weavile", ability: "pressure", moves: ["swordsdance"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "alluringvoice", secondary: "inherit" },
        "swordsdance",
        "sleeptalk",
      ],
      engineConfig: { secondary: "always" },
    },
  );

  env.executeAndAssert("move alluringvoice 1, move sleeptalk", "move swordsdance, move sleeptalk");

  // Weavile should be confused!
  const weavile = env.sim.p2.pokemon[0];
  expect(weavile.volatiles["confusion"]).toBeDefined();
});

test("Move: Alluring Voice does not confuse target if stats were not raised", () => {
  const env = new TestEnvironment(
    [
      // Sylveon using Alluring Voice
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["alluringvoice"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      // Weavile using a non-stat move (faster than Sylveon)
      pokemon({ species: "weavile", ability: "pressure", moves: ["iceshard"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "alluringvoice", secondary: "inherit" }, "iceshard", "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );

  env.executeAndAssert("move alluringvoice 1, move sleeptalk", "move iceshard 1, move sleeptalk");

  const weavile = env.sim.p2.pokemon[0];
  expect(weavile.volatiles["confusion"]).toBeUndefined();
});
