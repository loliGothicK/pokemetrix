import {
  alpha,
  Box,
  Button,
  Divider,
  Fab,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { getAppPalette } from "@/theme/palette";
import Image from "next/image";
import { itemById, itemList } from "@/data/items";
import { Add, Delete } from "@mui/icons-material";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { Team } from "@/store/team/team";
import { itemSprite } from "@/lib/image";
import { match } from "ts-pattern";

export default function TeamOverview({
  activeSlot,
  teams,
  activeTeamId,
  onSelectTeam,
  onCreateTeam,
}: {
  activeSlot?: number;
  teams?: Team[];
  activeTeamId?: string | null;
  onSelectTeam?: (id: string) => void;
  onCreateTeam?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const router = useRouter();
  const [team, updateSlot, updateTeamName] = useActiveTeam();

  const name = useMemo(() => {
    return team?.name || "";
  }, [team]);

  const maxNameLength = useMemo(
    () =>
      match(i18n.resolvedLanguage)
        .with("en", () => 12)
        .with("ja", () => 8)
        .otherwise(() => 12),
    [i18n.resolvedLanguage],
  );

  if (!team) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: palette.surfaceRaised,
        border: "1px solid",
        borderColor: palette.edge,
      }}
    >
      {/* モバイル用チーム操作パネル（props が渡されたときだけ表示） */}
      {teams !== undefined && onCreateTeam && onSelectTeam && (
        <>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
            {teams.length > 1 ? (
              <Select
                size="small"
                value={activeTeamId ?? ""}
                onChange={(e) => onSelectTeam(e.target.value)}
                sx={{ flexGrow: 1 }}
              >
                {teams.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 700 }}>
                {teams[0]?.name ?? ""}
              </Typography>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={onCreateTeam}
              sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {t("teamBuilder.createTeam")}
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}
      <TextField
        id="title"
        label="Team Name"
        variant="outlined"
        value={name}
        onChange={(event) => updateTeamName(event.target.value)}
        slotProps={{
          htmlInput: {
            maxLength: maxNameLength,
          },
          input: {
            endAdornment: (
              <InputAdornment position={"end"}>
                <Typography variant={"body2"}>{`${name.length} / ${maxNameLength}`}</Typography>
              </InputAdornment>
            ),
          },
        }}
      />
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        {team.members.map((member, index) => (
          <Grid component={"div"} size={12} key={index}>
            {/* スロットを押すと URL 遷移し、対応する育成ページ（/team-builder/[slot]）を開く */}
            <Box
              onClick={() => router.push(`/team-builder/${index}`)}
              sx={{
                width: "100%", // 横幅を最大化
                cursor: "pointer", // クリック可能であることを明示
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor:
                  activeSlot === index
                    ? theme.palette.primary.main
                    : member
                      ? palette.edge
                      : "transparent",
                bgcolor:
                  activeSlot === index
                    ? alpha(theme.palette.primary.main, 0.08)
                    : member
                      ? palette.surface
                      : "transparent",
                position: "relative",
                display: "flex",
                alignItems: "center",
                transition: "all 0.2s ease-in-out",
                boxShadow: member
                  ? `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`
                  : "none",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  transform: member ? "translateY(-2px)" : "none",
                  boxShadow: member
                    ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                    : "none",
                },
              }}
            >
              {member ? (
                <>
                  {/* アイコン */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <Image
                      src={`/pokemon/${member.identifier}.png`}
                      alt={member.identifier}
                      width={56}
                      height={56}
                    />

                    {/* 追加: 選択中のアイテムを右下にオーバーレイ表示 */}
                    {member.item &&
                      (() => {
                        const item = itemList.find((i) => i.id === member.item);
                        return item ? (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              bgcolor: alpha(palette.surfaceRaised, 0.5),
                              boxShadow: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Image
                              src={itemSprite(item.identifier)}
                              alt={item.identifier}
                              width={20}
                              height={20}
                            />
                          </Box>
                        ) : null;
                      })()}
                  </Box>
                  {/* テキスト情報 */}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t(`pokemon.${member.identifier}.name`)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      {member.item
                        ? `@ ${t(`items.${itemById.get(member.item)?.identifier}.name`)}`
                        : "No Item"}
                    </Typography>
                  </Box>

                  {/* 削除ボタン */}
                  <Fab
                    size="small"
                    onClick={(e) => {
                      // 親のBoxへクリックイベントが伝播し、タブが切り替わるのを防ぐ
                      e.stopPropagation();
                      updateSlot(index, null);
                    }}
                    sx={{
                      boxShadow: "none",
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main,
                      "&:hover": { bgcolor: theme.palette.error.main, color: "#fff" },
                    }}
                  >
                    <Delete fontSize="small" />
                  </Fab>
                </>
              ) : (
                /* 空スロット時の表示（クリックイベントは親のBoxで処理されるためUIのみ定義） */
                <Box
                  sx={{
                    py: 1,
                    px: 2,
                    border: "1px dashed",
                    borderColor: palette.edgeSoft,
                    borderRadius: 2,
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                    {t("teamBuilder.emptyMember", { index: index + 1 })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
