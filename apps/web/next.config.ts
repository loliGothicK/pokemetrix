import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { access, symlink } from "node:fs/promises";
import { join } from "node:path";
import type { Compiler, Compilation, Configuration, WebpackPluginInstance } from "webpack";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "archives.bulbagarden.net",
        port: "",
        pathname: "/wiki/**",
        search: "",
      },
      {
        protocol: "https" as const,
        hostname: "championsbattledata.com",
        port: "",
        pathname: "/pokemon_champions_assets/**/*.png",
        search: "",
      },
    ],
  },
  webpack(config: Configuration, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // define plugin
    class SymlinkWebpackPlugin implements WebpackPluginInstance {
      apply(comp: Compiler) {
        comp.hooks.afterEmit.tapPromise(
          "SymlinkWebpackPlugin",
          async (compilation: Compilation) => {
            if (isServer) {
              const from = join(compilation.options.output.path || "", "../static")
              const to = join(compilation.options.output.path || "", "static")

              try {
                await access(from)
                return
              } catch (error: any) {
                if (error?.code !== "ENOENT") {
                  throw error
                }
              }

              await symlink(to, from, "junction")
              console.log(`created symlink ${from} -> ${to}`)
            }
          }
        )
      }
    }

    // add plugin
    if (!config.plugins) config.plugins = []
    config.plugins.push(new SymlinkWebpackPlugin())
    return config
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "mitama",

  project: "pokemetrix",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
