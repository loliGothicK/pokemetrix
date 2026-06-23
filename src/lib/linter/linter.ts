import { TrainedPokemon } from "@/store/team/team";
import { MitamaError } from "@/errors/anyhow/error";
import { checkSuboptimalEVs } from "@/lib/linter/rules/status/suboptimalEvs";
import { Option } from "fp-ts/Option";
import { option } from "fp-ts";
import { transposeArray } from "@/cats/syntax/Validated";
import { pipe } from "fp-ts/function";
import { checkRemainingEVs } from "@/lib/linter/rules/status/remainigEvs";
import { checkWrongMegaStone } from "@/lib/linter/rules/item/wrongMegaStone";
import { checkNoItem } from "@/lib/linter/rules/item/noItem";

export type LintIssue = {
  target: "status" | "item" | "moves";
  severity: "error" | "warning";
  source: MitamaError;
};

export type LintResult = {
  status: LintIssue[];
  item: LintIssue[];
  moves: LintIssue[];
};

const intoIssue =
  (settings: Omit<LintIssue, "source">) =>
  (source: MitamaError): LintIssue => {
    return {
      ...settings,
      source,
    };
  };

const lint =
  (target: "status" | "item" | "moves") =>
  (rules: {
    warnings?: ((member: TrainedPokemon) => Option<MitamaError>)[];
    errors?: ((member: TrainedPokemon) => Option<MitamaError>)[];
  }) =>
  (member: TrainedPokemon | null): LintIssue[] => {
    if (!member) {
      return [];
    }

    const warnings = pipe(
      rules?.warnings,
      option.fromNullable,
      option.flatMap((rules) =>
        pipe(
          rules.map((rule) =>
            pipe(
              rule(member),
              option.map(
                intoIssue({
                  target,
                  severity: "warning",
                }),
              ),
            ),
          ),
          transposeArray,
        ),
      ),
    );

    const errors = pipe(
      rules?.errors,
      option.fromNullable,
      option.flatMap((rules) =>
        pipe(
          rules.map((rule) =>
            pipe(
              rule(member),
              option.map(
                intoIssue({
                  target,
                  severity: "warning",
                }),
              ),
            ),
          ),
          transposeArray,
        ),
      ),
    );

    return pipe(
      transposeArray([warnings, errors]),
      option.map((issues) => issues.flat()),
      option.getOrElse<LintIssue[]>(() => []),
    );
  };

export const linter = (member: TrainedPokemon | null): LintResult => {
  return {
    status: lint("status")({
      warnings: [checkSuboptimalEVs],
      errors: [checkRemainingEVs],
    })(member),
    item: lint("item")({
      warnings: [checkWrongMegaStone, checkNoItem],
      errors: [],
    })(member),
    moves: lint("moves")({
      warnings: [],
      errors: [],
    })(member),
  };
};
