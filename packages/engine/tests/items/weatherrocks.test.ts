import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Weather Rocks (Damp, Heat, Smooth, Icy)", () => {
  it("extends Rain to 8 turns with Damp Rock", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pelipper",
          ability: "drizzle",
          item: "damprock",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  it("extends Sun to 8 turns with Heat Rock", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "torkoal",
          ability: "drought",
          item: "heatrock",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  it("extends Sandstorm to 8 turns with Smooth Rock", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "tyranitar",
          ability: "sandstream",
          item: "smoothrock",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  it("extends Snow to 8 turns with Icy Rock", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "abomasnow",
          ability: "snowwarning",
          item: "icyrock",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
