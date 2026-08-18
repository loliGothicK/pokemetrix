---
description: "Rules ensuring metagame validity for the Pokémon Champions format"
trigger: always_on
---
# Domain Context: Pokémon Champions

This entire application strictly targets "Pokémon Champions", which is EXCLUSIVELY a Double Battle (VGC) format.
1. **Strict Metagame Validity**: The Pokémon Champions metagame is a highly restricted custom format. Do NOT rely on general Pokémon knowledge (e.g., assuming Zapdos or Tapu Lele exists). You MUST verify that ANY Pokémon, item, or move you use in tests, quizzes, code, or seed data actually exists in this specific environment.
2. **Source of Truth & Banned Entities**: Always check the explicit data files before referencing entities.
   - **Banned**: Do NOT use **Ditto (メタモン)** in any quizzes or examples due to ambiguity, and NEVER invent or use Pokémon that are not strictly present in the allowed pool (e.g., Crobat).
   - Pokémon: `apps/web/data/champions/pokemon.json` and `apps/web/data/champions/regulations.ts`
   - Items: `apps/web/data/champions/items.json`
   - Moves: `apps/web/data/champions/moves.json`
3. **Champions EV Format**: EVs in this domain are capped at **32 per stat** and **66 in total** (unlike standard Pokémon EVs of 252/510). Whenever you write EV data (e.g., in quizzes, mock data, or tests), you MUST use this 32-based scale. For example, use `"A32+"` or `"H32 B32+"` instead of `"A252+"`, and use `"H2"` for leftovers instead of `"H4"`.
4. **Double Battle Primitives**: Do not assume 1v1/Singles contexts. Quiz schemas explicitly use 2v2 concepts (`playerSide` arrays, `ally`, `opponentAlly`). Whenever you update a schema or data structure, you MUST proactively ensure that any validation scripts are also updated to parse the new fields. Silent validation failures will lead to domain contamination.
