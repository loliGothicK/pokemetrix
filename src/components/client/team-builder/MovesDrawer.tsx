import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { getAppPalette } from "@/theme/palette";
import { moveById, moveByIdentifier } from "@/data/moves";
import { typeIcon } from "@/lib/image";
import { TrainedPokemon } from "@/store/team/team";

interface MoveSelectionDrawerProps {
  open: boolean;
  activeSlot: number | null;
  onClose: () => void;
  onChangeSlot: (slot: number) => void;
  onSelectMove: (moveId: number | null) => void;
  ongoing: TrainedPokemon;
  pokemon: any; // 辞書から引いたベースのポケモンデータ
  battleData: any;
  isError: boolean;
}

export function MoveSelectionDrawer({
  open,
  activeSlot,
  onClose,
  onChangeSlot,
  onSelectMove,
  ongoing,
  pokemon,
  battleData,
  isError,
}: MoveSelectionDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // 検索状態はドロワー内部に完全にカプセル化する
  const [searchQuery, setSearchQuery] = useState("");

  // スロットが切り替わった時に検索窓をリセットする
  useEffect(() => {
    setSearchQuery("");
  }, [activeSlot]);

  // Drawerに表示する技リストのフィルタリング
  const availableMoves = useMemo(() => {
    if (activeSlot === null) return [];

    const available = pokemon.moves
      .map((moveId: number) => {
        return {
          ...moveById.get(moveId)!,
          rank: null,
          percentage: null,
        };
      })
      .filter((move: any) => {
        const isAlreadySelectedInOtherSlot = ongoing.moves.some(
          (m, index) => m === move.id && index !== activeSlot,
        );
        if (isAlreadySelectedInOtherSlot) return false;
        if (!searchQuery) return true;

        return t(`moves.${move.identifier}.name`).toLowerCase().includes(searchQuery.toLowerCase());
      });

    if (!isError && !!battleData && battleData.isOk()) {
      const popularMoves = battleData.value.moves.map((info: any) => {
        return {
          ...moveByIdentifier.get(info.name)!,
          rank: info.rank as number | null,
          percentage: info.percentage as number | null,
        };
      });

      return popularMoves.concat(
        available.filter(
          (move: any) => !popularMoves.map(({ id }: { id: number }) => id).includes(move.id),
        ),
      );
    }

    return available;
  }, [activeSlot, pokemon.moves, ongoing.moves, searchQuery, t, battleData, isError]);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "88vw", sm: 420, md: 560, lg: 900 },
          maxWidth: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      {activeSlot !== null && (
        <Stack direction={"column"} sx={{ height: "100%", width: "100%" }}>
          {/* Drawer ヘッダー */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${palette.edgeSoft}` }}>
            <Stack
              direction="row"
              sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h6">Select Move</Typography>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>

            {/* シームレスなスロット切り替えUI */}
            <ButtonGroup fullWidth size="small" sx={{ mb: 2 }}>
              {[0, 1, 2, 3].map((idx) => (
                <Button
                  key={idx}
                  variant={activeSlot === idx ? "contained" : "outlined"}
                  onClick={() => onChangeSlot(idx)}
                >
                  {ongoing.moves[idx]
                    ? t(`moves.${moveById.get(ongoing.moves[idx]!)?.identifier}.name`)
                    : `Move ${idx + 1}`}
                </Button>
              ))}
            </ButtonGroup>

            <TextField
              fullWidth
              size="small"
              placeholder="Search moves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* 技リスト */}
          <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
            {/* 「技を消す」オプション */}
            {ongoing.moves[activeSlot] && (
              <ListItemButton
                onClick={() => onSelectMove(null)}
                sx={{
                  borderBottom: `2px solid ${palette.edge}`,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
                }}
              >
                <Typography color="error" sx={{ fontWeight: 600 }}>
                  {t("teamBuilder.forgetMove")}
                </Typography>
              </ListItemButton>
            )}
            {availableMoves.map((move: any) => {
              const isSelected = ongoing.moves[activeSlot] === move.id;

              return (
                <ListItemButton
                  key={move.identifier}
                  selected={isSelected}
                  onClick={() => onSelectMove(move.id)}
                  sx={{
                    borderBottom: `1px solid ${palette.edgeSoft}`,
                    p: 0,
                    flexDirection: "column",
                    alignItems: "stretch",
                    "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  {/* ── lg: 1行レイアウト ── */}
                  <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", px: 2, py: 1.5, gap: 1.5, minWidth: 0 }}>
                    {/* 採用率% */}
                    {move.percentage && (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", width: 48, flexShrink: 0 }}>
                        {move.percentage}%
                      </Typography>
                    )}
                    {/* 技名 */}
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", flexGrow: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t(`moves.${move.identifier}.name`)}
                    </Typography>
                    {/* 優先度 */}
                    {move.priority !== null && move.priority !== 0 && (
                      <Chip size="small" label={`priority ${move.priority > 0 ? `+${move.priority}` : move.priority}`} color={move.priority > 0 ? "error" : "info"}
                        sx={{ fontWeight: 900, fontSize: "0.8rem", height: 18, px: 0.5, borderRadius: 1, boxShadow: theme.shadows[1], flexShrink: 0 }} />
                    )}
                    {/* 分類 */}
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      {move.classifications?.map((clazz: string) => (
                        <Chip key={clazz} size="small" label={clazz} sx={{ fontSize: "0.75rem", height: 18 }} />
                      ))}
                    </Box>
                    {/* タイプ / カテゴリ / PWR / ACC / RANGE */}
                    <Box sx={{ width: 90, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                      <Chip avatar={<Avatar src={typeIcon(move.type)} />} label={t(`types.${move.type}.name`)} size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Box sx={{ width: 40, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                      <Avatar src={`/move-category/${move.category}.png`} sx={{ width: 24, height: 24, bgcolor: "transparent", filter: theme.palette.mode === "light" ? "invert(1)" : "none", opacity: theme.palette.mode === "light" ? 0.7 : 1 }} variant="square" />
                    </Box>
                    <Box sx={{ width: 48, textAlign: "center", flexShrink: 0 }}>
                      <Typography variant="overline" sx={{ display: "block", fontSize: "0.55rem", lineHeight: 1, color: "text.disabled" }}>PWR</Typography>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: move.power && move.power > 0 ? "text.primary" : "text.disabled" }}>
                        {move.power && move.power > 0 ? move.power : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 48, textAlign: "center", flexShrink: 0 }}>
                      <Typography variant="overline" sx={{ display: "block", fontSize: "0.55rem", lineHeight: 1, color: "text.disabled" }}>ACC</Typography>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: move.accuracy ? "text.primary" : "text.disabled" }}>
                        {move.accuracy ?? "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 80, pl: 1, textAlign: "center", borderLeft: `1px solid ${palette.edgeSoft}`, flexShrink: 0 }}>
                      <Typography variant="overline" sx={{ display: "block", fontSize: "0.55rem", lineHeight: 1, color: "text.disabled" }}>RANGE</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary", display: "block", whiteSpace: "nowrap" }}>
                        {t(`range.${move.range}.name`)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ── xs/sm/md: 2行レイアウト ── */}
                  <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", width: "100%" }}>
                    {/* 行1: 採用率% + 技名 */}
                    <Stack direction="row" sx={{ alignItems: "center", px: 2, pt: 2, pb: 0.5, gap: 1.5, minWidth: 0 }}>
                      {move.percentage && (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", width: 48, flexShrink: 0 }}>
                          {move.percentage}%
                        </Typography>
                      )}
                      <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", flexGrow: 1, minWidth: 0 }}>
                        {t(`moves.${move.identifier}.name`)}
                      </Typography>
                    </Stack>
                    {/* 行2: 優先度 + 分類 + タイプ/カテゴリ/PWR/ACC/RANGE */}
                    <Stack direction="row" sx={{ alignItems: "center", px: 2, pb: 2, pt: 0.5, gap: 1, flexWrap: "wrap" }}>
                      {move.priority !== null && move.priority !== 0 && (
                        <Chip size="small" label={`priority ${move.priority > 0 ? `+${move.priority}` : move.priority}`} color={move.priority > 0 ? "error" : "info"}
                          sx={{ fontWeight: 900, fontSize: "0.8rem", height: 18, px: 0.5, borderRadius: 1, boxShadow: theme.shadows[1] }} />
                      )}
                      {move.classifications?.map((clazz: string) => (
                        <Chip key={clazz} size="small" label={clazz} sx={{ fontSize: "0.75rem", height: 18 }} />
                      ))}
                      <Box sx={{ flexGrow: 1 }} />
                      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                        <Chip avatar={<Avatar src={typeIcon(move.type)} />} label={t(`types.${move.type}.name`)} size="small" sx={{ fontWeight: 600 }} />
                        <Avatar src={`/move-category/${move.category}.png`} sx={{ width: 24, height: 24, bgcolor: "transparent", filter: theme.palette.mode === "light" ? "invert(1)" : "none", opacity: theme.palette.mode === "light" ? 0.7 : 1 }} variant="square" />
                        <Box sx={{ textAlign: "center", minWidth: 32 }}>
                          <Typography variant="overline" sx={{ display: "block", fontSize: "0.55rem", lineHeight: 1, color: "text.disabled" }}>PWR</Typography>
                          <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: move.power && move.power > 0 ? "text.primary" : "text.disabled" }}>
                            {move.power && move.power > 0 ? move.power : "—"}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", minWidth: 32 }}>
                          <Typography variant="overline" sx={{ display: "block", fontSize: "0.55rem", lineHeight: 1, color: "text.disabled" }}>ACC</Typography>
                          <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: move.accuracy ? "text.primary" : "text.disabled" }}>
                            {move.accuracy ?? "—"}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", minWidth: 56, pl: 1, borderLeft: `1px solid ${palette.edgeSoft}` }}>
                          <Typography variant="overline" sx={{ display: "block", fontSize: "0.55rem", lineHeight: 1, color: "text.disabled" }}>RANGE</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary", display: "block", whiteSpace: "nowrap" }}>
                            {t(`range.${move.range}.name`)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* 説明文 (全ブレークポイント共通) */}
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {t(`moves.${move.identifier}.effect`)}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        </Stack>
      )}
    </Drawer>
  );
}
