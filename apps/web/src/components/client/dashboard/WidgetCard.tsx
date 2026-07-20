"use client";

import React, { useState, useRef, useEffect } from "react";
import { alpha, Box, IconButton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Resizable, type ResizeCallbackData } from "react-resizable";

import { SurfaceCard } from "@/components/common/SurfaceCard";

import { WidgetRenderer } from "./WidgetRenderer";
import type { DashboardWidget } from "@/store/dashboard/dashboard";

/** ウィジェット種別ごとの既定タイトル（i18n キー） */
export const widgetTypeLabelKey = (type?: string) =>
  type ? (`dashboard.widget.type.${type}` as const) : null;

const ResizableWrapper = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const { style, className, children, isResizing, ...rest } = props;
  return (
    <Box
      ref={ref}
      className={className}
      style={{
        ...style,
        width: isResizing ? style?.width : "100%",
        height: isResizing ? style?.height : "100%",
      }}
      sx={{
        position: isResizing ? "absolute" : "relative",
        top: 0,
        left: 0,
        zIndex: isResizing ? 100 : 1,
        "& .react-resizable-handle": {
          zIndex: 10,
        },
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});
ResizableWrapper.displayName = "ResizableWrapper";

const ResizeHandle = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const { handleAxis, ...rest } = props;
  return (
    <Box
      ref={ref}
      sx={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        cursor: "se-resize",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "text.disabled",
        "&:hover": {
          color: "primary.main",
        },
      }}
      {...rest}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M22 22H10v-2h10v-10h2v12z M18 22H6v-2h10v-10h2v12z" />
      </svg>
    </Box>
  );
});
ResizeHandle.displayName = "ResizeHandle";

function LocalResizer({
  editing,
  widgetW,
  onResizeAction,
  children,
}: {
  editing: boolean;
  widgetW: number;
  onResizeAction: (dw: number, dh: number) => void;
  children: React.ReactNode;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const [pixelSize, setPixelSize] = useState({ width: 0, height: 0 });

  const isResizingRef = useRef(false);
  const initialSize = useRef({ width: 0, height: 0 });
  const initialWidgetW = useRef(1);
  const lastUnits = useRef({ w: 0, h: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boxRef.current || !editing) return;
    const observer = new ResizeObserver((entries) => {
      if (isResizingRef.current) return;
      const rect = entries[0].contentRect;
      if (rect.width > 0 && rect.height > 0) {
        setBaseSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [editing]);

  const handleResizeStart = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    e.stopPropagation();
    isResizingRef.current = true;
    setIsResizing(true);
    initialSize.current = { width: data.size.width, height: data.size.height };
    initialWidgetW.current = widgetW;
    lastUnits.current = { w: 0, h: 0 };
    setPixelSize(data.size);
  };

  const handleResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    setPixelSize(data.size);

    const dwPixels = data.size.width - initialSize.current.width;
    const dhPixels = data.size.height - initialSize.current.height;

    const unitW = initialSize.current.width / initialWidgetW.current;
    const unitH = 120;

    const currentDw = Math.round(dwPixels / unitW);
    const currentDh = Math.round(dhPixels / unitH);

    const stepDw = currentDw - lastUnits.current.w;
    const stepDh = currentDh - lastUnits.current.h;

    if (stepDw !== 0 || stepDh !== 0) {
      lastUnits.current.w = currentDw;
      lastUnits.current.h = currentDh;
      onResizeAction(stepDw, stepDh);
    }
  };

  const handleResizeStop = (e: React.SyntheticEvent, _data: ResizeCallbackData) => {
    e.stopPropagation();
    isResizingRef.current = false;
    setIsResizing(false);
  };

  if (!editing) {
    return (
      <Box ref={boxRef} sx={{ width: "100%", height: "100%" }}>
        {children}
      </Box>
    );
  }

  const isReady = baseSize.width > 0 && baseSize.height > 0;

  return (
    <Box ref={boxRef} sx={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Ghost placeholder visible during resize */}
      {isResizing && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            borderRadius: 2,
            border: "2px dashed",
            borderColor: "primary.main",
            zIndex: 0,
          }}
        />
      )}

      {isReady ? (
        <Resizable
          width={isResizing ? pixelSize.width : baseSize.width}
          height={isResizing ? pixelSize.height : baseSize.height}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          handle={<ResizeHandle />}
        >
          <ResizableWrapper isResizing={isResizing}>{children}</ResizableWrapper>
        </Resizable>
      ) : (
        <Box sx={{ width: "100%", height: "100%" }}>{children}</Box>
      )}
    </Box>
  );
}

export function WidgetCard({
  widget,
  editing,
  variableValues = {},
  onDelete,
  onEditClick,
  onResize,
}: {
  readonly widget: DashboardWidget;
  readonly editing: boolean;
  readonly variableValues?: Readonly<Record<string, string | null>>;
  readonly onDelete: () => void;
  /** 編集モード時にウィジェットの編集ボタンをクリックした際のコールバック */
  readonly onEditClick: () => void;
  readonly onResize: (dw: number, dh: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  });

  const gridStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
  };

  const defaultTitleKey = widgetTypeLabelKey(widget.templateId);
  const title =
    widget.title ||
    (defaultTitleKey ? t(defaultTitleKey) : t("dashboard.widget.untitled", "New Widget"));

  const cardContent = (
    <SurfaceCard
      raised
      onClick={editing ? onEditClick : undefined}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        position: "relative",
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? `0 8px 24px ${alpha(theme.palette.common.black, 0.18)}` : undefined,
        ...(editing && {
          cursor: "pointer",
          "&:hover": {
            outline: `2px solid ${theme.palette.primary.main}`,
          },
        }),
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: "absolute",
          top: 0,
          left: 32,
          transform: "translateY(-50%)",
          bgcolor: "background.paper",
          px: 1,
          alignItems: "center",
          zIndex: 10,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: 1,
        }}
      >
        {editing && (
          <IconButton
            size="small"
            {...attributes}
            {...listeners}
            sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", ml: -0.5, p: 0.25 }}
            aria-label={t("dashboard.dragToReorder")}
          >
            <DragIndicatorRoundedIcon fontSize="small" />
          </IconButton>
        )}

        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }} noWrap>
          {title}
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, overflow: "hidden", minHeight: 0, pt: 1.5, pb: 0.5, px: 0.5 }}>
        <WidgetRenderer
          widget={widget}
          editing={editing}
          variableValues={variableValues}
          onEditClick={onEditClick}
        />
      </Box>
    </SurfaceCard>
  );

  return (
    <Box ref={setNodeRef} style={gridStyle} sx={{ p: 1 }}>
      <LocalResizer editing={editing} widgetW={widget.w} onResizeAction={onResize}>
        {cardContent}
      </LocalResizer>
    </Box>
  );
}
