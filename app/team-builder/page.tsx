import { Suspense } from "react";
import Index from "@/components/client/team-builder/index";
import { Box, CircularProgress } from "@mui/material";

function LoadingFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
      <CircularProgress />
    </Box>
  );
}

export default function TeamBuilderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Index regulation={"M-B"} />
    </Suspense>
  );
}
