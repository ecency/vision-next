# Changelog

## 1.5.22

### Patch Changes

- [`f61eddf`](https://github.com/ecency/vision-next/commit/f61eddfd9386cefdec3df22a0cf8968aed26a806) Thanks [@feruzm](https://github.com/feruzm)! - Fix DMCA configuration handling to prevent crashes when config is undefined or null. Added defensive null checks in account posts query and config initialization.

## 1.5.0

### Breaking changes

- Require caller-supplied access tokens for private API queries and mutations (e.g., drafts, schedules, images, gallery images).
- Update fragments APIs to accept access tokens: `useAddFragment(username, code)`, `useEditFragment(username, fragmentId, code)`, `useRemoveFragment(username, fragmentId, code)`, and `getFragmentsQueryOptions(username, code)`.
- Require access tokens for query options such as `getDraftsQueryOptions`, `getSchedulesQueryOptions`, `getImagesQueryOptions`, and `getGalleryImagesQueryOptions`.
- Require caller-supplied auth data for broadcast helpers instead of reading from SDK storage (e.g., posting key/login type for `broadcastJson` and `useBroadcastMutation`).
