import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Snipe Shot ignores Follow Me redirection", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "inteleon", ability: "torrent", moves: ["snipeshot", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "unaware", moves: ["followme", "sleeptalk"] }),
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["snipeshot", "followme", "sleeptalk"],
    },
  );

  // Inteleon targets slot 2 (tauros), while slot 1 (clefable) uses followme.
  // Snipe Shot ignores followme and hits slot 2 directly.
  env.executeAndAssert("move snipeshot 2, move sleeptalk", "move followme, move sleeptalk");
});

test("Move: Snipe Shot hits directly without redirection", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "inteleon", ability: "torrent", moves: ["snipeshot", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["snipeshot", "sleeptalk"],
    },
  );

  env.executeAndAssert("move snipeshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
