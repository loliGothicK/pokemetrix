const fs = require('fs');

let content = fs.readFileSync('apps/web/src/components/client/quiz/QuizDebugList.tsx', 'utf-8');

// Replacement 1: Types
content = content.replace(
  `interface FileTreeNode {
  name: string;
  fullPath: string;
  children: Record<string, FileTreeNode>;
  quiz?: QuizQuestion;
}`,
  `export interface QuizGroup {
  ja?: QuizQuestion;
  en?: QuizQuestion;
}

interface FileTreeNode {
  name: string;
  fullPath: string;
  children: Record<string, FileTreeNode>;
  quizzes?: QuizGroup;
}`
);

// Replacement 2: buildFileTree
content = content.replace(
  `function buildFileTree(quizzes: QuizQuestion[]): FileTreeNode {
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
}`,
  `function buildFileTree(quizzes: QuizQuestion[]): FileTreeNode {
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
}`
);

// Replacement 3: flattenLeaves
content = content.replace(
  `/** Flatten all leaf quizzes in tree order for keyboard navigation */
function flattenLeaves(node: FileTreeNode): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  if (node.quiz) {
    results.push(node.quiz);
  }
  for (const child of Object.values(node.children)) {
    results.push(...flattenLeaves(child));
  }
  return results;
}`,
  `/** Flatten all leaf groups in tree order for keyboard navigation */
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
}`
);

// Replacement 4: TreeNode Props
content = content.replace(
  `function TreeNode({
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
  );`,
  `function TreeNode({
  node,
  depth,
  selectedGroup,
  onSelect,
  searchTerm,
  expandedPaths,
  onToggle,
}: {
  node: FileTreeNode;
  depth: number;
  selectedGroup: QuizGroup | null;
  onSelect: (g: QuizGroup) => void;
  searchTerm: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const isLeaf = !!node.quizzes;
  const isSelected = isLeaf && selectedGroup && groupKey(selectedGroup) === groupKey(node.quizzes!);

  const matchesSearch = useCallback(
    (n: FileTreeNode): boolean => {
      if (n.quizzes) {
        const q = n.quizzes.ja || n.quizzes.en;
        return !!q && (
          n.name.toLowerCase().includes(searchTerm) ||
          q.question.toLowerCase().includes(searchTerm)
        );
      }
      return Object.values(n.children).some(matchesSearch);
    },
    [searchTerm],
  );`
);

// Replacement 5: TreeNode Leaf render
content = content.replace(
  `  if (isLeaf) {
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
          borderLeft: isSelected ? \`2px solid \${S.accent}\` : "2px solid transparent",
          cursor: "pointer",
          padding: \`3px 8px 3px \${depth * 16 + 8}px\`,
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
  }`,
  `  if (isLeaf) {
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
          borderLeft: isSelected ? \`2px solid \${S.accent}\` : "2px solid transparent",
          cursor: "pointer",
          padding: \`3px 8px 3px \${depth * 16 + 8}px\`,
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
            background: formatColor(q.format) + "22",
            color: formatColor(q.format),
          }}
        >
          {q.format.replace("_", " ")}
        </span>
      </button>
    );
  }`
);

// Replacement 6: TreeNode childCount
content = content.replace(
  `  const childCount = Object.values(node.children).reduce(
    (acc, c) => acc + (c.quiz ? 1 : Object.keys(c.children).length),
    0,
  );`,
  `  const childCount = Object.values(node.children).reduce(
    (acc, c) => acc + (c.quizzes ? 1 : Object.keys(c.children).length),
    0,
  );`
);

// Replacement 7: TreeNode children render
content = content.replace(
  `            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              searchTerm={searchTerm}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
            />`,
  `            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selectedGroup={selectedGroup}
              onSelect={onSelect}
              searchTerm={searchTerm}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
            />`
);

// Replacement 8: QuizDebugList state
content = content.replace(
  `export function QuizDebugList({ allQuizzes }: { allQuizzes: QuizQuestion[] }) {
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
  const flatQuizzes = useMemo(() => flattenLeaves(tree), [tree]);`,
  `export function QuizDebugList({ allQuizzes }: { allQuizzes: QuizQuestion[] }) {
  const [selectedQuizGroup, setSelectedQuizGroup] = useState<QuizGroup | null>(null);
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
  const flatGroups = useMemo(() => flattenLeaves(tree), [tree]);`
);

// Replacement 9: keyboard navigation
content = content.replace(
  `      // ↑/↓ navigate files
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
        const el = containerRef.current?.querySelector(\`[data-quiz-key="\${quizKey(nextQuiz)}"]\`);
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
  }, [selectedQuiz, flatQuizzes, previewOpen, closePreview, openPreview, searchTerm]);`,
  `      // ↑/↓ navigate files
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
        const el = containerRef.current?.querySelector(\`[data-quiz-key="\${groupKey(nextGroup)}"]\`);
        el?.scrollIntoView({ block: "nearest" });
        return;
      }

      // Enter → open preview
      if (e.key === "Enter" && selectedQuizGroup) {
        e.preventDefault();
        openPreview();
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedQuizGroup, flatGroups, previewOpen, closePreview, openPreview, searchTerm]);`
);

