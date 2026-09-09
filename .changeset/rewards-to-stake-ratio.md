---
"@ecency/sdk": patch
---

Add `rewardsToStakeRatio(account)`, the rewards/stake coefficient known on Hive as the KE ratio. `curation_rewards` and `posting_rewards` now come through the full account query, so consumers can compute it without a second RPC.
