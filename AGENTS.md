# Repository Guidelines

## Project Structure & Module Organization
The Rust engine lives in `src/`, split into modules such as `parser/`, `vm/`, and `automata/`, while shared traits sit in `src/lib.rs`. Integration tests belong in `tests/`, benches in `benches/`, reusable sample patterns in `fixtures/`, and CLI playgrounds in `examples/` so they can be run via `cargo run --example lexer_probe`; keep new directories snake_case and register them in `Cargo.toml`.

## Build, Test, and Development Commands
Run `cargo check` for quick validation, then `cargo build --all-targets` before pushing to ensure every binary and example still links. Use `cargo test --all-features` for the full suite, `cargo bench` for DFA/NFA performance baselines, and always finish with `cargo fmt --all` followed by `cargo clippy --all-targets --all-features -D warnings` since CI follows the same order.

## Coding Style & Naming Conventions
Stick with Rust 2021 defaults: four-space indentation, trailing commas for multiline literals, and module/file names in snake_case. Public types use UpperCamelCase, extension traits end with `Ext`, error enums end in `Error`, and any non-trivial algorithm should carry a `///` doc comment referencing relevant papers or invariants; never hand-edit generated artifacts in `target/`.

## Testing Guidelines
Unit tests live next to their modules behind `#[cfg(test)]`, while multi-pattern or UTF-8 regression cases belong in `tests/` files named `<feature>_spec.rs` with short comments describing the fixture. Before merging, run `cargo test -- --nocapture` to watch panic messages, add regression coverage for parser/optimizer/VM fixes, and keep parser + VM coverage above 85%; if a grammar rule changes, add a lightweight fuzz invocation via `cargo fuzz run parser`.

## Commit & Pull Request Guidelines
Commits must follow Conventional Commit prefixes such as `feat:`, `fix:`, `perf:`, `test:`, or `docs:` so the changelog stays deterministic. PR descriptions should explain motivation, call out any new feature flags in `Cargo.toml`, attach benchmark deltas for hot-path changes, list manual test commands, link issues with `Fixes #123`, and include screenshots or terminal captures whenever the CLI behavior shifts.

## Security & Configuration Tips
Store catastrophic backtracking samples under `fixtures/security/` and mention them in PRs that modify matching semantics. Secrets stay out of the repo; document configurable items in `.env.example`, and when touching `unsafe` blocks, explain the invariants inline and tag a reviewer comfortable with Rust FFI.
