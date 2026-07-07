/**
 * OpenTelemetry カスタムスパンユーティリティ
 *
 * @sentry/nextjs v10 は OTel を内部で自動セットアップするため、
 * このヘルパーは Sentry.startSpan をラップして一貫したインターフェースを提供する。
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/opentelemetry/using-opentelemetry-apis/
 * @see .design/otel.md
 */

import * as Sentry from "@sentry/nextjs";
import type { Span, SpanAttributes } from "@sentry/core";
import { trace } from "@opentelemetry/api";

/** スパン名の命名規則: "<domain>.<operation>" */
export type SpanName = `${string}.${string}`;

export interface SpanOptions {
  /** スパンのカテゴリ (OTel の op に対応) */
  op?: string;
  /** スパンに付与する属性 */
  attributes?: SpanAttributes;
}

/**
 * コールバックをアクティブスパンでラップし、終了後に自動でスパンを閉じる。
 *
 * @example
 * const result = await withSpan("pokemon.fetch-battle-records", async (span) => {
 *   span.setAttribute("pokemon.name", name);
 *   return fetchRecords(name);
 * });
 */
export function withSpan<T>(name: SpanName, callback: (span: Span) => T, options?: SpanOptions): T {
  return Sentry.startSpan(
    {
      name,
      op: options?.op,
      attributes: options?.attributes,
    },
    callback,
  );
}

/**
 * 親スパンが存在する場合のみスパンを開始する。
 * トレースが有効でないリクエストではスパンを作成しない。
 *
 * @example
 * const result = await withChildSpan("battle.calculate-stats", async (span) => {
 *   span.setAttribute("battle.format", format);
 *   return calculateStats(battle);
 * });
 */
export function withChildSpan<T>(
  name: SpanName,
  callback: (span: Span) => T,
  options?: SpanOptions,
): T {
  return Sentry.startSpan(
    {
      name,
      op: options?.op,
      attributes: options?.attributes,
      onlyIfParent: true,
    },
    callback,
  );
}

/**
 * Sentry が管理するトレーサーを取得する。
 * ネイティブの OTel API が必要な場合に使用する。
 *
 * @example
 * const tracer = getTracer();
 * tracer.startActiveSpan("my.span", (span) => { ... });
 */
export function getTracer() {
  return trace.getTracer("pokemetrix");
}
