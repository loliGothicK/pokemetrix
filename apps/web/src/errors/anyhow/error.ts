import { Either, left } from "fp-ts/Either";
import { Validated } from "@/cats/data/Validated";
import { pipe } from "fp-ts/function";
import { either } from "fp-ts";

export abstract class MitamaError extends Error {
  abstract readonly _tag: string;

  protected constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toString(_depth = 0): string {
    return `error[${this._tag}]: ${this.message}`;
  }
}

class AnyhowError extends MitamaError {
  readonly _tag = "anyhow";

  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message, cause);
  }

  public toString(depth = 0): string {
    const indent = "  ".repeat(depth);
    const prefix = depth > 0 ? "cause: " : "";
    let result = `${indent}${prefix}error[${this._tag}]: ${this.message}`;

    if (this.cause) {
      if (this.cause instanceof MitamaError) {
        // MitamaErrorが続く場合は深度を深めて再帰呼び出し
        result += `\n${this.cause.toString(depth + 1)}`;
      } else {
        // 標準のエラーの場合はそのままインデントして表示
        result += `\n${indent}  cause: ${this.cause.message}`;
      }
    }
    return result;
  }
}

export type Result<T> = Either<MitamaError, T>;
export type ValidateResult<T> = Validated<MitamaError, T>;

export const anyhow = (message: string, cause?: Error): MitamaError => {
  return new AnyhowError(message, cause);
};

export const bail = <T = never>(message: string, cause?: Error) => {
  return left<MitamaError, T>(new AnyhowError(message, cause));
};

export const withContext =
  <T = never>(message: string) =>
  (res: Either<MitamaError, T>) => {
    return pipe(
      res,
      either.mapLeft((err) => anyhow(message, err)),
    );
  };
