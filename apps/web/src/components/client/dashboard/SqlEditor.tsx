"use client";

import { useColorScheme } from "@mui/material/styles";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { javascript } from "@codemirror/lang-javascript";
import { Box } from "@mui/material";
import { useMemo } from "react";

export function SqlEditor({
  value,
  onChange,
  language = "sql",
  rowTypeDeclaration: _rowTypeDeclaration,
}: {
  readonly value: string;
  readonly onChange: (val: string) => void;
  readonly language?: "sql" | "javascript" | "typescript";
  readonly rowTypeDeclaration?: string;
}) {
  const { mode } = useColorScheme();

  const extensions = useMemo(() => {
    const exts = [EditorView.lineWrapping];
    if (language === "sql") {
      exts.push(sql());
    } else {
      exts.push(javascript({ typescript: language === "typescript" }));
    }
    return exts;
  }, [language]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        "& .cm-editor": {
          height: "100%",
          fontFamily: "'Fira Code', 'Roboto Mono', monospace",
          fontSize: 14,
        },
        "& .cm-scroller": {
          overflow: "auto",
        },
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        theme={mode === "dark" ? "dark" : "light"}
        extensions={extensions}
        onChange={(val) => onChange(val)}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </Box>
  );
}
