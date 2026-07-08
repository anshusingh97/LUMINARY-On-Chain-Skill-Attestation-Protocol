# Stellar Soroban Deployment Rules

Whenever working on a Stellar Soroban project, follow these deployment best practices:

1. **Cargo Config for Wasm Target**:
   Always place the following in `.cargo/config.toml` to avoid `reference-types` errors:
   ```toml
   [target.wasm32-unknown-unknown]
   rustflags = [
       "-C", "target-feature=-reference-types",
   ]
   ```

2. **CLI Installation**:
   Use `cargo-binstall` to install `stellar-cli` in GitHub Actions for fast 3-second installations instead of 11-minute compilations:
   ```yaml
      - name: Install cargo-binstall
        run: curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash

      - name: Install Stellar CLI
        run: cargo binstall --no-confirm stellar-cli
   ```

3. **Command Usage**:
   - Always use `stellar` instead of `soroban` in CLI commands.
   - Build with standard `cargo build --target wasm32-unknown-unknown --release` and optimize manually with `stellar contract optimize`.
   - Always deploy the `.optimized.wasm` file, and capture errors using `2>deploy_err.log || { cat deploy_err.log; exit 1; }`.
   - For Native XLM token, do not deploy it; fetch its ID via `stellar contract id asset --asset native --network testnet`.

4. **Contract Hygiene**:
   - Keep contracts small by enabling `#![no_std]` in `lib.rs`.
   - Avoid `String`, `f64`, and heavy formatting.