// Replacement 10: Sidebar render
content = content.replace(
  `            {Object.values(tree.children).map((child) => (
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
            ))}`,
  `            {Object.values(tree.children).map((child) => (
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
                expandedPaths={expandedPaths}
                onToggle={togglePath}
              />
            ))}`
);

// Replacement 11: Editor tabs and content area!
content = content.replace(
  `        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedQuiz ? (
            <>
              {/* ── Editor Tabs ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: S.bgPanel,
                  borderBottom: \`1px solid \${S.border}\`,
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
                    label={\`\${selectedQuiz.id}.mdx\`}
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
                        border: \`1px solid \${S.accentGreenHover}\`,
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
                  borderBottom: \`1px solid \${S.border}\`,
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
                  borderBottom: \`1px solid \${S.border}\`,
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
            </>`,
  `        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedQuizGroup ? (
            <>
              {/* ── Editor Tabs ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: S.bgPanel,
                  borderBottom: \`1px solid \${S.border}\`,
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
                    label={\`\${groupKey(selectedQuizGroup)}.mdx\`}
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
                        border: \`1px solid \${S.accentGreenHover}\`,
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
                  borderBottom: \`1px solid \${S.border}\`,
                  flexShrink: 0,
                  fontSize: 12,
                  fontFamily: S.font,
                }}
              >
                {(() => {
                  const repQuiz = (selectedQuizGroup.ja || selectedQuizGroup.en)!;
                  return (
                    <>
                      {[
                        repQuiz.difficulty,
                        repQuiz.category,
                        repQuiz.id + ".mdx",
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
                    </>
                  );
                })()}
              </div>

              {/* ── Question Banner ── */}
              <div
                style={{
                  padding: "8px 14px",
                  background: S.bg,
                  borderBottom: \`1px solid \${S.border}\`,
                  flexShrink: 0,
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: "#c9d1d9", lineHeight: 1.5 }}>
                  <span style={{ color: S.fgMuted, marginRight: 6, fontSize: 11, fontWeight: 600 }}>
                    Q
                  </span>
                  {(selectedQuizGroup.ja || selectedQuizGroup.en)!.question}
                </p>
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
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: \`1px solid \${S.border}\`, overflow: "hidden" }}>
                      <div style={{ padding: "4px 12px", background: "#1c2128", fontSize: 11, fontWeight: 600, color: S.fgMuted, borderBottom: \`1px solid \${S.border}\`, flexShrink: 0 }}>🇯🇵 ja</div>
                      <SourcePane key={\`ja-\${quizKey(selectedQuizGroup.ja)}\`} quiz={selectedQuizGroup.ja} />
                    </div>
                  )}
                  {selectedQuizGroup.en && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <div style={{ padding: "4px 12px", background: "#1c2128", fontSize: 11, fontWeight: 600, color: S.fgMuted, borderBottom: \`1px solid \${S.border}\`, flexShrink: 0 }}>🇺🇸 en</div>
                      <SourcePane key={\`en-\${quizKey(selectedQuizGroup.en)}\`} quiz={selectedQuizGroup.en} />
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
                      <div style={{ flex: 1, borderRight: \`1px solid \${S.border}\`, position: "relative", overflow: "auto" }}>
                        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, padding: "2px 6px", background: "rgba(0,0,0,0.5)", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#fff" }}>🇯🇵 ja</div>
                        <QuizApp
                          key={\`ja-\${quizKey(selectedQuizGroup.ja)}\`}
                          initialQuestions={[selectedQuizGroup.ja]}
                          directPlay={true}
                          onReturnToMenu={closePreview}
                        />
                      </div>
                    )}
                    {selectedQuizGroup.en && (
                      <div style={{ flex: 1, position: "relative", overflow: "auto" }}>
                        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, padding: "2px 6px", background: "rgba(0,0,0,0.5)", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#fff" }}>🇺🇸 en</div>
                        <QuizApp
                          key={\`en-\${quizKey(selectedQuizGroup.en)}\`}
                          initialQuestions={[selectedQuizGroup.en]}
                          directPlay={true}
                          onReturnToMenu={closePreview}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>`
);

// Replacement 12: status bar
content = content.replace(
  `        {selectedQuiz && (
          <>
            <span style={{ opacity: 0.8 }}>
              {selectedQuiz.locale}/{selectedQuiz.difficulty}/{selectedQuiz.id}
            </span>
            {previewOpen && <span style={{ opacity: 0.8 }}>▶ Playing</span>}
          </>
        )}`,
  `        {selectedQuizGroup && (
          <>
            <span style={{ opacity: 0.8 }}>
              {(() => {
                const repQuiz = (selectedQuizGroup.ja || selectedQuizGroup.en)!;
                return \`\${repQuiz.difficulty}/\${repQuiz.category}/\${repQuiz.id}\`;
              })()}
            </span>
            {previewOpen && <span style={{ opacity: 0.8 }}>▶ Playing</span>}
          </>
        )}`
);

fs.writeFileSync('apps/web/src/components/client/quiz/QuizDebugList.tsx', content, 'utf-8');
console.log('QuizDebugList.tsx patched!');
