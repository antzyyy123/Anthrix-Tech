# DEPENDENCY-GRAPH.md — Ticket dependency graph

Anthrix Lost & Found — Ticket dependencies
Version: 1.0

## Graph (ticket -> depends on)

T-001 -> (none)
T-002 -> T-001
T-003 -> T-001, T-002
T-004 -> T-003
T-005 -> T-003
T-006 -> T-001, T-003
T-007 -> T-003, T-005
T-008 -> T-002, T-003, T-007
T-009 -> T-008
T-010 -> T-009
T-011 -> T-010
T-012 -> T-001, T-002
T-013 -> T-001, T-002, T-003
T-014 -> T-001
T-015 -> T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012, T-013, T-014

## Execution order (topological sort)

Wave 1 (no deps): T-001
Wave 2: T-002, T-014
Wave 3: T-003, T-012, T-013
Wave 4: T-004, T-005, T-006, T-007
Wave 5: T-008
Wave 6: T-009
Wave 7: T-010
Wave 8: T-011
Wave 9: T-015

## Circular dependency check
Verified: no ticket (directly or transitively) depends on itself. Graph is a DAG.

## Parallelization guidance
- Waves can be implemented in parallel within a wave.
- Cross-wave dependencies must be respected (a ticket cannot start until all its dependencies are done).
