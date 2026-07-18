"use client";

import { useTheme } from "@mui/material/styles";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { javascript } from "@codemirror/lang-javascript";
import { Box } from "@mui/material";

export function SqlEditor({
  value,
  onChange,
  language = "sql",
}: {
  readonly value: string;
  readonly onChange: (val: string) => void;
  readonly language?: "sql" | "javascript";
}) {
  const theme = useTheme();
  const extensions = language === "javascript" ? [javascript()] : [sql()];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        "& .cm-theme-light": {
          bgcolor: "background.paper",
        },
        "& .cm-editor": {
          height: "100%",
          fontSize: "14px",
          fontFamily: "'Fira Code', 'Roboto Mono', monospace",
        },
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        onChange={onChange}
        theme={theme.palette.mode === "dark" ? "dark" : "light"}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
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
