# @pokemetrix/damage-calc

Pokémon damage calculator compiled to WebAssembly via Rust.

## インストール

```bash
pnpm add @pokemetrix/damage-calc
```

## API の使い方とインポート方法

このパッケージは WebAssembly (Wasm) モジュールとしてビルドされています。提供される API は以下の通りです。

```typescript
import {
  Type,
  calculate,
  init,
  is_immune,
  type_effectiveness_shift
} from '@pokemetrix/damage-calc';

// タイプの相性をチェック
const isImmune = is_immune(Type.Electric, Type.Ground); // true

// タイプ相性シフトの計算
const effectiveness = type_effectiveness_shift(Type.Water, Type.Fire, Type.Rock); // 2 (4倍弱点)

// ダメージ計算（引数の形式はRust実装のデシリアライズスキーマに依存します）
const result = calculate({
  attacker: { /* ... */ },
  defender: { /* ... */ },
  move: { /* ... */ }
});
```

### エクスポートされている主なAPI

- `Type` (enum): ポケモンのタイプ（`Normal`=0, `Fire`=1, `Water`=2 など。18種類+`Stellar`）
- `calculate(input: any): any`: メインのダメージ計算関数。入力・出力ともに JSON 互換のオブジェクトを使用します。
- `is_immune(att: Type, def1: Type, def2?: Type | null): boolean`: 攻撃側のタイプが防御側のタイプに対して無効化されるかどうかを返します。
- `type_effectiveness_shift(att: Type, def1: Type, def2?: Type | null): number`: タイプ相性のシフト値を返します（例: `1`なら効果抜群で2倍、`-1`なら今ひとつで0.5倍）。
- `init()`: WebAssembly の初期化関数。

## Next.js での利用方法

Next.js (Webpack 5) 環境でこの Wasm パッケージを使用するには、`next.config.ts` で `asyncWebAssembly` を有効化する必要があります。

### 1. `next.config.ts` の設定

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true, // Wasm の非同期読み込みを有効化
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
```

### 2. コンポーネントや API ルートでの呼び出し

`asyncWebAssembly` が有効化されている場合、Server Components (App Router) や API Routes で通常の TypeScript モジュールと全く同じように `import` して使用できます。Webpack が自動的に Wasm モジュールを非同期境界として処理します。

```typescript
// app/api/damage/route.ts
import { NextResponse } from 'next/server';
import { calculate, Type, is_immune } from '@pokemetrix/damage-calc';

export async function POST(request: Request) {
  const body = await request.json();

  // Wasm 経由での同期的な関数呼び出しが可能です
  const immune = is_immune(Type.Electric, Type.Ground);
  const result = calculate(body);

  return NextResponse.json({ result, immune });
}
```

#### 注意点 (Client Components)
Client Components 内で直接 import して使用すると、Wasm の初期化タイミングによりエラーになる場合があります。Client Components で使用する場合は以下のいずれかのアプローチを推奨します。

1. **Server Component で計算する**: Wasm の呼び出しは Server Component 側で行い、結果だけを Props として Client に渡す。
2. **動的インポートを利用する**: イベントハンドラ等で必要なタイミングに動的 `import('@pokemetrix/damage-calc')` を使用して読み込む。
