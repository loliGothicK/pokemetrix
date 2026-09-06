import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("If the target uses a move with a priority of +1 whilst under the effects of Mischief and Encore", () => {
  it("It is determined by the priority of the move that was called for an encore", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "whimsicott",
          item: "focussash",
          ability: "prankster",
          nature: "Timid",
          moves: ["encore", "moonblast", "tailwind", "protect"],
          evs: {
            hp: 2,
            spa: 32,
            spe: 32,
          },
        }),
        pokemon({
          species: "charizard-mega-y",
          ability: "drought",
          item: "charizardite-y",
          nature: "Timid",
          moves: ["heatwave", "weatherball", "ancientpower", "protect"],
          evs: {
            hp: 2,
            spa: 32,
            spe: 32,
          },
        }),
      ],
      [
        pokemon({
          species: "lycanrocdusk",
          ability: "toughclaws",
          item: "focussash",
          nature: "Adamant",
          moves: ["rockslide", "accelerock", "closecombat", "protect"],
          evs: {
            hp: 2,
            atk: 32,
            spe: 32,
          },
        }),
        pokemon({
          species: "sneasler",
          ability: "unburden",
          moves: ["direclaw", "closecombat", "fakeout", "protect"],
          nature: "Adamant",
          evs: {
            hp: 2,
            atk: 32,
            spe: 32,
          },
        }),
      ],
      { padTeam: false },
    );

    // Turn 1
    env.executeAndAssert("move moonblast 1, move protect", "move rockslide, move fakeout 2");

    // Turn 2: Encore -> Dire Claw (Whimsicott is fainted) -> Heat Wave (Sneasler is fainted)
    env.executeAndAssert("move encore 1, move heatwave", "move accelerock 2, move direclaw 1");
  });
});
