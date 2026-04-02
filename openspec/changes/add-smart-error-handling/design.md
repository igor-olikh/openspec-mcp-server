# Design: Smart Error Handling

## Architecture
- By intercepting terminal crash errors natively in TS, we output standard JSON-RPC text responses to the LLM masking the raw crash.

## Technical Details
- Parse `stderr`.
- If regex matches validation failure regarding markdown structure, rewrite the error.
