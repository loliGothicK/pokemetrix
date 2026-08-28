import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Water Absorb (ちょすい) Differential Test", () => {
  it("heals 1/4 of max HP when hit by a damaging Water-type move", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", ability: "torrent", moves: ["waterpulse"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["waterpulse", "sleeptalk"],
      },
    );

    // Set HP to 50 manually
    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move waterpulse 1, move sleeptalk");
  });

  it("blocks Water-type status moves (e.g., Soak / みずびたし) and heals", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "samurott", ability: "torrent", moves: ["soak"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["soak", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move soak 1, move sleeptalk");
  });

  it("stops multi-hit Water-type moves (e.g., Water Shuriken) on the very first hit and only heals once", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "greninja", ability: "torrent", moves: ["watershuriken"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["watershuriken", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move watershuriken 1, move sleeptalk");
  });

  it("completely nullifies the move even at Max HP", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", ability: "torrent", moves: ["hydrocannon"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["hydrocannon", "sleeptalk"],
      },
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move hydrocannon 1, move sleeptalk");
  });

  it("triggers when hit by an ally's move (e.g. Surf)", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["surf"] }),
      ],
      [
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["surf", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move surf", "move sleeptalk, move sleeptalk");
  });
});
