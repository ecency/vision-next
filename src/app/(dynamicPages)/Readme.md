# Dynamic pages

---
Dynamic pages represents all pages which matching the same URL but with different section.

Examples:
1. Profile: `/@ecency/<some_subpage>?`
2. Community: `/<some_tag>/hive-125125/<some_section>?`
3. Entry: `/<some_tag>/<author>/<permlink>`
4. Index: `/<some_tag>?`

NextJs cannot declare dynamic routes by regex so the routing stage is on the middleware or rewrites responsibility. Check out: `/features/next-middleware`, `./next.config.js`. 
There is special handler for it.