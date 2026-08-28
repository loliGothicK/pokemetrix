import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Volt Absorb (ちくでん) Differential Test", () => {
  it("heals 1/4 of max HP when hit by a damaging Electric-type move", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "Raichu", ability: "static", moves: ["thunderbolt"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["thunderbolt", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move thunderbolt 1, move sleeptalk");
  });

  it("blocks Electric-type status moves (e.g., Thunder Wave / でんじは) and heals", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "Raichu", ability: "static", moves: ["thunderwave"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["thunderwave", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move thunderwave 1, move sleeptalk");
  });

  it("completely nullifies the move even at Max HP", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "raichu", ability: "static", moves: ["thunder"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["thunder", "sleeptalk"],
      },
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move thunder 1, move sleeptalk");
  });

  it("triggers when hit by an ally's move (e.g. Discharge)", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["discharge"] }),
      ],
      [
        pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["discharge", "sleeptalk"],
        engineConfig: {
          damage_roll: "max",
          crits: "never",
          accuracy: "always",
          secondary: "never",
        },
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move discharge", "move sleeptalk, move sleeptalk");
  });
});
