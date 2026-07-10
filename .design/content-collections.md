# Content Collections (Docs / Blog) — Design Document

## 概要

`content-collections` を使い、MDX で書いた記事を静的に型安全に扱う仕組みを構築する。
`apps/web` 内に Docs（ドキュメント）と Blog（お知らせ・更新情報）の2コレクションを用意し、
それぞれ一覧ページと詳細ページを Next.js App Router に追加する。

## 採用ライブラリ

| パッケージ | 用途 |
|---|---|
| `@content-collections/core` | コレクション定義・スキーマ検証（zod） |
| `@content-collections/mdx` | MDX を JS にコンパイル（`compileMDX`） |
| `@content-collections/next` | `next.config.ts` に `withContentCollections` を適用しビルド時に生成物を作る |

生成物は `.content-collections/generated`（gitignore 済み）に出力され、
`tsconfig.json` の `paths` で `content-collections` として import できる。

```json
"paths": {
  "content-collections": ["./.content-collections/generated"]
}
```

## ディレクトリ構成

```
apps/web/
├── content/
│   ├── blog/
│   │   └── *.mdx          # ブログ記事
│   └── docs/
│       └── *.mdx          # ドキュメント記事
├── content-collections.ts # コレクション定義（posts, docs）
└── app/
    ├── blog/
    │   ├── page.tsx        # 一覧
    │   └── [slug]/page.tsx # 詳細
    └── docs/
        ├── page.tsx        # 一覧
        └── [slug]/page.tsx # 詳細
```

## コレクション定義

### posts（Blog）

`content/blog/*.mdx` を対象。

| フィールド | 型 | 説明 |
|---|---|---|
| title | string | 記事タイトル |
| description | string | 一覧・OGP用の要約 |
| date | date | 公開日（一覧のソートに使用） |
| tags | string[] | タグ（デフォルト `[]`） |
| draft | boolean | 下書きフラグ（デフォルト `false`、一覧・詳細から除外） |

### docs（Docs）

`content/docs/*.mdx` を対象。

| フィールド | 型 | 説明 |
|---|---|---|
| title | string | ページタイトル |
| description | string? | 概要（任意） |
| order | number | 一覧の並び順（デフォルト `0`、昇順） |

両コレクションとも `transform` で `compileMDX` を実行し、`mdx`（コンパイル済みコード文字列）と
`slug`（`document._meta.path` = ファイル名から拡張子を除いたもの）を出力に追加する。

## レンダリング

`@content-collections/mdx/react` の `MDXContent` を使う。この実装は React Server Component からも
呼び出し可能（`new Function` で code 文字列を評価するだけで hooks 等を使わないため）。
そのため一覧・詳細ページはどちらもサーバーコンポーネントとして実装し、`"use client"` は不要。

```tsx
import { MDXContent } from "@content-collections/mdx/react";

<MDXContent code={post.mdx} />
```

## ルーティング

- `/blog` — `date` の降順で一覧表示。`draft: true` の記事は非表示。
- `/blog/[slug]` — `generateStaticParams` で `allPosts` から静的パスを生成。存在しない slug は `notFound()`。
- `/docs` — `order` の昇順で一覧表示。
- `/docs/[slug]` — `/blog/[slug]` と同様。

## ナビゲーション

Docs / Blog はチームビルダー・対戦・統計といったツール群とは性質が異なる「サイト情報」であるため、
サイドメニュー（`AppLayout` の `sideMenuGroups`）には配置しない。
代わりに `Footer`（About / Privacy Policy などの静的ページリンクと同じ並び）に配置する。
`navigation.items.docs` / `navigation.items.blog` の翻訳キーを `en` / `ja` の `translation.json` に用意し、
Footer から `useTranslation` で参照する。

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-11 | 初版。posts（Blog）/ docs（Docs）コレクションの追加、一覧・詳細ページ実装 |
| 2026-07-11 | Docs/Blog をサイドメニューの `content` グループから Footer に移動。ツール群と混在させない |
