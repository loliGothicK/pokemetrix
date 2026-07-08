import { useQuery } from "@tanstack/react-query";
import { calculate } from "@/lib/damage";
import { analyze } from "@/lib/damage";
import type { DamageInput, DamageOutput, DamageAnalysis } from "@/lib/damage";

export const DAMAGE_QUERY_KEY = "damage-calc";

export type UseDamageCalcResult = {
  output: DamageOutput | undefined;
  analysis: DamageAnalysis | undefined;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Run a damage calculation in the WASM engine. Results are cached by input via
 * React Query, so identical scenarios are computed once.
 *
 * @param input   Fully-resolved damage input (see the modifier resolution layer).
 * @param maxHp   Defender's max HP; when provided, percentages and KO info are derived.
 * @param enabled Set false to defer the calculation (e.g. incomplete form).
 */
export const useDamageCalc = (
  input: DamageInput | null,
  maxHp?: number,
  enabled = true,
): UseDamageCalcResult => {
  const query = useQuery({
    queryKey: [DAMAGE_QUERY_KEY, input],
    queryFn: () => calculate(input as DamageInput),
    enabled: enabled && input !== null,
    staleTime: Infinity,
  });

  const output = query.data;
  const analysis = output && maxHp !== undefined ? analyze(output, maxHp) : undefined;

  return {
    output,
    analysis,
    isLoading: input !== null && enabled ? query.isLoading : false,
    isError: query.isError,
  };
};
