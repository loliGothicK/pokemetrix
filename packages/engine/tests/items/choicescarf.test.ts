import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Choice Scarf", () => {
  it("multiplies Speed by 1.5x allowing holder to move first", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "choicescarf",
          moves: ["thunderbolt", "sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "gengar",
          moves: ["shadowball", "sleeptalk"],
        }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move thunderbolt 1, move sleeptalk", "move shadowball 1, move sleeptalk");
  });
});
