import { describe, it, expect } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Encore with Prankster and Status Move vs Sucker Punch", () => {
  it("Sucker Punch should be failed", () => {
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
          species: "delphox-mega",
          ability: "levitate",
          item: "delphoxite",
          nature: "Timid",
          moves: ["heatwave", "psychic", "nastyplot", "protect"],
          evs: {
            hp: 2,
            spa: 32,
            spe: 32,
          },
        }),
      ],
      [
        pokemon({
          species: "kingambit",
          ability: "defiant",
          item: "focussash",
          nature: "Adamant",
          moves: ["kowtowcleave", "suckerpunch", "ironhead", "lowkick"],
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
    env.executeAndAssert("move moonblast 2, move heatwave", "move suckerpunch 1, move direclaw 1");

    // Turn 2: Sucker Punch should fail because Delphox chose a status move (Nasty Plot),
    // even though it was Encored into Heat Wave before Sucker Punch executed.
    const { engineState, engineLogs } = env.executeTurn("move encore -2, move nastyplot", "move suckerpunch 2");

    // Sucker Punch fails
    expect(engineLogs.some((l) => l.showdown === "|-fail|p2a")).toBe(true);

    // Delphox survives with full HP
    expect(engineState.p1.active[1].hp).toBe(152);

    // Kingambit faints from Delphox's Heat Wave
    expect(engineState.p2.active[0].hp).toBe(0);
  });
});
