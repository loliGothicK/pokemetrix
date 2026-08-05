---
description: "Guidelines for scraping wikis protected by Cloudflare"
---
# Cloudflare & Wiki Scraping

When deeply researching obscure mechanics for "Master" difficulty quizzes (e.g., using `https://wiki.pokemonwiki.com/wiki/`), standard HTTP requests and scraping tools (`read_url`, `curl`) will likely be blocked by Cloudflare anti-bot protections.
- Do NOT waste time repeatedly attempting to `curl` or `read_url` these protected domains.
- Instead, immediately recommend and use the `/browser` slash command to spin up an actual browser instance capable of bypassing basic Cloudflare checks.
