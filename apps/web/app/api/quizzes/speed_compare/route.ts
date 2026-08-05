import { NextResponse } from "next/server";
import pokemonDataRaw from "@data/champions/pokemon.json";
import jaTranslation from "@locales/ja/translation.json";
import enTranslation from "@locales/en/translation.json";
import { REG_M_B } from "@data/champions/regulations";
// Assuming pokemonData has the structure: { data: { identifier: string, status: number[] }[] }
const pokemonData = (pokemonDataRaw as any).data;

// Mulberry32 PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simple string hash
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function createRandom(seedStr: string) {
  const seed = xmur3(seedStr)();
  return mulberry32(seed);
}

const META_POKEMONS = [
  "garchomp",
  "arcanine",
  "incineroar",
  "rotom-wash",
  "gengar",
  "sylveon",
  "excadrill",
  "noivern",
  "tyranitar",
  "scizor",
  "clefable",
  "kangaskhan-mega",
  "talonflame",
  "dragapult",
  "flutter-mane",
  "charizard-mega-y",
  "charizard-mega-x",
  "venusaur-mega",
  "aerodactyl",
  "gyarados",
  "pelipper",
  "torkoal",
  "amoonguss",
  "slowbro",
  "alakazam",
  "salamence",
  "basculegion-male",
];

function calculateSpeed(
  base: number,
  evs?: string,
  item?: string,
  ability?: string,
  statStage?: number,
  field?: any,
  tailwindSide?: boolean,
) {
  let points = 0;
  let isPlus = false;
  if (evs) {
    if (evs.startsWith("S") && evs !== "S0") {
      isPlus = evs.includes("+");
      points = parseInt(evs.replace("S", "").replace("+", ""));
    }
  }

  const natureMult = isPlus ? 1.1 : 1.0;
  let stat = Math.floor((base * 2 + points) * natureMult);

  if (item === "choice-scarf") stat = Math.floor(stat * 1.5);
  if (item === "iron-ball") stat = Math.floor(stat * 0.5);

  if (ability === "Swift Swim" && field?.weather === "rain") stat = stat * 2;
  if (ability === "Sand Rush" && field?.weather === "sand") stat = stat * 2;

  if (tailwindSide) stat = stat * 2;

  if (statStage) {
    if (statStage > 0) stat = Math.floor(stat * ((2 + statStage) / 2));
    if (statStage < 0) stat = Math.floor(stat * (2 / (2 - statStage)));
  }

  return stat;
}

