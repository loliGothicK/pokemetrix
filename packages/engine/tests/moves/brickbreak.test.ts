import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Brick Break breaks screens", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["brickbreak", "sleeptalk"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({
        species: "pikachu",
        ability: "lightningrod",
        moves: ["reflect", "lightscreen", "sleeptalk"],
      }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "brickbreak", accuracy: true },
        { id: "reflect", accuracy: true },
        { id: "lightscreen", accuracy: true },
        "sleeptalk",
      ],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move sleeptalk, move sleeptalk", "move reflect, move sleeptalk");
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move lightscreen, move sleeptalk");

  env.executeAndAssert("move brickbreak 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Brick Break vs Immune target", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["brickbreak", "sleeptalk"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({
        species: "pikachu",
        ability: "lightningrod",
        moves: ["reflect", "lightscreen", "sleeptalk"],
      }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "brickbreak", accuracy: true },
        { id: "reflect", accuracy: true },
        { id: "lightscreen", accuracy: true },
        "sleeptalk",
      ],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move sleeptalk, move sleeptalk", "move reflect, move sleeptalk");
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move lightscreen, move sleeptalk");

  env.executeAndAssert("move brickbreak 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
