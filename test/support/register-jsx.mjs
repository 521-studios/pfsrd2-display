// Registers the JSX load hook for `node --test` (see jsx-loader.mjs).
// Wired via `node --import ./test/support/register-jsx.mjs` in the test script.
import { register } from 'node:module'
register('./jsx-loader.mjs', import.meta.url)
