// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f13af4c27fcd0939219b0712891feb24@o4507108758192128.ingest.us.sentry.io/4511693781139456",
  enabled: process.env.NODE_ENV === "production",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Provide additional OpenTelemetry instrumentations here.
  // Sentry automatically sets up OpenTelemetry under the hood, so only add instrumentations
  // that are not yet supported by the Sentry SDK.
  // See: https://docs.sentry.io/platforms/javascript/guides/nextjs/opentelemetry/using-opentelemetry-apis/
  openTelemetryInstrumentations: [],

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
