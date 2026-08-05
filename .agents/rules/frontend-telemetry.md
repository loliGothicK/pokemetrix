---
description: "Rules for tracing frontend operations and capturing API errors"
---
# Frontend Telemetry & Error Handling (OTel & Sentry)

When creating or modifying frontend services (e.g., fetching or mutating data in `services/*.ts`), you MUST implement proper observability and error handling. NEVER throw generic errors and expect the user to debug via browser console.
1. **Trace Operations**: Wrap asynchronous operations using `withSpan` from `@/lib/otel`. Use a consistent naming convention like `ui.<domain>.<action>`.
2. **Capture API Errors**: If an API response is not `ok`, extract the error text (e.g., `res.text()`) and use `Sentry.captureException(err, { extra: { ... } })` to send the failure to Sentry. Include relevant context in the `extra` field, such as `res.status`, `dashboardId`, and the request payload. Mark the OTel span as failed (`span.setAttribute("error", true)`).
