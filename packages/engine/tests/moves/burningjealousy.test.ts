import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Burning Jealousy", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ninetales", ability: "drought", moves: ["burningjealousy"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({
        species: "dragonite",
        ability: "innerfocus",
        moves: ["dragondance"],
        item: "choicescarf",
      }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "burningjealousy", secondary: "always" }, "sleeptalk"],
      engineConfig: { secondary: "always", damage_roll: "max" },
    },
  );

  // Dragonite uses Dragon Dance and gets stats raised.
  // Ninetales is slower and uses Burning Jealousy, which should burn Dragonite.
  // Gengar does not have stats raised and should not be burned.

  env.executeAndAssert("move burningjealousy, move sleeptalk", "move dragondance, move sleeptalk");
});
