---
name: Mongoose ESM import gotcha
description: How to correctly import mongoose's model/models helpers under ESM/tsx runtimes without a SyntaxError.
---

Under Node ESM (e.g. running via `tsx`), `import { Schema, model, models } from "mongoose"` throws:
`SyntaxError: The requested module 'mongoose' does not provide an export named 'models'`.

Mongoose's package only cleanly exposes named exports for some symbols (like `Schema`) under ESM interop, not all of them.

**Why:** Mongoose is primarily a CommonJS package; its ESM wrapper doesn't re-export every property as a named export, so `model`/`models`/`connection` etc. can fail even though they exist on the default export.

**How to apply:** Import the default export and destructure from it:
```ts
import mongoose, { Schema } from "mongoose";
const { model, models } = mongoose;
```
This avoids the SyntaxError while still getting proper types for `Schema`.
