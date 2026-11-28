---
"@adbayb/stack": patch
---

Fix the conventional commit workflow in repositories whose default workflow token is read-only: declare the `pull-requests: read` permission the title check needs, and drop the error comment steps, since the failed check already reports the error in its log.
