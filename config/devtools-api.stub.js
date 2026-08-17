// Stub for `@vue/devtools-api`.
//
// Vue DevTools is not available in WeChat mini programs, and the real package
// (v7, pulled in by pinia 3) drags in ESM-only dependencies (birpc / hookable)
// that ship optional chaining (`?.`). The mini program compiler can't parse
// that syntax, which is what caused "Unexpected token: punc (.)" in vendors.js.
// Replacing it with a no-op removes that whole subtree from the bundle.
export function setupDevtoolsPlugin() {}
