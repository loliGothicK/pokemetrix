import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Bug Bite", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "scizor", ability: "swarm", moves: ["bugbite"], evs: { hp: 32 } }), // ensure high max HP
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({
        species: "snorlax",
        ability: "thickfat",
        item: "sitrusberry",
        moves: ["sleeptalk"],
      }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bugbite", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move bugbite 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
