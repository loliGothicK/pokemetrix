import pokemonData from "./champions/pokemon.json" with { type: "json" };
import movesData from "./champions/moves.json" with { type: "json" };
import itemsData from "./champions/items.json" with { type: "json" };

export { pokemonData, movesData, itemsData };
// Re-export regulations if needed (wait, regulations.ts is in champions/regulations.ts).
export * from "./champions/regulations";