export function generateDynamicSpeedCompareSeeds(
  difficulty: "basics" | "advanced" | "expert" | "master",
  count: number,
  baseSeedStr: string,
): any[] {
  const metaPokemonData = pokemonData.filter((p: any) => META_POKEMONS.includes(p.identifier));

  const seeds: any[] = [];
  const rand = createRandom(baseSeedStr);

  const pickPokemon = () => metaPokemonData[Math.floor(rand() * metaPokemonData.length)];

  for (let i = 0; i < count; i++) {
    let seed: any;
    let attempts = 0;
    while (attempts < 1000) {
      attempts++;
      const pA = pickPokemon();
      const pB = pickPokemon();
      if (pA.identifier === pB.identifier) continue;

      seed = {
        id: `${baseSeedStr}_${i}`,
        difficulty,
        pokemonA: { slug: pA.identifier },
        pokemonB: { slug: pB.identifier },
        field: {},
      };

      let baseA = pA.status[5];
      let baseB = pB.status[5];

      if (difficulty === "basics") {
        if (baseA === baseB) continue;
        break; // Any non-tie is fine for basics
      }

      if (difficulty === "advanced") {
        seed.pokemonA.evs = rand() > 0.5 ? "S32+" : "S0";
        seed.pokemonB.evs = rand() > 0.5 ? "S32+" : "S0";
        const sA = calculateSpeed(baseA, seed.pokemonA.evs);
        const sB = calculateSpeed(baseB, seed.pokemonB.evs);
        if (sA !== sB && Math.abs(sA - sB) <= 40) break;
      }

      if (difficulty === "expert") {
        seed.pokemonA.evs = "S32+";
        seed.pokemonB.evs = "S32+";
        if (rand() > 0.7) seed.pokemonA.item = "choice-scarf";
        if (rand() > 0.7 && !seed.pokemonA.item) seed.pokemonB.item = "choice-scarf";
        if (rand() > 0.7) seed.field.tailwind = rand() > 0.5 ? "A" : "B";

        const tailwindA = seed.field.tailwind === "A" || seed.field.tailwind === "both";
        const tailwindB = seed.field.tailwind === "B" || seed.field.tailwind === "both";

        const sA = calculateSpeed(
          baseA,
          seed.pokemonA.evs,
          seed.pokemonA.item,
          undefined,
          undefined,
          seed.field,
          tailwindA,
        );
        const sB = calculateSpeed(
          baseB,
          seed.pokemonB.evs,
          seed.pokemonB.item,
          undefined,
          undefined,
          seed.field,
          tailwindB,
        );

        if (sA !== sB && Math.abs(sA - sB) <= 20) break;
      }

      if (difficulty === "master") {
        seed.pokemonA.evs = rand() > 0.3 ? "S32+" : "S0";
        seed.pokemonB.evs = rand() > 0.3 ? "S32+" : "S0";

        const r = rand();
        if (r < 0.2) {
          seed.field.trickRoom = true;
          if (rand() > 0.5) seed.pokemonA.item = "iron-ball";
          else seed.pokemonB.item = "iron-ball";
        } else if (r < 0.4) {
          seed.field.weather = rand() > 0.5 ? "rain" : "sand";
          if (seed.field.weather === "rain") {
            const swiftSwimmers = pokemonData.filter(
              (p: any) => p.abilities.includes(33) && REG_M_B.includes(p.id),
            );
            const swsw = swiftSwimmers[Math.floor(rand() * swiftSwimmers.length)];
            seed.pokemonA.slug = swsw.identifier;
            seed.pokemonA.ability = "Swift Swim";
            baseA = swsw.status[5];
          } else {
            const sandRushers = pokemonData.filter(
              (p: any) => p.abilities.includes(146) && REG_M_B.includes(p.id),
            );
            const sandr = sandRushers[Math.floor(rand() * sandRushers.length)];
            seed.pokemonA.slug = sandr.identifier;
            seed.pokemonA.ability = "Sand Rush";
            baseA = sandr.status[5];
          }
          if (seed.pokemonA.slug === seed.pokemonB.slug) continue;
          if (rand() > 0.5) seed.pokemonB.item = "choice-scarf";
        } else {
          seed.pokemonA.statStage = rand() > 0.5 ? 1 : -1;
          if (rand() > 0.5) seed.pokemonB.item = "choice-scarf";
        }

        const tailwindA = seed.field.tailwind === "A";
        const tailwindB = seed.field.tailwind === "B";
        const sA = calculateSpeed(
          baseA,
          seed.pokemonA.evs,
          seed.pokemonA.item,
          seed.pokemonA.ability,
          seed.pokemonA.statStage,
          seed.field,
          tailwindA,
        );
        const sB = calculateSpeed(
          baseB,
          seed.pokemonB.evs,
          seed.pokemonB.item,
          seed.pokemonB.ability,
          seed.pokemonB.statStage,
          seed.field,
          tailwindB,
        );

        // Accept only if speeds are very close, to ensure strict difficulty in master level
        if (sA !== sB) {
          if (Math.abs(sA - sB) <= 25) break; // TR alone doesn't make it master, needs to be tight
        }
      }
    }
    seeds.push(seed);
  }
  return seeds;
}

function getPokemonName(slug: string, locale: "ja" | "en") {
  const dict = locale === "ja" ? (jaTranslation as any) : (enTranslation as any);
  return dict.pokemon?.[slug]?.name || slug;
}

