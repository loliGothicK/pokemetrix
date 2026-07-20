"use client";

import { useTheme } from "@mui/material/styles";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Box, CircularProgress } from "@mui/material";
import { useEffect, useId } from "react";

export function SqlEditor({
  value,
  onChange,
  language = "sql",
  rowTypeDeclaration,
}: {
  readonly value: string;
  readonly onChange: (val: string) => void;
  readonly language?: "sql" | "javascript" | "typescript";
  readonly rowTypeDeclaration?: string;
}) {
  const theme = useTheme();
  const monaco = useMonaco();
  const id = useId();

  useEffect(() => {
    if (monaco && (language === "javascript" || language === "typescript")) {
      const defaults =
        language === "typescript"
          ? monaco.languages.typescript.typescriptDefaults
          : monaco.languages.typescript.javascriptDefaults;

      defaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      defaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: true,
      });

      // Type definition for custom transformer variables
      const libSource = `
        interface BattleRecordOpponent {
          readonly slotIndex: number;
          readonly pokemonSlug: string;
          readonly itemSlug: string | null;
          readonly abilitySlug: string | null;
          readonly moves: readonly string[] | null;
          readonly selectionRole: "lead" | "back" | null;
          readonly notes: string | null;
        }

        interface BattleRecord {
          readonly id: string;
          readonly seasonId: string;
          readonly teamId: string | null;
          readonly result: "win" | "loss" | "draw";
          readonly myTeam: readonly any[];
          readonly mySelection: readonly number[] | null;
          readonly rating: number | null;
          readonly notes: string | null;
          readonly playedAt: string;
          readonly opponents: readonly BattleRecordOpponent[];
          readonly createdAt: string;
          readonly updatedAt: string;
        }

        type ExtractRowValue<K extends string> = K extends keyof BattleRecord ? BattleRecord[K] : any;

        /** 
         * The type of the input records from the SQL query.
         */
        type Rows = ${rowTypeDeclaration || "Array<Partial<BattleRecord>>"};
        declare const rows: Rows;
      `;
      const libUri = "ts:filename/transformer.d.ts";

      const disposable = defaults.addExtraLib(libSource, libUri);

      return () => {
        disposable.dispose();
      };
    }
  }, [monaco, language, rowTypeDeclaration]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Editor
        path={`model-${id.replace(/:/g, "")}.${language === "typescript" ? "ts" : language === "javascript" ? "js" : "sql"}`}
        height="100%"
        language={language}
        theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
        value={value}
        onChange={(val) => onChange(val || "")}
        loading={
          <Box
            sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
          >
            <CircularProgress size={24} />
          </Box>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Roboto Mono', monospace",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          fixedOverflowWidgets: true,
        }}
      />
    </Box>
  );
}
