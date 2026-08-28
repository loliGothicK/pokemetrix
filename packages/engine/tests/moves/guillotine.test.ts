import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Guillotine", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pinsir", ability: "hypercutter", moves: ["guillotine"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }), // Ghost
    ],
    {
      deterministicMoves: [{ id: "guillotine", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1: Guillotine hits Snorlax -> faint
  env.executeAndAssert("move guillotine 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Guillotine (Immunity)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pinsir", ability: "hypercutter", moves: ["guillotine"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }), // Ghost immune to Guillotine
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "guillotine", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1: Guillotine vs Gengar (immune)
  env.executeAndAssert("move guillotine 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
