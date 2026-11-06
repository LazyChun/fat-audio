# FatNotes Plugin — Pitfalls & Debugging

Common issues when developing and loading bespoke plugins, with fixes.

## "Invalid hook call" / two copies of React

**Cause:** Plugin bundles its own `react` / `react-dom` instead of sharing the
host's copy.

**Fix:** In `webpack.config.js`, keep all three React packages marked
`singleton: true` and `eager: false`, with versions pinned to `18.2.0`:

```js
shared: {
  react: { singleton: true, requiredVersion: "18.2.0", eager: false },
  "react-dom": { singleton: true, requiredVersion: "18.2.0", eager: false },
  "react/jsx-runtime": { singleton: true, requiredVersion: "18.2.0", eager: false },
  // ...
}
```

Also ensure `src/bootstrap.ts` stays `import("./index")` — synchronous entries
break shared negotiation.

## "Shared module is not available for eager consumption"

**Cause:** You removed `bootstrap.ts` or changed `entry` to `./src/index.tsx`
directly.

**Fix:** Keep `entry: "./src/bootstrap.ts"` and let `bootstrap.ts` dynamically
import `./index`.

## remoteEntry.js 404

**Cause:** The zip was flattened, so `remoteEntry.js` sits next to `plugin.json` instead of inside `dist/`. The host loads `extensions/bespokePlugins/remote/<id>/dist/remoteEntry.js`.

**Fix:** Run `fn-ext pack`. The archive root must look like this:

```
<code>_v<version>.zip
├── plugin.json
├── funcs.json
└── dist/
    ├── remoteEntry.js
    └── ...chunks
```

## "remoteEntryExports is undefined" / Federation Runtime name mismatch

**Cause:** The Module Federation `name` in your `webpack.config.js` doesn't
match the `entryGlobalName` the host expects. FatNotes derives the MF name as
`plugin_<uuid_with_underscores>` from the plugin's assigned UUID, but your
build emits a different global (e.g. the scaffold default `my_plugin`).

**Fix:**

1. Find the UUID assigned by FatNotes for your plugin (visible in the
   Extensions panel or the host console error).
2. Add `"mfName": "plugin_<uuid_underscored>"` to your workspace `plugin.json`.
3. Rebuild. The template webpack config reads `manifest.mfName` automatically.

Or pass it as an env var:

```powershell
$env:PLUGIN_MF_NAME = "plugin_xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx"
npm run dev
```

See also the resolution order in `webpack.config.js`.

## Plugin loads but UI is missing

**Check list:**

1. `activate()` was actually called — add `console.log("[plugin] activate")`
   at the top.
2. You pushed every returned `Disposable` into the cleanup array — missing
   disposables cause ghost contributions on re-toggle.
3. `id` fields in contributions are **globally unique**. Duplicate ids are
   rejected silently by the host registry.
4. `registerSidebarView("secondary", …)` is blocked — use `"primary"`.

## "Cannot find module 'fat-notes-sdk'"

**Cause:** Missing `paths` entry or the `types/fat-notes-sdk.d.ts` file was
deleted.

**Fix:** Keep this in `tsconfig.json`:

```json
"baseUrl": ".",
"paths": { "fat-notes-sdk": ["types/fat-notes-sdk.d.ts"] }
```

## Plugin not showing up after install

1. Verify `extensions/bespokePlugins/remote/<id>/dist/remoteEntry.js` exists
   on disk.
2. Check `extensions/bespokePlugins/bespokePlugins.json` has an entry for
   your id with `active: true`.
3. In FatNotes → **Extensions** → **Custom Bespoke Plugins**, the switch
   must be ON.
4. Tail the FatNotes devtools Console for `[fatNotes]` loader warnings.

## Hot-reload doesn't pick up changes

In `dev` mode the host caches remotes per container name. After rebuilding,
toggle the plugin off/on in the Extensions page to force re-registration
(the host calls `deactivate()` then `activate()` with a bumped remote url).

## Backend host call returns 401

The host requires `X-Fat-Api-Token` on plugin backend HTTP calls. The scaffold
`plugin_runtime.py` reads `FAT_NOTES_API_TOKEN`, which the host sets when it
starts the process. A copied runtime from before that change, or a hand-written
`urllib` / `requests` call, needs the same header.

## Type mismatch after upgrading FatNotes

The SDK contract lives in `fat-notes/src/frontend/pluginSdk/types.ts`.
The scaffold mirror is `types/fat-notes-sdk.d.ts`. They stay aligned except
`Block.Item`, which the mirror redeclares as `PluginBlockItem` so a plugin
project typechecks without the host's global `Block` namespace. When the host
types change, refresh the mirror from that file and keep the `PluginBlockItem`
substitution.

## Build succeeds but the installed plugin has no manifest

`plugin.json` lives at the project root, not under `dist/`. `fn-ext pack` puts it at the zip root next to `dist/` and writes `version`, `code`, and `packageFile` back into the project `funcs.json`. The catalog repo `fat-notes-extension-query` indexes that committed file. `packageFile` must be `<code>_v<version>.zip`, and the Git release tag must be that same version. Do not flatten `dist/*` into the archive root — the host looks for `dist/remoteEntry.js`.

## Event or command leaks between hot-reloads

Every `sdk.commands.register`, `sdk.events.on`, and `sdk.*.onChange` call
returns a `Disposable`. If `deactivate()` forgets any of them, they survive
the next `activate()` and cause double-invocation. Always push into the
disposables array immediately:

```ts
// Good
disposables.push(sdk.commands.register("x", fn));

// Bad — the return value is discarded
sdk.commands.register("x", fn);
```

---

## Backend: "backend invoke failed" / timeout

**Cause:** The plugin backend subprocess crashed or never started.

**Fix:**

1. Check `sdk.backend.isRunning()` — if `false`, the process is dead.
2. Look in the FatNotes devtools console for `[pluginBackend]` errors.
3. Run `python backend/main.py` directly to see Python tracebacks.
4. Make sure you never `print()` to stdout in your backend code (it breaks
   the JSON-RPC protocol). Use `print(..., file=sys.stderr)` instead.

## Backend: "No such handler: xxx"

**Cause:** The handler name in `sdk.backend.invoke("xxx", ...)` doesn't match
any `@handler("xxx")` decorator in `main.py`.

**Fix:** Check spelling and ensure `main.py` actually registers that handler
before `run()` is called.

## Backend: dependencies not found (ModuleNotFoundError)

**Cause:** `requirements.txt` lists a library, but it wasn't installed/vendored.

**Fix:**

- For `depsStrategy: "vendor"`: Rebuild with `fn-ext build` or `fn-ext pack-backend`.
  This runs `pip install --target dist/backend/vendor`.
- For `depsStrategy: "install"`: Delete the `.deps_installed` marker in the
  plugin backend dir and reload the plugin to trigger re-install.
- Make sure system Python has pip available and network access (for install strategy).

## Backend: process starts but frontend gets no response

**Cause:** Your `main.py` doesn't call `run()` at the end, or it calls
`sys.exit()` prematurely.

**Fix:** Ensure `main.py` ends with:

```python
if __name__ == "__main__":
    run()
```

And never call `sys.exit()`, `os._exit()`, or `quit()` in handler code.

## Backend: vendor directory too large

**Cause:** Heavy dependencies (numpy, pandas, torch) produce large vendor dirs.

**Mitigation:**

- Only add libraries you actually need.
- Use lightweight alternatives where possible (e.g. `polars` is smaller than
  `pandas` for some use cases).
- Consider `depsStrategy: "install"` for heavy-dep plugins to keep the zip small.
