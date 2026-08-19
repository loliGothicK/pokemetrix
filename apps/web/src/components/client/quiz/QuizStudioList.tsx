"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PatchDiff, File as DiffsFile, EditProvider } from "@pierre/diffs/react";
import { Editor } from "@pierre/diffs/edit";
import type { FileContents } from "@pierre/diffs";
import i18next from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import enTranslation from "@locales/en/translation.json";
import jaTranslation from "@locales/ja/translation.json";
import { QuizApp } from "./QuizApp";
import type { QuizQuestion } from "@/types/quiz";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitLogEntry {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
}

export interface QuizFileMetadata {
  filePath: string;
  fileContent: string | null;
  patch: string | null;
  gitLog: GitLogEntry[];
  isReadOnly?: boolean;
}

export interface QuizGroup {
  ja?: QuizQuestion;
  en?: QuizQuestion;
}

interface FileTreeNode {
  name: string;
  fullPath: string;
  children: Record<string, FileTreeNode>;
  quizzes?: QuizGroup;
}

type EditorTab = "source" | "preview";

// ─── Localized Preview Wrapper ────────────────────────────────────────────────

/**
 * Wraps QuizApp with a locale-specific i18n instance so that the Studio
 * preview always shows UI strings in the correct language, independent of
 * the app's global i18next language setting.
 */
function LocalizedQuizPreview({
  locale,
  questions,
  onReturnToMenu,
}: {
  locale: string;
  questions: QuizQuestion[];
  onReturnToMenu: () => void;
}) {
  const localI18n = useMemo(() => {
    const instance = i18next.createInstance();
    void instance.use(initReactI18next).init({
      resources: {
        en: { translation: enTranslation },
        ja: { translation: jaTranslation },
      },
      lng: locale,
      fallbackLng: "en",
      returnEmptyString: true,
      interpolation: { escapeValue: false },
    });
    return instance;
  }, [locale]);

  return (
    <I18nextProvider i18n={localI18n}>
      <QuizApp initialQuestions={questions} directPlay={true} onReturnToMenu={onReturnToMenu} />
    </I18nextProvider>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildFileTree(quizzes: QuizQuestion[]): FileTreeNode {
  const root: FileTreeNode = { name: "", fullPath: "", children: {} };
  for (const quiz of quizzes) {
    const parts = [quiz.difficulty, quiz.category, quiz.id];
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          fullPath: parts.slice(0, i + 1).join("/"),
          children: {},
          quizzes: i === parts.length - 1 ? {} : undefined,
        };
      }
      node = node.children[part];
    }
    if (node.quizzes && (quiz.locale === "ja" || quiz.locale === "en")) {
      node.quizzes[quiz.locale] = quiz;
    }
  }
  return root;
}

/** Flatten all leaf groups in tree order for keyboard navigation */
function flattenLeaves(node: FileTreeNode): QuizGroup[] {
  const results: QuizGroup[] = [];
  if (node.quizzes) {
    results.push(node.quizzes);
  }
  for (const child of Object.values(node.children)) {
    results.push(...flattenLeaves(child));
  }
  return results;
}

function groupKey(g: QuizGroup) {
  const q = g.ja || g.en;
  return q ? q.id : "";
}

function quizToFilePath(q: QuizQuestion): string {
  return `apps/web/content/quiz/${q.locale}/${q.difficulty}/${q.category}/${q.id}.mdx`;
}

function difficultyColor(d: string) {
  switch (d) {
    case "master":
      return "#a855f7";
    case "expert":
      return "#f59e0b";
    case "advanced":
      return "#3b82f6";
    default:
      return "#6b7280";
  }
}

