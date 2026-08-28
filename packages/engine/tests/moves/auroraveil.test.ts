import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Aurora Veil (オーロラベール) fails if not snowing", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "abomasnow", ability: "soundproof", moves: ["auroraveil"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move auroraveil, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Aurora Veil (オーロラベール) succeeds in snow and reduces physical damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "abomasnow", ability: "snowwarning", moves: ["auroraveil"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "arcanine", ability: "flashfire", moves: ["flareblitz"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move auroraveil, move sleeptalk", "move flareblitz 1, move sleeptalk");
});
