import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { importSets } from "@/lib/pokepaste";
import { Diagnostics } from "@/components/client/team-builder/index";
import { Team } from "@/store/team/team";
import { isLeft } from "fp-ts/Either";
import { anyhow } from "@/errors/anyhow/error";
import { match } from "ts-pattern";

interface Props {
  type: "paste" | "url";
  open: boolean;
  onClose: () => void;
  onImport: (team: { members: Team["members"] }) => void;
  onError: (diagnostics: Diagnostics) => void;
}

export default function ImportPokepasteDialog({ type, open, onClose, onImport, onError }: Props) {
  const [text, setText] = useState("");

  const handleImport = async () => {
    let paste: string;
    if (type === "url") {
      paste = await fetch(`https://pokepast.es/${text.trim()}/raw`).then((res) => res.text());
    } else {
      paste = text.trim();
    }

    const members = importSets(paste);

    if (isLeft(members) || members.right.members.length === 0) {
      onError({
        severity: "error",
        message: isLeft(members) ? members.left : [anyhow("ERROR: Input is empty.")],
      });
      return;
    }

    onImport(members.right);
    setText(""); // クリア
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Pokepaste インポート</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Pokemon Showdown 形式のテキストを貼り付けてください。
          </Typography>

          {match(type)
            .with("paste", () => (
              <TextField
                multiline
                rows={10}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                sx={{
                  fontFamily: "monospace",
                  "& .MuiInputBase-input": { fontSize: "0.875rem" },
                }}
              />
            ))
            .with("url", () => (
              <TextField
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                sx={{
                  fontFamily: "monospace",
                  "& .MuiInputBase-input": { fontSize: "0.875rem" },
                }}
                slotProps={{
                  input: {
                    startAdornment: <Typography>{"https://pokepast.es/"}</Typography>,
                    endAdornment: <Typography>{"/raw"}</Typography>,
                  },
                }}
              />
            ))
            .exhaustive()}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button
          onClick={async () => {
            await handleImport();
            onClose();
          }}
          variant="contained"
          disableElevation
        >
          インポート ({text.trim() ? "解析実行" : "待機中"})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
