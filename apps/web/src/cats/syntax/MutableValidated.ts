import { type Either, isLeft } from "fp-ts/lib/Either";
import { either, option } from "fp-ts";
import { isSome, type Option } from "fp-ts/lib/Option";
import { of } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";

export const iter = <T>(a: Option<T>) =>
  pipe(
    a,
    option.map(of),
    option.getOrElse((): T[] => []),
  );

export type Flatten<T> = T extends unknown[] ? T : T[];

export const separator = <E, T>(seq: Either<E, T>[]): Either<Flatten<E>, Flatten<T>> => {
  const left = seq.filter(isLeft).map((l) => l.left);
  const right = seq.filter(either.isRight).map((r) => r.right);
  return left.length === 0
    ? either.right(right.flat() as Flatten<T>)
    : either.left(left.flat() as Flatten<E>);
};

export function transposeArray<T>(seq: Option<T>[]): Option<T[]> {
  const some = seq.filter(isSome);
  return some.length === 0 ? option.none : option.of(some.map((s) => s.value));
}
