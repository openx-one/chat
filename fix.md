# 🚀 PR: Upgrade to Model-Agnostic Chat Architecture

## 🎯 Goal

Make the system:

- Model-agnostic (OpenAI / Claude / Mistral / local models)
- Deterministic in structure
- Tool-safe
- UI-consistent
- Citation-enforced
- Personality-modular
- Self-repairing on format errors

---

# 🧱 1. Architectural Refactor

## ❌ Current Problem

Your system:

- Relies heavily on large system prompt
- Trusts markdown widgets
- Mixes tone + formatting + tool logic
- No output validation layer
- Model decides too much

---

## ✅ New Architecture

```
User
  ↓
Intent Classifier
  ↓
Mode Router
  ↓
Tool Orchestrator
  ↓
Execution Model
  ↓
Output Validator
  ↓
UI Renderer
```

Model becomes just one step.

---

# 🧠 2. Introduce Mode-Based System Prompts

Instead of one mega prompt:

### Add:

```
/core/prompts/
  coreRules.ts
  chatMode.ts
  financeMode.ts
  weatherMode.ts
  researchMode.ts
  codeMode.ts
```

---

## 🧩 Core Rules (Short + Immutable)

Only:

- Output schema rules
- Citation format
- Tool call format
- No personality

Keep this under 800–1000 tokens.

Example:

```ts
export const CORE_RULES = `
You must output valid JSON matching the schema provided.
Never mix explanation outside allowed fields.
Citations must be inline markdown links.
If format invalid, correct yourself.
`;
```

No fluff.

---

# 🎭 3. Personality Becomes a Layer, Not a Rule Engine

Move personality to:

```
/core/personality/
```

Instead of embedding structure:

```ts
export function buildToneLayer(style) {
  return `Tone: ${style}. Affect language only. Do not change format.`;
}
```

Important:

> Personality affects language only. Never structure.

This prevents style conflicts.

---

# 🔧 4. Tool Calling Must Be Controller-Based

Do NOT rely on model to decide tools.

Add:

```
/core/router/intentClassifier.ts
```

Use a small cheap model or rule-based system:

```ts
if (query.includes("stock") || tickerDetected) return "finance";
if (query.includes("weather")) return "weather";
if (urlDetected) return "read_url";
```

Then:

```
/core/tools/toolOrchestrator.ts
```

Flow:

1. Detect intent
2. Execute tool directly
3. Inject tool result into execution model

Model does NOT call tools blindly.

---

# 🧾 5. Replace Markdown Widgets with Typed Responses

Instead of:

```finance
{ ... }
```

Use:

```ts
type ChatResponse =
  | { type: "text"; content: string }
  | { type: "finance_widget"; data: FinanceSchema }
  | { type: "weather_widget"; data: WeatherSchema }
  | { type: "research"; content: string; citations: Citation[] };
```

Model must return:

```json
{
  "type": "finance_widget",
  "data": { ... }
}
```

Then validate using:

- Zod
- JSON Schema
- Ajv

If invalid → retry automatically.

---

# 🛡️ 6. Add Output Validation + Auto-Repair

Create:

```
/core/validator/validateOutput.ts
```

Flow:

1. Parse JSON
2. Validate schema
3. If invalid:

```ts
retryPrompt = `
Your previous output failed schema validation.
Return ONLY valid JSON.
Do not add explanation.
`;
```

Retry up to 2 times.

Never expose formatting errors to user.

This is what makes it robust.

---

# 📚 7. Citation Engine Upgrade

Instead of trusting model fully:

### Add:

```
/core/citations/citationValidator.ts
```

Check:

- Inline markdown link format
- No “More info”
- No empty anchor text
- URL exists in tool result

If invalid → auto-repair.

---

# 🧠 8. Separate Reasoning From Output

For supported models:

Use hidden reasoning.

Ask model:

```
You may think internally.
Final output must match schema exactly.
```

If possible:
Use structured output / function calling.

---

# 🧩 9. UI Renderer Layer

Create:

```
/ui/renderers/
  renderText.tsx
  renderFinance.tsx
  renderWeather.tsx
```

UI should render based on:

```ts
response.type;
```

NOT based on markdown parsing.

Never parse markdown widgets again.

---

# 🔁 10. Add Self-Healing Pipeline

Final flow:

```
callModel()
  ↓
tryParseJSON()
  ↓
validateSchema()
  ↓
if invalid → autoRepair()
  ↓
return final response
```

User never sees broken formatting.

---

# 🏗 11. Model Adapter Layer (True Model Agnostic)

Add:

```
/core/models/
  openaiAdapter.ts
  claudeAdapter.ts
  mistralAdapter.ts
  localAdapter.ts
```

Each adapter:

```ts
generate({
  system,
  user,
  temperature,
  tools,
  schema,
});
```

Normalize:

- Tool calling
- Structured outputs
- Error handling

So your app talks to:

```
ModelInterface.generate()
```

Not vendor-specific API.

---

# ⚡ 12. Add Retry Strategy Matrix

If:

| Error Type       | Action                       |
| ---------------- | ---------------------------- |
| JSON invalid     | Retry with correction prompt |
| Tool failed      | Fallback tool                |
| Citation missing | Retry format-only            |
| Model timeout    | Switch model                 |

That’s robustness.

---

# 📦 13. Reduce System Prompt Size

New prompt assembly:

```
SYSTEM =
  CORE_RULES
+ MODE_PROMPT
+ PERSONALITY_LAYER
+ RUNTIME_CONTEXT
```

That’s it.

No mega prompt anymore.

---

# 🧠 14. Council Mode Upgrade

For multi-agent:

Controller runs:

1. Agent A reasoning
2. Agent B reasoning
3. Validator enforces structured output
4. Final synthesis agent produces schema-valid result

Each agent uses same schema.

This makes council deterministic.

---

# 📊 15. Observability (Add This)

Log:

- Model used
- Retry count
- Validation errors
- Tool execution time
- Token usage

Without telemetry you can’t improve robustness.

---

# 🧩 What Should Be Updated

### Update:

- Remove markdown widgets
- Shrink system prompt
- Separate personality
- Add schema validation
- Add model adapter layer

### Add:

- Intent router
- Tool orchestrator
- Output validator
- Auto-repair loop
- Typed UI rendering
- Retry strategy

---

# 🔥 What Makes It Truly Model-Agnostic

1. Structured schema outputs
2. Controller handles tools
3. Model only generates content
4. Validation layer enforces correctness
5. Adapter layer normalizes APIs
6. Retry system fixes formatting
7. UI renders typed responses

At that point:

You can swap models without rewriting your app.

---

# 🧠 Brutal Truth

Prompt engineering alone = fragile.

Architecture + validation + orchestration = robust.
