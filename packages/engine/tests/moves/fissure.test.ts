import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Fissure", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["fissure"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "aerodactyl", ability: "pressure", moves: ["sleeptalk"] }), // Flying
    ],
    {
      deterministicMoves: [{ id: "fissure", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1: Fissure hits Clefable -> faint
  env.executeAndAssert("move fissure 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Fissure (Immunity)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["fissure"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "aerodactyl", ability: "pressure", moves: ["sleeptalk"] }), // Flying immune to Fissure
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "fissure", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1: Fissure vs Aerodactyl (immune)
  env.executeAndAssert("move fissure 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
