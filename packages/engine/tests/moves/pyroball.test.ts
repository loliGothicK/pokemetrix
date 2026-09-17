import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Pyro Ball deals physical Fire damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "cinderace", ability: "blaze", moves: ["pyroball", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["pyroball", "sleeptalk"],
    },
  );

  env.executeAndAssert("move pyroball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Pyro Ball is blocked by Bulletproof", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "cinderace", ability: "blaze", moves: ["pyroball", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "kommo-o", ability: "bulletproof", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["pyroball", "sleeptalk"],
    },
  );

  env.executeAndAssert("move pyroball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
