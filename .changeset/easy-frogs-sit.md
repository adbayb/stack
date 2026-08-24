---
"@adbayb/stack": minor
---

Update snapshot versions to use Unix timestamps for chronological SemVer ordering and the commit SHA as a secondary prerelease identifier for traceability (e.g. 1.0.0-next.1787559720.70d4843). SemVer build metadata is not used since npm [strips](https://github.com/npm/cli/issues/1479) `+xxxx` build metadata on publication.
