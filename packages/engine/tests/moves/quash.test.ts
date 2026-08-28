import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Quash (さきおくり) forces the target to move last", () => {
  const env = new TestEnvironment(
    [
      // P1: Sableye (Prankster) uses Quash on Opponent 1
      pokemon({ species: "sableye", ability: "prankster", moves: ["quash"] }),
      // P1: Pikachu is extremely slow and uses Thunderbolt
      pokemon({ species: "pikachu", ability: "static", item: "iron-ball", moves: ["thunderbolt"] }),
    ],
    [
      // P2: Opponent 1 is very fast, uses a fast move
      pokemon({
        species: "gengar",
        ability: "cursedbody",
        item: "choice-scarf",
        moves: ["thunderbolt"],
      }),
      // P2: Opponent 2 is also fast
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["extremespeed"] }),
    ],
    {
      deterministicMoves: ["quash", "thunderbolt", "extremespeed"],
    },
  );

  // Turn Order Prediction:
  // 1. Opponent 2 (Arcanine) uses Extreme Speed (+2, Speed 95)
  // 2. Sableye uses Quash (+1, Prankster) -> targets Opponent 1 (Gengar)
  // 3. Pikachu (p1b) uses Thunderbolt (+0, Speed 45) -> Opponent 1 was pushed behind!
  // 4. Opponent 1 (Gengar) uses Thunderbolt (+0, Speed 135) -> forced to move here!

  env.executeAndAssert(
    "move quash 1, move thunderbolt 1",
    "move thunderbolt 1, move extremespeed 1",
  );
});
