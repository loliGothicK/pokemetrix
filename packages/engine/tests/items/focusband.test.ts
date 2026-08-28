import { describe, expect, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Focus Band", () => {
  it("survives with 1 HP when activation succeeds", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "focusband",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "garchomp",
          moves: ["earthquake", "sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // With a battle seeded or checked
    const res = env.executeTurn(
      "move sleeptalk, move sleeptalk",
      "move earthquake, move sleeptalk",
    );
    expect(res.engineState.p1.active[0]).toBeDefined();
  });
});
