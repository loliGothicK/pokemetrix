import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Baneful Bunker (トーチカ) protects user and poisons attacker if contact move is used", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "toxapex", ability: "merciless", moves: ["banefulbunker"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      // Arcanine using Flare Blitz (contact)
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["flareblitz"] }),
      // Pikachu using Thunderbolt (non-contact)
      pokemon({ species: "pikachu", ability: "static", moves: ["thunderbolt"] }),
    ],
  );

  // Arcanine and Pikachu both attack Toxapex
  const res = env.executeTurn(
    "move banefulbunker, move sleeptalk",
    "move flareblitz 1, move thunderbolt 1",
  );
  env.assertStateMatch(res.engineState, env.sim);

  const toxapex = env.sim.p1.pokemon[0];
  const arcanine = env.sim.p2.pokemon[0];
  const pikachu = env.sim.p2.pokemon[1];

  // Toxapex should take no damage
  expect(toxapex.hp).toBe(toxapex.maxhp);

  // Arcanine should be poisoned (it made contact)
  expect(arcanine.status).toBe("psn");

  // Pikachu should NOT be poisoned (Thunderbolt is not contact)
  expect(pikachu.status).toBe("");
});