function generateQuizFromSeed(seed: any, locale: "ja" | "en") {
  const pA = pokemonData.find((p: any) => p.identifier === seed.pokemonA.slug);
  const pB = pokemonData.find((p: any) => p.identifier === seed.pokemonB.slug);

  if (!pA || !pB) return null;

  const baseA = pA.status[5];
  const baseB = pB.status[5];

  const tailwindA = seed.field?.tailwind === "A" || seed.field?.tailwind === "both";
  const tailwindB = seed.field?.tailwind === "B" || seed.field?.tailwind === "both";

  const speedA = calculateSpeed(
    baseA,
    seed.pokemonA.evs,
    seed.pokemonA.item,
    seed.pokemonA.ability,
    seed.pokemonA.statStage,
    seed.field,
    tailwindA,
  );
  const speedB = calculateSpeed(
    baseB,
    seed.pokemonB.evs,
    seed.pokemonB.item,
    seed.pokemonB.ability,
    seed.pokemonB.statStage,
    seed.field,
    tailwindB,
  );

  const isTR = seed.field?.trickRoom;

  let faster = "Tie";
  if (speedA > speedB) faster = isTR ? "B" : "A";
  if (speedB > speedA) faster = isTR ? "A" : "B";

  const nameA = getPokemonName(seed.pokemonA.slug, locale);
  const nameB = getPokemonName(seed.pokemonB.slug, locale);

  const getPrefix = (p: any) => {
    let prefix = "";
    if (p.evs && p.evs !== "S0") prefix += p.evs;
    if (p.item === "choice-scarf") prefix += locale === "ja" ? "こだわりスカーフ" : " Choice Scarf";
    if (p.item === "iron-ball") prefix += locale === "ja" ? "くろいてっきゅう" : " Iron Ball";
    if (p.statStage) prefix += `${p.statStage > 0 ? "+" : ""}${p.statStage}`;
    if (p.ability) prefix += locale === "ja" ? `(${p.ability})` : `(${p.ability})`;
    return prefix ? (locale === "ja" ? prefix + " " : prefix + " ") : "";
  };

  const prefixA = getPrefix(seed.pokemonA);
  const prefixB = getPrefix(seed.pokemonB);

  const displayNameA = locale === "ja" ? `${prefixA}${nameA}` : `${prefixA}${nameA}`;
  const displayNameB = locale === "ja" ? `${prefixB}${nameB}` : `${prefixB}${nameB}`;

  let correctAnswer = locale === "ja" ? "同速" : "Tie";
  if (faster === "A") correctAnswer = displayNameA;
  if (faster === "B") correctAnswer = displayNameB;

  let question = "";
  if (seed.difficulty === "basics") {
    if (locale === "ja") {
      question = `${nameA}の素早さ種族値は${nameB}より高いですか？`;
      correctAnswer = baseA > baseB ? "〇" : "×";
    } else {
      question = `Is ${nameA}'s base Speed higher than ${nameB}'s?`;
      correctAnswer = baseA > baseB ? "True" : "False";
    }
  } else {
    let fieldInfo = "";
    if (isTR) fieldInfo = locale === "ja" ? " (トリックルーム下)" : " (Trick Room)";
    if (seed.field?.weather === "rain") fieldInfo = locale === "ja" ? " (雨下)" : " (Rain)";
    if (seed.field?.weather === "sand") fieldInfo = locale === "ja" ? " (砂嵐下)" : " (Sandstorm)";
    if (seed.field?.tailwind === "A")
      fieldInfo = locale === "ja" ? ` (おいかぜ: ${nameA}側)` : ` (Tailwind: ${nameA})`;
    if (seed.field?.tailwind === "B")
      fieldInfo = locale === "ja" ? ` (おいかぜ: ${nameB}側)` : ` (Tailwind: ${nameB})`;

    if (locale === "ja") {
      question = `${displayNameA} vs ${displayNameB}。どちらが先に動きますか？${fieldInfo}`;
    } else {
      question = `${displayNameA} vs ${displayNameB}. Which is faster?${fieldInfo}`;
    }
  }

  let content = "";
  if (seed.difficulty === "basics") {
    if (locale === "ja") {
      content = `## 解説\n\n${nameA}の種族値は**${baseA}**、${nameB}は**${baseB}**です。\n${baseA > baseB ? `${nameA}の方が高いため、正解は**〇**です。` : `${nameA}の方が低いため、正解は**×**です。`}`;
    } else {
      content = `## Explanation\n\n${nameA}'s base speed is **${baseA}**, and ${nameB}'s is **${baseB}**.\n${baseA > baseB ? `Since ${nameA} is higher, the answer is **True**.` : `Since ${nameA} is lower, the answer is **False**.`}`;
    }
  } else {
    if (locale === "ja") {
      content = `## 計算\n\n**${displayNameA}**\n- 種族値: ${baseA}\n- 実数値: ${speedA}\n\n**${displayNameB}**\n- 種族値: ${baseB}\n- 実数値: ${speedB}\n\nしたがって、**${correctAnswer}の方が速い**です。`;
    } else {
      content = `## Calculation\n\n**${displayNameA}**\n- Base Speed: ${baseA}\n- Calculated: ${speedA}\n\n**${displayNameB}**\n- Base Speed: ${baseB}\n- Calculated: ${speedB}\n\nTherefore, **${correctAnswer} is faster**.`;
    }
  }

  const options =
    seed.difficulty === "basics"
      ? locale === "ja"
        ? ["〇", "×"]
        : ["True", "False"]
      : [displayNameA, displayNameB, locale === "ja" ? "同速" : "Tie"];

  return {
    id: seed.id,
    difficulty: seed.difficulty,
    category: "speed_compare",
    format: "choices",
    question,
    options,
    correctAnswer,
    content,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") as "ja" | "en") || "ja";
  const difficulty =
    (searchParams.get("difficulty") as "basics" | "advanced" | "expert" | "master") || "basics";

  // Use a specific seed for reproducible testing/sharing, or generate a random one
  const seedStr = searchParams.get("seed") || Math.random().toString(36).substring(2, 10);

  // Hardcoded 10 questions for now, as requested.
  const count = 10;

  const seeds = generateDynamicSpeedCompareSeeds(difficulty, count, seedStr);
  const quizzes = seeds.map((seed) => generateQuizFromSeed(seed, locale)).filter(Boolean);

  return NextResponse.json(quizzes);
}
