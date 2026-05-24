import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(21,101,192,0.18), transparent 30%), linear-gradient(180deg, #f3f6fb 0%, #eef3f8 100%)",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border: "1px solid rgba(21,101,192,0.12)",
            borderRadius: 4,
            p: { xs: 3, md: 8 },
          }}
        >
          <Stack spacing={6}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              sx={{
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
              }}
            >
              <Stack spacing={2} sx={{ maxWidth: 640 }}>
                <Typography
                  variant="h1"
                  sx={{ fontSize: { xs: "3rem", md: "4.5rem" }, lineHeight: 0.96 }}
                >
                  Pokemetrix
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: { xs: "1rem", md: "1.125rem" }, maxWidth: 560 }}
                >
                  The app now uses Material UI for layout, typography, actions, and surfaces, with a
                  Next.js 16 App Router cache provider behind it.
                </Typography>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Button
                color="primary"
                endIcon={<ArrowOutwardRoundedIcon />}
                href="https://mui.com/material-ui/integrations/nextjs/"
                rel="noopener noreferrer"
                size="large"
                target="_blank"
                variant="contained"
              >
                MUI Next.js guide
              </Button>
              <Button
                color="primary"
                href="https://nextjs.org/docs"
                rel="noopener noreferrer"
                size="large"
                target="_blank"
                variant="outlined"
              >
                Next.js docs
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
              <Paper elevation={0} sx={{ flex: 1, borderRadius: 2, bgcolor: "grey.50", p: 3 }}>
                <Stack spacing={1.5}>
                  <AutoGraphRoundedIcon color="primary" />
                  <Typography variant="h6">Component-first UI</Typography>
                  <Typography color="text.secondary">
                    Layout and styling now come from MUI primitives rather than utility classes.
                  </Typography>
                </Stack>
              </Paper>
              <Paper elevation={0} sx={{ flex: 1, borderRadius: 2, bgcolor: "grey.50", p: 3 }}>
                <Stack spacing={1.5}>
                  <InsightsRoundedIcon color="secondary" />
                  <Typography variant="h6">Server-rendered styles</Typography>
                  <Typography color="text.secondary">
                    `AppRouterCacheProvider` handles Emotion style collection for the App Router.
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
