import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Sap Sipper (そうしょく) Differential Test", () => {
  it("blocks damaging Grass-type moves and raises Attack by 1 stage", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "azumarill", ability: "sapsipper", moves: ["bellydrum", "sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "Venusaur", ability: "overgrow", moves: ["gigadrain"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["gigadrain", "sleeptalk"],
      },
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move gigadrain 1, move sleeptalk");
  });

  it("blocks Grass-type status moves (e.g. Leech Seed) and raises Attack", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "azumarill", ability: "sapsipper", moves: ["bellydrum", "sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "Venusaur", ability: "overgrow", moves: ["leechseed"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["leechseed", "sleeptalk"],
      },
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move leechseed 1, move sleeptalk");
  });

  it("still blocks the move completely even if Attack is already at +6", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "azumarill", ability: "sapsipper", moves: ["bellydrum", "sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "Venusaur", ability: "overgrow", moves: ["energyball", "sleeptalk"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["energyball", "sleeptalk"],
      },
    );

    env.executeAndAssert("move bellydrum, move sleeptalk", "move sleeptalk, move sleeptalk");
    env.executeAndAssert("move sleeptalk, move sleeptalk", "move energyball 1, move sleeptalk");
  });

  it("stops multi-hit Grass-type moves (e.g. Bullet Seed) on the first hit, boosting Attack only once", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "azumarill", ability: "sapsipper", moves: ["bellydrum", "sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "venusaur", ability: "overgrow", moves: ["bulletseed"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["bulletseed", "sleeptalk"],
      },
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move bulletseed 1, move sleeptalk");
  });
});
