import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: quiverdance", () => {
  it("should match Showdown logs", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "volcarona", moves: ["quiverdance"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // TODO: implement specific scenario for quiverdance
    env.executeAndAssert("move quiverdance, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
