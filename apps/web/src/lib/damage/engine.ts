import type { DamageInput, DamageOutput } from "./types";

type DamageCalcModule = {
  calculate: (input: unknown) => unknown;
  type_effectiveness_shift: (att: number, def1: number, def2?: number | null) => number;
  is_immune: (att: number, def1: number, def2?: number | null) => boolean;
};

let modulePromise: Promise<DamageCalcModule> | null = null;

/**
 * Lazily load and initialise the WASM engine, caching the module across calls.
 *
 * The `bundler` build initialises the wasm instance on import (`__wbindgen_start`),
 * so a single dynamic import is enough.
 */
async function load(): Promise<DamageCalcModule> {
  if (!modulePromise) {
    modulePromise = import("@pokemetrix/damage-calc") as Promise<DamageCalcModule>;
  }
  return modulePromise;
}

/** Run a full damage calculation, returning all 16 rolls plus min/max. */
export async function calculate(input: DamageInput): Promise<DamageOutput> {
  const mod = await load();
  try {
    // serde_wasm_bindgen expects a plain JS value reconstructed from JSON,
    // not a TypeScript object reference. Passing through JSON ensures correct
    // JsValue deserialization on the Rust side.
    const jsValue = JSON.parse(JSON.stringify(input));
    const result = mod.calculate(jsValue) as DamageOutput;
    return result;
  } catch (e) {
    console.error(
      "[damage-calc] WASM calculate threw:",
      e,
      "\nInput:",
      JSON.stringify(input, null, 2),
    );
    throw e;
  }
}

/**
 * Preload the engine (e.g. on route mount) so the first user-triggered
 * calculation does not pay the wasm-instantiation cost.
 */
export function preloadDamageEngine(): void {
  void load();
}
