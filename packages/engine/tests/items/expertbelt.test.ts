import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Expert Belt", () => {
  it("boosts super-effective moves by 1.2x", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "expertbelt",
          moves: ["thunderbolt"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "gyarados",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Pikachu uses Thunderbolt (Electric) on Gyarados (Water/Flying) which is 4x super-effective.
    // Expert Belt activates and boosts damage by 1.2x.
    env.executeAndAssert("move thunderbolt 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
