import { MitamaError } from "@/errors/anyhow/error";

// #[thiserror]
export class LintError extends MitamaError {
  readonly _tag = "lint.error";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

// #[thiserror]
export class LintWarning extends MitamaError {
  readonly _tag = "lint.warning";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const lintError = (text: string, cause?: MitamaError) => new LintError(text, cause);
export const lintWarning = (text: string, cause?: MitamaError) => new LintWarning(text, cause);

export class SuboptimalEvs extends MitamaError {
  readonly _tag = "lint.warning.suboptimalEvs";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const suboptimalEvs = (text: string, cause?: MitamaError) => new SuboptimalEvs(text, cause);

export class RemainingEvs extends MitamaError {
  readonly _tag = "lint.warning.remainingEvs";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const remainingEvs = (text: string, cause?: MitamaError) => new RemainingEvs(text, cause);

export class WrongMegaStone extends MitamaError {
  readonly _tag = "lint.warning.wrongMegaStone";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const wrongMegaStone = (text: string, cause?: MitamaError) =>
  new WrongMegaStone(text, cause);

export class NoItem extends MitamaError {
  readonly _tag = "lint.warning.noItem";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const noItem = (text: string, cause?: MitamaError) => new NoItem(text, cause);
