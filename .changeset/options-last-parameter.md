---
"@adbayb/stack": minor
---

Add a parameter-order rule to the `software-design` skill: required inputs come first and a single options object of optional settings comes last, so a newly required input becomes positional instead of being appended after options. `software-audit` now checks it.
