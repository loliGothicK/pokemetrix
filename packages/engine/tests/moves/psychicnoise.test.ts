import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: psychicnoise", () => {
  it("should prevent target from healing", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "alolan-raichu", moves: ["psychicnoise", "thunderbolt"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "alakazam", moves: ["recover", "sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // Turn 1: Raichu damages Alakazam, applies Heal Block
    env.executeAndAssert("move psychicnoise 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      damage_roll: "max",
    });

    // Turn 2: Alakazam tries to Recover but fails
    env.executeAndAssert("move thunderbolt 1, move sleeptalk", "move recover, move sleeptalk", {
      damage_roll: "max",
    });
  });
});
