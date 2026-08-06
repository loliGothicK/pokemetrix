"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { PatchDiff, File as DiffsFile } from "@pierre/diffs/react";
import type { FileContents } from "@pierre/diffs";
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
}

interface FileTreeNode {
  name: string;
  fullPath: string;
  children: Record<string, FileTreeNode>;
  quiz?: QuizQuestion;
}

type EditorTab = "source" | "preview";

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildFileTree(quizzes: QuizQuestion[]): FileTreeNode {
  const root: FileTreeNode = { name: "", fullPath: "", children: {} };
  for (const quiz of quizzes) {
    const parts = [quiz.locale ?? "??", quiz.difficulty, quiz.category, quiz.id];
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          fullPath: parts.slice(0, i + 1).join("/"),
          children: {},
          quiz: i === parts.length - 1 ? quiz : undefined,
        };
      }
      node = node.children[part];
    }
  }
  return root;
}

/** Flatten all leaf quizzes in tree order for keyboard navigation */
function flattenLeaves(node: FileTreeNode): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  if (node.quiz) {
    results.push(node.quiz);
  }
  for (const child of Object.values(node.children)) {
    results.push(...flattenLeaves(child));
  }
  return results;
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
  selected,
  onSelect,
  searchTerm,
  expandedPaths,
  onToggle,
}: {
  node: FileTreeNode;
  depth: number;
  selected: QuizQuestion | null;
  onSelect: (q: QuizQuestion) => void;
  searchTerm: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const isLeaf = !!node.quiz;
  const isSelected = isLeaf && selected && quizKey(selected) === quizKey(node.quiz!);

  const matchesSearch = useCallback(
    (n: FileTreeNode): boolean => {
      if (n.quiz) {
        return (
          n.name.toLowerCase().includes(searchTerm) ||
          n.quiz.question.toLowerCase().includes(searchTerm)
        );
      }
      return Object.values(n.children).some(matchesSearch);
    },
    [searchTerm],
  );

  if (searchTerm && !matchesSearch(node)) return null;

  if (isLeaf) {
    return (
      <button
        data-quiz-key={quizKey(node.quiz!)}
        onClick={() => onSelect(node.quiz!)}
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
        <span style={{ color: S.fgMuted, flexShrink: 0, fontSize: 11 }}>📄</span>
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
            background: formatColor(node.quiz!.format) + "22",
            color: formatColor(node.quiz!.format),
          }}
        >
          {node.quiz!.format.replace("_", " ")}
        </span>
      </button>
    );
  }

  const isDifficulty = ["basics", "advanced", "expert", "master"].includes(node.name);
  const isLocale = ["ja", "en"].includes(node.name);
  const open = expandedPaths.has(node.fullPath);
  const childCount = Object.values(node.children).reduce(
    (acc, c) => acc + (c.quiz ? 1 : Object.keys(c.children).length),
    0,
  );

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
        {isDifficulty && (
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
        )}
      </button>
      {open && (
        <div>
          {Object.values(node.children).map((child) => (
            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              searchTerm={searchTerm}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
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

function SourcePane({ quiz }: { quiz: QuizQuestion }) {
  const [meta, setMeta] = useState<QuizFileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const filePath = quizToFilePath(quiz);

  useEffect(() => {
    setMeta(null);
    setLoading(true);
    setError(null);
    setShowRaw(false);

    fetch(`/api/quiz-debug?file=${encodeURIComponent(filePath)}`)
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

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Diff/File sub-header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px",
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
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filePath}
        </span>
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
      <div style={{ flex: 1, overflow: "auto", background: S.bg }}>
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
          <>
            <div
              style={{ "--diffs-dark-bg": S.bg, "--diffs-light-bg": S.bg } as React.CSSProperties}
            >
              {!showRaw && hasPatch ? (
                <PatchDiff
                  patch={meta.patch!}
                  options={{ diffStyle: "unified", overflow: "wrap" }}
                />
              ) : meta.fileContent ? (
                <DiffsFile
                  file={
                    {
                      name: meta.filePath.split("/").pop() ?? "file.mdx",
                      contents: meta.fileContent,
                    } satisfies FileContents
                  }
                  options={{ overflow: "wrap" }}
                />
              ) : (
                <div style={{ padding: 16, color: S.fgMuted, fontSize: 12 }}>
                  File not found on disk.
                </div>
              )}
            </div>
            {quiz.content && (
              <div
                style={{
                  margin: "0 16px 24px",
                  borderTop: `1px solid ${S.border}`,
                  paddingTop: 16,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    color: S.fgMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Explanation
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#8b949e",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    fontFamily: S.font,
                  }}
                >
                  {quiz.content}
                </p>
              </div>
            )}
            <GitLogPanel entries={meta.gitLog} />
          </>
        )}
      </div>
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

export function QuizDebugList({ allQuizzes }: { allQuizzes: QuizQuestion[] }) {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("source");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // Auto-expand first 2 levels
    const set = new Set<string>();
    const tree = buildFileTree(allQuizzes);
    for (const l1 of Object.values(tree.children)) {
      set.add(l1.fullPath);
      for (const l2 of Object.values(l1.children)) {
        set.add(l2.fullPath);
      }
    }
    return set;
  });

  const tree = useMemo(() => buildFileTree(allQuizzes), [allQuizzes]);
  const flatQuizzes = useMemo(() => flattenLeaves(tree), [tree]);
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

      // Don't navigate if focused on input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // ↑/↓ navigate files
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "j" || e.key === "k") {
        e.preventDefault();
        if (!flatQuizzes.length) return;
        const currentIdx = selectedQuiz
          ? flatQuizzes.findIndex((q) => quizKey(q) === quizKey(selectedQuiz))
          : -1;
        let nextIdx: number;
        if (e.key === "ArrowDown" || e.key === "j") {
          nextIdx = currentIdx < flatQuizzes.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : flatQuizzes.length - 1;
        }
        const nextQuiz = flatQuizzes[nextIdx];
        setSelectedQuiz(nextQuiz);
        // Scroll into view
        const el = containerRef.current?.querySelector(`[data-quiz-key="${quizKey(nextQuiz)}"]`);
        el?.scrollIntoView({ block: "nearest" });
        return;
      }

      // Enter → open preview
      if (e.key === "Enter" && selectedQuiz) {
        e.preventDefault();
        openPreview();
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedQuiz, flatQuizzes, previewOpen, closePreview, openPreview, searchTerm]);

  return (
    <div
      ref={containerRef}
      style={{
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
        <span style={{ fontSize: 14, fontWeight: 700, color: S.fg }}>🎮 Quiz Debug</span>
        <span style={{ fontSize: 11, color: S.fgDim }}>{allQuizzes.length} files</span>
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
            }}
          >
            Explorer
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 4, paddingBottom: 8 }}>
            {Object.values(tree.children).map((child) => (
              <TreeNode
                key={child.fullPath}
                node={child}
                depth={0}
                selected={selectedQuiz}
                onSelect={(q) => {
                  setSelectedQuiz(q);
                  setActiveTab("source");
                }}
                searchTerm={normalizedSearch}
                expandedPaths={expandedPaths}
                onToggle={togglePath}
              />
            ))}
          </div>
        </div>

        {/* ── Editor Area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedQuiz ? (
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
                    label={`${selectedQuiz.id}.mdx`}
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
                {[
                  selectedQuiz.locale,
                  selectedQuiz.difficulty,
                  selectedQuiz.category,
                  selectedQuiz.id + ".mdx",
                ].map((part, i, arr) => (
                  <React.Fragment key={i}>
                    <span
                      style={{
                        color: i === arr.length - 1 ? S.fg : S.fgMuted,
                        fontWeight: i === arr.length - 1 ? 600 : 400,
                      }}
                    >
                      {part}
                    </span>
                    {i < arr.length - 1 && <span style={{ color: S.fgDim, fontSize: 10 }}>›</span>}
                  </React.Fragment>
                ))}
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: difficultyColor(selectedQuiz.difficulty) + "22",
                    color: difficultyColor(selectedQuiz.difficulty),
                  }}
                >
                  {selectedQuiz.difficulty}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: formatColor(selectedQuiz.format) + "22",
                    color: formatColor(selectedQuiz.format),
                  }}
                >
                  {selectedQuiz.format}
                </span>
              </div>

              {/* ── Question Banner ── */}
              <div
                style={{
                  padding: "8px 14px",
                  background: S.bg,
                  borderBottom: `1px solid ${S.border}`,
                  flexShrink: 0,
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: "#c9d1d9", lineHeight: 1.5 }}>
                  <span style={{ color: S.fgMuted, marginRight: 6, fontSize: 11, fontWeight: 600 }}>
                    Q
                  </span>
                  {selectedQuiz.question}
                </p>
              </div>

              {/* ── Tab Content ── */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                {/* Source tab */}
                <div
                  style={{
                    flex: 1,
                    display: activeTab === "source" ? "flex" : "none",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <SourcePane key={quizKey(selectedQuiz)} quiz={selectedQuiz} />
                </div>

                {/* Preview tab — QuizApp inside, NOT replacing the whole page */}
                {previewOpen && (
                  <div
                    style={{
                      flex: 1,
                      display: activeTab === "preview" ? "flex" : "none",
                      flexDirection: "column",
                      overflow: "auto",
                      background: "#1a1a2e",
                    }}
                  >
                    <QuizApp
                      key={quizKey(selectedQuiz)}
                      initialQuestions={[selectedQuiz]}
                      directPlay={true}
                      onReturnToMenu={closePreview}
                    />
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
        <span>Quiz Debug</span>
        <span style={{ opacity: 0.8 }}>{allQuizzes.length} files</span>
        {selectedQuiz && (
          <>
            <span style={{ opacity: 0.8 }}>
              {selectedQuiz.locale}/{selectedQuiz.difficulty}/{selectedQuiz.id}
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
