---
"@ecency/sdk": minor
---

Remove discontinued post-boost operation builders (`buildBoostOp`, `buildBoostOpWithPoints`). The post-boost feature (paying points to get a post upvoted) was discontinued; the backend no longer processes the `ecency_boost` custom_json, so these builders were dead code. Account Boost+ (`buildBoostPlusOp`) and Promote (`buildPromoteOp`) are unaffected.
