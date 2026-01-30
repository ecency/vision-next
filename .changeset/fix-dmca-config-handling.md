---
"@ecency/sdk": patch
---

Fix DMCA configuration handling to prevent crashes when config is undefined or null. Added defensive null checks in account posts query and config initialization.
