# Design: Direct File Readers

## Architecture
- We will resolve the active change path dynamically inside NodeJS and use standard filesystem `fs` tools to read it out completely.

## Technical Details
- Read `.openspec` internal pointers or execute a silent status check to find out which feature is active.
- Target `openspec/changes/{feature_name}/proposal|design.md`.