function formatColor(f: string) {
  switch (f) {
    case "tsume_action":
      return "#ef4444";
    case "multi_select":
      return "#8b5cf6";
    case "ordering":
      return "#06b6d4";
    case "grouping":
      return "#10b981";
    case "one_way":
      return "#f97316";
    default:
      return "#6b7280";
  }
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

function quizKey(q: QuizQuestion) {
  return `${q.locale}/${q.id}`;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const S = {
  bg: "#0d1117",
  bgPanel: "#161b22",
  border: "#21262d",
  borderLight: "#30363d",
  fg: "#e6edf3",
  fgMuted: "#7d8590",
  fgDim: "#484f58",
  accent: "#3b82f6",
  accentGreen: "#238636",
  accentGreenHover: "#2ea043",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Fira Code', 'Cascadia Code', Consolas, monospace",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  selectedGroup,
  onSelect,
  searchTerm,
  filterNeedsReview,
  expandedPaths,
  onToggle,
  localReviewedMap,
}: {
  node: FileTreeNode;
  depth: number;
  selectedGroup: QuizGroup | null;
  onSelect: (g: QuizGroup) => void;
  searchTerm: string;
  filterNeedsReview: boolean;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  localReviewedMap: Record<string, boolean>;
}) {
  const isLeaf = !!node.quizzes;
  const isSelected = isLeaf && selectedGroup && groupKey(selectedGroup) === groupKey(node.quizzes!);

  const qGroup = node.quizzes;
  let nodeNeedsReview = false;
  let allReviewed = false;
  if (qGroup) {
    const hasJa = !!qGroup.ja;
    const hasEn = !!qGroup.en;
    const jaPath = qGroup.ja ? quizToFilePath(qGroup.ja) : "";
    const enPath = qGroup.en ? quizToFilePath(qGroup.en) : "";
    const jaRev =
      jaPath && localReviewedMap[jaPath] !== undefined
        ? localReviewedMap[jaPath]
        : (qGroup.ja?.reviewed ?? false);
    const enRev =
      enPath && localReviewedMap[enPath] !== undefined
        ? localReviewedMap[enPath]
        : (qGroup.en?.reviewed ?? false);
    nodeNeedsReview = (hasJa && !jaRev) || (hasEn && !enRev);
    allReviewed = (hasJa ? jaRev : true) && (hasEn ? enRev : true) && (hasJa || hasEn);
  }

  const matchesSearch = useCallback(
    function matchesSearch(n: FileTreeNode): boolean {
      if (n.quizzes) {
        const qJa = n.quizzes.ja;
        const qEn = n.quizzes.en;
        const jaPath = qJa ? quizToFilePath(qJa) : "";
        const enPath = qEn ? quizToFilePath(qEn) : "";
        const revJa =
          jaPath && localReviewedMap[jaPath] !== undefined
            ? localReviewedMap[jaPath]
            : (qJa?.reviewed ?? false);
        const revEn =
          enPath && localReviewedMap[enPath] !== undefined
            ? localReviewedMap[enPath]
            : (qEn?.reviewed ?? false);
        const needsRev = (qJa && !revJa) || (qEn && !revEn);

        if (filterNeedsReview && !needsRev) return false;

        const q = qJa || qEn;
        if (!searchTerm) return true;
        return (
          !!q &&
          (n.name.toLowerCase().includes(searchTerm) ||
            q.question.toLowerCase().includes(searchTerm))
        );
      }
      return Object.values(n.children).some(matchesSearch);
    },
    [searchTerm, filterNeedsReview, localReviewedMap],
  );

  if ((searchTerm || filterNeedsReview) && !matchesSearch(node)) return null;

  if (isLeaf) {
    const q = (node.quizzes!.ja || node.quizzes!.en)!;
    return (
      <button
        data-quiz-key={groupKey(node.quizzes!)}
        onClick={() => onSelect(node.quizzes!)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
          background: isSelected ? "rgba(59,130,246,0.15)" : "transparent",
          border: "none",
          borderLeft: isSelected ? `2px solid ${S.accent}` : "2px solid transparent",
          cursor: "pointer",
          padding: `3px 8px 3px ${depth * 16 + 8}px`,
          fontSize: 12,
          color: isSelected ? "#60a5fa" : "#d1d5db",
          borderRadius: 0,
          transition: "background 0.1s",
          fontFamily: S.font,
        }}
      >
        <span style={{ color: S.fgMuted, flexShrink: 0, fontSize: 11 }}>
          {allReviewed ? "✅" : nodeNeedsReview ? "📝" : "📄"}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
        <span
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            fontSize: 9,
            padding: "1px 4px",
            borderRadius: 3,
            background: formatColor(q.format) + "22",
            color: formatColor(q.format),
          }}
        >
          {q.format.replace("_", " ")}
        </span>
      </button>
    );
  }

  const isDifficulty = ["basics", "advanced", "expert", "master"].includes(node.name);
  const isLocale = ["ja", "en"].includes(node.name);
  const open = expandedPaths.has(node.fullPath);

  const getVisibleLeafCount = (n: FileTreeNode): number => {
    if (n.quizzes) return matchesSearch(n) ? 1 : 0;
    return Object.values(n.children).reduce((acc, child) => acc + getVisibleLeafCount(child), 0);
  };
  const childCount = getVisibleLeafCount(node);

  return (
    <div>
      <button
        onClick={() => onToggle(node.fullPath)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: `3px 8px 3px ${depth * 16 + 8}px`,
          fontSize: 12,
          color: "#9ca3af",
          borderRadius: 0,
          fontFamily: S.font,
        }}
      >
        <span style={{ flexShrink: 0, fontSize: 10 }}>{open ? "▾" : "▸"}</span>
        <span style={{ flexShrink: 0, fontSize: 11 }}>
          {isLocale ? "🌐" : isDifficulty ? "🏆" : "📁"}
        </span>
        <span style={{ fontWeight: isDifficulty ? 600 : 400 }}>{node.name}</span>
        <span
          style={{
            fontSize: 9,
            padding: "1px 4px",
            borderRadius: 3,
            background: difficultyColor(node.name) + "22",
            color: difficultyColor(node.name),
            marginLeft: 4,
          }}
        >
          {childCount}
        </span>
      </button>
      {open && (
        <div>
          {Object.values(node.children).map((child) => (
            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selectedGroup={selectedGroup}
              onSelect={onSelect}
              searchTerm={searchTerm}
              filterNeedsReview={filterNeedsReview}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              localReviewedMap={localReviewedMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GitLogPanel({ entries }: { entries: GitLogEntry[] }) {
  if (!entries.length) return null;
  return (
    <div style={{ borderTop: `1px solid ${S.border}`, padding: "12px 16px", background: S.bg }}>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          color: S.fgMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
          fontFamily: S.font,
        }}
      >
        Commit history
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map((e) => (
          <div
            key={e.hash}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              fontFamily: S.font,
            }}
          >
            <code
              style={{
                background: S.bgPanel,
                border: `1px solid ${S.borderLight}`,
                borderRadius: 4,
                padding: "1px 6px",
                color: S.fgMuted,
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              {e.shortHash}
            </code>
            <span
              style={{
                color: "#c9d1d9",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {e.subject}
            </span>
            <span style={{ color: S.fgMuted, flexShrink: 0, fontSize: 11 }}>{e.author}</span>
            <span style={{ color: S.fgDim, flexShrink: 0, fontSize: 11 }}>{timeAgo(e.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcePane({
  quiz,
  onSaved,
}: {
  quiz: QuizQuestion;
  onSaved?: (filePath: string, reviewed: boolean) => void;
}) {
  const [meta, setMeta] = useState<QuizFileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const filePath = quizToFilePath(quiz);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setMeta(null);
    setLoading(true);
    setError(null);
    setShowRaw(false);
    setEditedContent(null);

    fetch(`/api/quiz-studio?file=${encodeURIComponent(filePath)}`)
      .then((r) => r.json())
      .then((data) => {
        setMeta(data);
        setLoading(false);
        setShowRaw(!data.patch);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [filePath]);

  const hasPatch = !!meta?.patch;

  const handleSave = async () => {
    if (!editedContent) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quiz-studio?file=${encodeURIComponent(filePath)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });
      if (res.ok) {
        const { reviewed } = await res.json();
        setEditedContent(null);
        if (onSaved) onSaved(filePath, reviewed);
        // Refresh meta and hot-reload Server Components (allQuizzes)
        const data = await (
          await fetch(`/api/quiz-studio?file=${encodeURIComponent(filePath)}`)
        ).json();
        setMeta(data);
        setShowRaw(!data.patch);
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error || "Save failed");
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Diff/File sub-header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          height: 34,
          background: S.bgPanel,
          borderBottom: `1px solid ${S.border}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: S.fgMuted,
            fontFamily: S.mono,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filePath}
        </span>
        <div style={{ flex: 1 }} />
        {!meta?.isReadOnly && editedContent !== null && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 12px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
        {hasPatch && (
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {(["Diff", "File"] as const).map((label) => {
              const active = label === "Diff" ? !showRaw : showRaw;
              return (
                <button
                  key={label}
                  onClick={() => setShowRaw(label === "File")}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: `1px solid ${S.borderLight}`,
                    background: active ? "#21262d" : "transparent",
                    color: active ? S.fg : S.fgMuted,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          background: S.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: S.fgMuted,
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        )}
        {error && <div style={{ padding: 16, color: "#f85149", fontSize: 12 }}>{error}</div>}
        {!loading && meta && (
          <div
            className="diff-editor-container"
            style={
              {
                "--diffs-dark-bg": S.bg,
                "--diffs-light-bg": S.bg,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              } as React.CSSProperties
            }
            onKeyDown={(e) => e.stopPropagation()}
          >
            {!showRaw && hasPatch ? (
              <EditProvider
                createEditor={(opts) =>
                  new Editor({ ...opts, onChange: (f) => setEditedContent(f.contents) })
                }
              >
                <PatchDiff
                  patch={meta.patch!}
                  options={{ diffStyle: "unified", overflow: "wrap" }}
                  edit={true}
                  style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}
                />
              </EditProvider>
            ) : meta.fileContent ? (
              <EditProvider
                createEditor={(opts) =>
                  new Editor({ ...opts, onChange: (f) => setEditedContent(f.contents) })
                }
              >
                <DiffsFile
                  file={
                    {
                      name: meta.filePath.split("/").pop() ?? "file.mdx",
                      contents: meta.fileContent,
                    } satisfies FileContents
                  }
                  options={{ overflow: "wrap" }}
                  edit={true}
                  style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}
                />
              </EditProvider>
            ) : (
              <div style={{ padding: 16, color: S.fgMuted, fontSize: 12 }}>
                File not found on disk.
              </div>
            )}
          </div>
        )}
      </div>
      {!loading && meta && <GitLogPanel entries={meta.gitLog} />}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  icon,
  label,
  onClick,
  onClose,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  onClose?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        fontSize: 12,
        background: active ? S.bg : "transparent",
        color: active ? S.fg : S.fgMuted,
        border: "none",
        borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
        borderRight: `1px solid ${S.border}`,
        cursor: "pointer",
        fontFamily: S.font,
        whiteSpace: "nowrap",
        transition: "color 0.1s",
        position: "relative",
      }}
    >
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span>{label}</span>
      {onClose && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            marginLeft: 4,
            fontSize: 12,
            color: S.fgDim,
            cursor: "pointer",
            borderRadius: 3,
            width: 16,
            height: 16,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = S.fg;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = S.fgDim;
          }}
        >
          ×
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuizStudio({ allQuizzes }: { allQuizzes: QuizQuestion[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedQuizGroup, setSelectedQuizGroup] = useState<QuizGroup | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("source");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const initialNeedsReview = searchParams.get("needsReview") === "true";
  const [filterNeedsReview, setFilterNeedsReview] = useState(initialNeedsReview);

  const handleFilterNeedsReviewChange = (checked: boolean) => {
    setFilterNeedsReview(checked);
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("needsReview", "true");
    } else {
      params.delete("needsReview");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [localReviewedMap, setLocalReviewedMap] = useState<Record<string, boolean>>({});
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildFileTree(allQuizzes), [allQuizzes]);
  const flatGroups = useMemo(() => flattenLeaves(tree), [tree]);
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const [prevFilterNeedsReview, setPrevFilterNeedsReview] = useState(filterNeedsReview);
  const [prevLocalReviewedMap, setPrevLocalReviewedMap] = useState(localReviewedMap);

  if (
    selectedQuizGroup &&
    filterNeedsReview &&
    (prevFilterNeedsReview !== filterNeedsReview || prevLocalReviewedMap !== localReviewedMap)
  ) {
    if (prevFilterNeedsReview !== filterNeedsReview) setPrevFilterNeedsReview(filterNeedsReview);
    if (prevLocalReviewedMap !== localReviewedMap) setPrevLocalReviewedMap(localReviewedMap);

    const qJa = selectedQuizGroup.ja;
    const qEn = selectedQuizGroup.en;
    const jaPath = qJa ? quizToFilePath(qJa) : "";
    const enPath = qEn ? quizToFilePath(qEn) : "";

    const revJa =
      jaPath && localReviewedMap[jaPath] !== undefined
        ? localReviewedMap[jaPath]
        : (qJa?.reviewed ?? false);
    const revEn =
      enPath && localReviewedMap[enPath] !== undefined
        ? localReviewedMap[enPath]
        : (qEn?.reviewed ?? false);

    const needsRev = (qJa && !revJa) || (qEn && !revEn);

    if (!needsRev) {
      setSelectedQuizGroup(null);
    }
  }

  const openPreview = useCallback(() => {
    setPreviewOpen(true);
    setActiveTab("preview");
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setActiveTab("source");
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd+P → focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape → close preview tab or clear search
      if (e.key === "Escape") {
        if (previewOpen) {
          closePreview();
          return;
        }
        if (searchTerm) {
          setSearchTerm("");
          searchRef.current?.blur();
          return;
        }
      }

      // Don't navigate if focused on input or editor
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        target?.closest(".diff-editor-container") ||
        target?.closest("[data-code-view-id]") // @pierre/diffs uses code views
      ) {
        return;
      }

      // ↑/↓ navigate files
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "j" || e.key === "k") {
        e.preventDefault();
        if (!flatGroups.length) return;
        const currentIdx = selectedQuizGroup
          ? flatGroups.findIndex((g) => groupKey(g) === groupKey(selectedQuizGroup))
          : -1;
        let nextIdx: number;
        if (e.key === "ArrowDown" || e.key === "j") {
          nextIdx = currentIdx < flatGroups.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : flatGroups.length - 1;
        }
        const nextGroup = flatGroups[nextIdx];
        setSelectedQuizGroup(nextGroup);
        // Scroll into view
        const el = containerRef.current?.querySelector(`[data-quiz-key="${groupKey(nextGroup)}"]`);
        el?.scrollIntoView({ block: "nearest" });
        return;
      }

      // Ctrl/Cmd+Enter → open preview
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && selectedQuizGroup) {
        e.preventDefault();
        openPreview();
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedQuizGroup, flatGroups, previewOpen, closePreview, openPreview, searchTerm]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: S.bg,
        color: S.fg,
        fontFamily: S.font,
        overflow: "hidden",
      }}
    >
      {/* ── Title Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 16px",
          background: "#1c2128",
          borderBottom: `1px solid ${S.borderLight}`,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: S.fg }}>🎮 Quiz Studio</span>
        <span style={{ fontSize: 11, color: S.fgDim }}>{allQuizzes.length} files</span>
        {process.env.NODE_ENV !== "development" && (
          <span
            style={{
              fontSize: 11,
              color: "#d29922",
              background: "rgba(210,153,34,0.12)",
              border: "1px solid rgba(210,153,34,0.3)",
              borderRadius: 4,
              padding: "2px 8px",
              fontFamily: S.mono,
            }}
          >
            👁 Read-Only — editing is only available in local development
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <input
            ref={searchRef}
            placeholder="⌘P Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: S.bg,
              border: `1px solid ${S.borderLight}`,
              borderRadius: 6,
              padding: "4px 10px 4px 10px",
              color: S.fg,
              fontSize: 12,
              width: 220,
              outline: "none",
              fontFamily: S.font,
            }}
            onFocus={(e) => (e.target.style.borderColor = S.accent)}
            onBlur={(e) => (e.target.style.borderColor = S.borderLight)}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 10,
            color: S.fgDim,
            fontFamily: S.mono,
          }}
        >
          <span>↑↓ navigate</span>
          <span>⏎ play</span>
          <span>⎋ close</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Sidebar: File Tree ── */}
        <div
          style={{
            width: 260,
            minWidth: 180,
            flexShrink: 0,
            borderRight: `1px solid ${S.border}`,
            display: "flex",
            flexDirection: "column",
            background: S.bgPanel,
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: "8px 12px",
              fontSize: 11,
              color: S.fgMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              borderBottom: `1px solid ${S.border}`,
              userSelect: "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Explorer</span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                textTransform: "none",
                fontSize: 10,
              }}
            >
              <input
                type="checkbox"
                checked={filterNeedsReview}
                onChange={(e) => handleFilterNeedsReviewChange(e.target.checked)}
              />
              Needs Review
            </label>
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 4, paddingBottom: 8 }}>
            {Object.values(tree.children).map((child) => (
              <TreeNode
                key={child.fullPath}
                node={child}
                depth={0}
                selectedGroup={selectedQuizGroup}
                onSelect={(g) => {
                  setSelectedQuizGroup(g);
                  setActiveTab("source");
                }}
                searchTerm={normalizedSearch}
                filterNeedsReview={filterNeedsReview}
                expandedPaths={expandedPaths}
                onToggle={togglePath}
                localReviewedMap={localReviewedMap}
              />
            ))}
          </div>
        </div>

        {/* ── Editor Area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedQuizGroup ? (
            <>
              {/* ── Editor Tabs ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: S.bgPanel,
                  borderBottom: `1px solid ${S.border}`,
                  flexShrink: 0,
                  minHeight: 35,
                  width: "100%",
                }}
              >
                {/* Scrollable tabs container */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    flex: 1,
                    overflowX: "auto",
                    scrollbarWidth: "none", // hide scrollbar on Firefox
                  }}
                >
                  <TabButton
                    active={activeTab === "source"}
                    icon="📄"
                    label={`${groupKey(selectedQuizGroup)}.mdx`}
                    onClick={() => setActiveTab("source")}
                  />
                  {previewOpen && (
                    <TabButton
                      active={activeTab === "preview"}
                      icon="▶"
                      label="Preview"
                      onClick={() => setActiveTab("preview")}
                      onClose={closePreview}
                    />
                  )}
                </div>

                {/* Fixed Action buttons on the right */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  {activeTab === "source" && (
                    <button
                      onClick={openPreview}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: S.accentGreen,
                        border: `1px solid ${S.accentGreenHover}`,
                        borderRadius: 5,
                        color: "#fff",
                        cursor: "pointer",
                        margin: "4px 8px",
                        transition: "background 0.15s",
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = S.accentGreenHover)}
                      onMouseOut={(e) => (e.currentTarget.style.background = S.accentGreen)}
                    >
                      ▶ Play
                    </button>
                  )}
                </div>
              </div>

              {/* ── Breadcrumbs ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 12px",
                  background: S.bg,
                  borderBottom: `1px solid ${S.border}`,
                  flexShrink: 0,
                  fontSize: 12,
                  fontFamily: S.font,
                }}
              >
                {(() => {
                  const repQuiz = (selectedQuizGroup.ja || selectedQuizGroup.en)!;
                  return (
                    <>
                      {[repQuiz.difficulty, repQuiz.category, repQuiz.id + ".mdx"].map(
                        (part, i, arr) => (
                          <React.Fragment key={i}>
                            <span
                              style={{
                                color: i === arr.length - 1 ? S.fg : S.fgMuted,
                                fontWeight: i === arr.length - 1 ? 600 : 400,
                              }}
                            >
                              {part}
                            </span>
                            {i < arr.length - 1 && (
                              <span style={{ color: S.fgDim, fontSize: 10 }}>›</span>
                            )}
                          </React.Fragment>
                        ),
                      )}
                      <div style={{ flex: 1 }} />
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 10,
                          background: difficultyColor(repQuiz.difficulty) + "22",
                          color: difficultyColor(repQuiz.difficulty),
                        }}
                      >
                        {repQuiz.difficulty}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 10,
                          background: formatColor(repQuiz.format) + "22",
                          color: formatColor(repQuiz.format),
                        }}
                      >
                        {repQuiz.format}
                      </span>

                      <div
                        style={{ width: 1, height: 16, background: S.border, margin: "0 8px" }}
                      />

                      <select
                        style={{
                          background: S.bgPanel,
                          color: S.fg,
                          border: `1px solid ${S.border}`,
                          borderRadius: 4,
                          fontSize: 10,
                          padding: "2px 4px",
                          cursor: "pointer",
                        }}
                        value=""
                        disabled={process.env.NODE_ENV !== "development"}
                        onChange={async (e) => {
                          const newDiff = e.target.value;
                          if (!newDiff) return;
                          if (!confirm(`Move this quiz to ${newDiff}?`)) return;

                          const files = [];
                          if (selectedQuizGroup.ja)
                            files.push(quizToFilePath(selectedQuizGroup.ja));
                          if (selectedQuizGroup.en)
                            files.push(quizToFilePath(selectedQuizGroup.en));

                          try {
                            const res = await fetch("/api/quiz-studio", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "move",
                                newDifficulty: newDiff,
                                files,
                              }),
                            });
                            if (res.ok) {
                              setSelectedQuizGroup(null);
                              router.refresh();
                            } else {
                              const d = await res.json();
                              alert(d.error || "Move failed");
                            }
                          } catch (err) {
                            alert(String(err));
                          }
                        }}
                      >
                        <option value="">Move to...</option>
                        {["basics", "advanced", "expert", "master"]
                          .filter((d) => d !== repQuiz.difficulty)
                          .map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                      </select>

                      <button
                        disabled={process.env.NODE_ENV !== "development"}
                        style={{
                          background: "transparent",
                          color: process.env.NODE_ENV === "development" ? "#10b981" : S.fgDim,
                          border: `1px solid ${
                            process.env.NODE_ENV === "development" ? "#10b981" : S.border
                          }`,
                          borderRadius: 4,
                          fontSize: 10,
                          padding: "2px 6px",
                          cursor:
                            process.env.NODE_ENV === "development" ? "pointer" : "not-allowed",
                          marginLeft: 4,
                          opacity: process.env.NODE_ENV === "development" ? 1 : 0.4,
                        }}
                        onClick={async () => {
                          if (!confirm("Are you sure you want to approve this quiz?")) return;
                          const files: string[] = [];
                          if (selectedQuizGroup.ja)
                            files.push(quizToFilePath(selectedQuizGroup.ja));
                          if (selectedQuizGroup.en)
                            files.push(quizToFilePath(selectedQuizGroup.en));

                          try {
                            const res = await fetch("/api/quiz-studio", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "approve", files }),
                            });
                            if (res.ok) {
                              setLocalReviewedMap((p) => {
                                const next = { ...p };
                                files.forEach((f) => {
                                  next[f] = true;
                                });
                                return next;
                              });
                              router.refresh();
                            } else {
                              const d = await res.json();
                              alert(d.error || "Approve failed");
                            }
                          } catch (err) {
                            alert(String(err));
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        disabled={process.env.NODE_ENV !== "development"}
                        style={{
                          background: "transparent",
                          color: process.env.NODE_ENV === "development" ? "#f85149" : S.fgDim,
                          border: `1px solid ${
                            process.env.NODE_ENV === "development" ? "#f85149" : S.border
                          }`,
                          borderRadius: 4,
                          fontSize: 10,
                          padding: "2px 6px",
                          cursor:
                            process.env.NODE_ENV === "development" ? "pointer" : "not-allowed",
                          marginLeft: 4,
                          opacity: process.env.NODE_ENV === "development" ? 1 : 0.4,
                        }}
                        onClick={async () => {
                          if (
                            !confirm("Are you sure you want to delete this quiz (both languages)?")
                          )
                            return;
                          const files = [];
                          if (selectedQuizGroup.ja)
                            files.push(quizToFilePath(selectedQuizGroup.ja));
                          if (selectedQuizGroup.en)
                            files.push(quizToFilePath(selectedQuizGroup.en));

                          try {
                            const res = await fetch("/api/quiz-studio", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "delete", files }),
                            });
                            if (res.ok) {
                              setSelectedQuizGroup(null);
                              router.refresh();
                            } else {
                              const d = await res.json();
                              alert(d.error || "Delete failed");
                            }
                          } catch (err) {
                            alert(String(err));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* ── Question Banner ── */}
              <div
                style={{
                  display: "flex",
                  background: S.bg,
                  borderBottom: `1px solid ${S.border}`,
                  flexShrink: 0,
                }}
              >
                {selectedQuizGroup.ja && (
                  <div
                    style={{
                      flex: 1,
                      padding: "8px 14px",
                      borderRight: selectedQuizGroup.en ? `1px solid ${S.border}` : "none",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, color: "#c9d1d9", lineHeight: 1.5 }}>
                      <span
                        style={{ color: S.fgMuted, marginRight: 6, fontSize: 11, fontWeight: 600 }}
                      >
                        Q
                      </span>
                      {selectedQuizGroup.ja.question}
                    </p>
                  </div>
                )}
                {selectedQuizGroup.en && (
                  <div style={{ flex: 1, padding: "8px 14px" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#c9d1d9", lineHeight: 1.5 }}>
                      <span
                        style={{ color: S.fgMuted, marginRight: 6, fontSize: 11, fontWeight: 600 }}
                      >
                        Q
                      </span>
                      {selectedQuizGroup.en.question}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Tab Content ── */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                {/* Source tab */}
                <div
                  style={{
                    flex: 1,
                    display: activeTab === "source" ? "flex" : "none",
                    overflow: "hidden",
                  }}
                >
                  {selectedQuizGroup.ja && (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        borderRight: `1px solid ${S.border}`,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 12px",
                          background: "#1c2128",
                          fontSize: 11,
                          fontWeight: 600,
                          color: S.fgMuted,
                          borderBottom: `1px solid ${S.border}`,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>🇯🇵</span>
                        {(localReviewedMap[quizToFilePath(selectedQuizGroup.ja)] ??
                        selectedQuizGroup.ja.reviewed) ? (
                          <span style={{ color: S.accentGreen }}>✅ Reviewed</span>
                        ) : (
                          <span style={{ color: "#f59e0b" }}>
                            📝 Needs Review (add `reviewed: true` to frontmatter)
                          </span>
                        )}
                      </div>
                      <SourcePane
                        key={`ja-${quizKey(selectedQuizGroup.ja)}-${localReviewedMap[quizToFilePath(selectedQuizGroup.ja)] ?? selectedQuizGroup.ja.reviewed}`}
                        quiz={selectedQuizGroup.ja}
                        onSaved={(filePath, reviewed) =>
                          setLocalReviewedMap((p) => ({ ...p, [filePath]: reviewed }))
                        }
                      />
                    </div>
                  )}
                  {selectedQuizGroup.en && (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 12px",
                          background: "#1c2128",
                          fontSize: 11,
                          fontWeight: 600,
                          color: S.fgMuted,
                          borderBottom: `1px solid ${S.border}`,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>🇺🇸</span>
                        {(localReviewedMap[quizToFilePath(selectedQuizGroup.en)] ??
                        selectedQuizGroup.en.reviewed) ? (
                          <span style={{ color: S.accentGreen }}>✅ Reviewed</span>
                        ) : (
                          <span style={{ color: "#f59e0b" }}>
                            📝 Needs Review (add `reviewed: true` to frontmatter)
                          </span>
                        )}
                      </div>
                      <SourcePane
                        key={`en-${quizKey(selectedQuizGroup.en)}-${localReviewedMap[quizToFilePath(selectedQuizGroup.en)] ?? selectedQuizGroup.en.reviewed}`}
                        quiz={selectedQuizGroup.en}
                        onSaved={(filePath, reviewed) =>
                          setLocalReviewedMap((p) => ({ ...p, [filePath]: reviewed }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Preview tab */}
                {previewOpen && (
                  <div
                    style={{
                      flex: 1,
                      display: activeTab === "preview" ? "flex" : "none",
                      overflow: "hidden",
                      background: "#1a1a2e",
                    }}
                  >
                    {selectedQuizGroup.ja && (
                      <div
                        style={{
                          flex: 1,
                          borderRight: `1px solid ${S.border}`,
                          position: "relative",
                          overflow: "auto",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 10,
                            padding: "2px 6px",
                            background: "rgba(0,0,0,0.5)",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          🇯🇵
                        </div>
                        <LocalizedQuizPreview
                          key={`ja-${quizKey(selectedQuizGroup.ja)}`}
                          locale="ja"
                          questions={[selectedQuizGroup.ja]}
                          onReturnToMenu={closePreview}
                        />
                      </div>
                    )}
                    {selectedQuizGroup.en && (
                      <div style={{ flex: 1, position: "relative", overflow: "auto" }}>
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 10,
                            padding: "2px 6px",
                            background: "rgba(0,0,0,0.5)",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          🇺🇸
                        </div>
                        <LocalizedQuizPreview
                          key={`en-${quizKey(selectedQuizGroup.en)}`}
                          locale="en"
                          questions={[selectedQuizGroup.en]}
                          onReturnToMenu={closePreview}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Empty State ── */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: S.fgMuted,
                gap: 12,
              }}
            >
              <span style={{ fontSize: 48, opacity: 0.5 }}>📂</span>
              <p style={{ margin: 0, fontSize: 14 }}>Select a file to view its source</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
                {allQuizzes.length} quizzes · ↑↓ to navigate · ⏎ to play
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "2px 12px",
          background: S.accent,
          color: "#fff",
          fontSize: 11,
          flexShrink: 0,
          userSelect: "none",
          fontFamily: S.font,
        }}
      >
        <span>Quiz Studio</span>
        <span style={{ opacity: 0.8 }}>{allQuizzes.length} files</span>
        {selectedQuizGroup && (
          <>
            <span style={{ opacity: 0.8 }}>
              {(() => {
                const repQuiz = (selectedQuizGroup.ja || selectedQuizGroup.en)!;
                return `${repQuiz.difficulty}/${repQuiz.category}/${repQuiz.id}`;
              })()}
            </span>
            {previewOpen && <span style={{ opacity: 0.8 }}>▶ Playing</span>}
          </>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ opacity: 0.6 }}>MDX · UTF-8</span>
      </div>
    </div>
  );
}
