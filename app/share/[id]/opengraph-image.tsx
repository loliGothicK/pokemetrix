import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { sharedTeams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import enTranslation from "@locales/en/translation.json";

// ── メタデータ ────────────────────────────────────────────────────────────────

export const alt = "Pokemetrix Team Share";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ── 定数 ─────────────────────────────────────────────────────────────────────

// 原神っぽいダーク背景パレット
const BG_DARK = "#050816";
const CARD_BG = "rgba(13,20,39,0.95)";
const ACCENT = "#3b82f6"; // blue-500
const ACCENT_GLOW = "rgba(59,130,246,0.25)";
const EDGE = "rgba(148,163,184,0.18)";
const TEXT_PRIMARY = "#e5eefb";
const TEXT_SECONDARY = "#94a3b8";
const EMPTY_BG = "rgba(148,163,184,0.06)";

// タイプカラーマップ（大まかな代表色）

// ── ヘルパー ──────────────────────────────────────────────────────────────────

async function loadPokemonImage(identifier: string): Promise<string | null> {
  try {
    const data = await readFile(join(process.cwd(), "public", "pokemon", `${identifier}.png`));
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

function getPokemonName(identifier: string): string {
  const key = identifier as keyof typeof enTranslation.pokemon;
  return enTranslation.pokemon[key]?.name ?? identifier;
}

// ── Image 生成 ────────────────────────────────────────────────────────────────

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await db.select().from(sharedTeams).where(eq(sharedTeams.id, id)).limit(1);

  const row = rows[0];
  if (!row) {
    // Not found — シンプルなエラー画像を返す
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG_DARK,
        }}
      >
        <span style={{ color: TEXT_SECONDARY, fontSize: 40 }}>Team not found</span>
      </div>,
      size,
    );
  }

  const { snapshot } = row;

  // ポケモン画像を並行読み込み（最大 6 枠）
  const slots = snapshot.members.slice(0, 6);
  const images = await Promise.all(
    slots.map((m) => (m ? loadPokemonImage(m.identifier) : Promise.resolve(null))),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `radial-gradient(circle at 15% 20%, ${ACCENT_GLOW}, transparent 45%),
                       radial-gradient(circle at 85% 80%, rgba(45,212,191,0.15), transparent 45%),
                       linear-gradient(160deg, #0b1220 0%, ${BG_DARK} 100%)`,
        fontFamily: "sans-serif",
        padding: "40px 48px",
      }}
    >
      {/* ── ヘッダー ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        {/* チーム名 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 13,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: ACCENT,
              fontWeight: 700,
            }}
          >
            POKEMETRIX · TEAM SHARE
          </span>
          <span
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              maxWidth: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {snapshot.teamName}
          </span>
        </div>

        {/* メンバー数バッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `rgba(59,130,246,0.15)`,
            border: `1px solid ${ACCENT}`,
            borderRadius: 12,
            padding: "8px 20px",
            color: ACCENT,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {slots.filter(Boolean).length} / 6
        </div>
      </div>

      {/* ── 仕切り線 ─────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          height: 1,
          background: `linear-gradient(90deg, ${ACCENT}60 0%, ${EDGE} 60%, transparent 100%)`,
          marginBottom: 32,
        }}
      />

      {/* ── ポケモンカードグリッド (3×2) ─────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flex: 1,
        }}
      >
        {slots.map((member, i) => {
          const imgSrc = images[i];

          if (!member || !imgSrc) {
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: EMPTY_BG,
                  border: `1px dashed ${EDGE}`,
                  borderRadius: 16,
                }}
              >
                <span style={{ color: EDGE, fontSize: 28 }}>—</span>
              </div>
            );
          }

          const name = getPokemonName(member.identifier);

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: CARD_BG,
                border: `1px solid ${EDGE}`,
                borderRadius: 16,
                padding: "12px 8px 10px",
                gap: 8,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* グロウ背景 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background: `radial-gradient(ellipse at 50% 0%, ${ACCENT_GLOW}, transparent 70%)`,
                }}
              />

              {/* ポケモン画像 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={name}
                width={96}
                height={96}
                style={{ objectFit: "contain", imageRendering: "pixelated" }}
              />

              {/* 名前 */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  textAlign: "center",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "90%",
                }}
              >
                {name}
              </span>

              {/* 持ち物がある場合はドット表示 */}
              {member.item != null && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: ACCENT,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>,
    size,
  );
}
