import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Spiky Shield protects user and damages attacker on contact", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "chesnaught", ability: "overgrow", moves: ["spikyshield"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "arcanine", ability: "flashfire", moves: ["flareblitz"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn(
    "move spikyshield, move sleeptalk",
    "move flareblitz 1, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);

  const chesnaught = env.sim.p1.pokemon[0];
  const arcanine = env.sim.p2.pokemon[0];

  expect(chesnaught.hp).toBe(chesnaught.maxhp);
  expect(arcanine.hp).toBeLessThan(arcanine.maxhp);
});
