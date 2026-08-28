import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: King's Rock", () => {
  it("allows holder to attack and inflict damage with King's Rock equipped", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "kingsrock",
          moves: ["quickattack", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "snorlax",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
      {
        engineConfig: {
          secondary: "always",
        },
      },
    );

    env.executeAndAssert("move quickattack 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      secondary: "always",
    });
  });
});
