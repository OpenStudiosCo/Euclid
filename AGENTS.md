# Agent instructions

Guidance for coding agents working in the Open Studios Image to Vector Converter (Euclid) repository.

This is a focused WordPress plugin: it extends the Media Library image editor so raster images can be converted to SVG in the browser, then saved safely into the Media Library.

**Prefer comprehensibility, craftsmanship and collaboration over merely producing code that works.**

The objective is not to produce the most conventional, compact or sophisticated implementation. It is to contribute software that is coherent, understandable, maintainable and appropriate to a small WordPress plugin with a clear job.

An agent should approach this repository as a thoughtful collaborator, not a code generator.

## 1. Engineering philosophy

### Code as architectural storytelling

Treat code as architectural storytelling.

The structure of the plugin should reveal its essential concepts, responsibilities and relationships. Another developer should be able to understand how something works by exploring the shape of the code itself.

- Name elements after their purpose in the conversion workflow (launch, tools, preview, integration, save).
- Organise related concepts into folders that communicate their purpose (`js/ui/`, `js/integrations/`).
- Prefer structures that make the relationships between elements apparent.
- Write methods that describe meaningful actions rather than implementation mechanics.
- Make important behaviour discoverable through names, structure and composition.
- Choose clarity over cleverness, even when the clever implementation is shorter.

Code should be satisfying to read, not just successful to execute.

### Domain-shaped architecture

This plugin favours a small, domain-shaped layout over generic WordPress boilerplate layers.

Concepts are composed from smaller, meaningful parts. Their names and responsibilities should reflect the conversion workflow they represent.

Do not impose mainstream architectural conventions such as MVC, controllers, services or repositories simply because they are familiar.

Follow the natural boundaries of the domain and the established patterns of the project.

For example, this plugin distinguishes between:

- **Bootstrap (PHP)** — WordPress registration, script/style enqueue, AJAX save and SVG sanitisation.
- **Composition root (`js/admin.js`)** — wires UI and integrations onto `window.ositv`.
- **UI modules** — Media Library chrome: launch control, tools panel and preview surface.
- **Integrations** — adapters around tracing libraries (Potrace, ImageTracer).
- **Vendor** — third-party libraries; treat as dependencies, not style references for new first-party code.

These concepts are more meaningful here than forcing everything into generic models, views and controllers.

The architecture should describe the conversion workflow, not the framework used to host it.

### Structure with judgment

Good architecture requires judgment rather than conformity.

- Do not introduce abstractions without a meaningful responsibility.
- Avoid thoughtless boilerplate, unnecessary inheritance and speculative generalisation.
- Do not create an interface, manager, service or utility merely to satisfy a design pattern.
- Prefer composition where it makes relationships clearer.
- Extend an existing concept when it naturally accommodates the new responsibility.
- Introduce a new concept when doing so genuinely improves the architecture.

Originality and experimentation are welcome when the result remains coherent and understandable.

**Simplicity does not mean minimal code. It means minimising the effort required to understand the system.**

### Collaboration and continuity

Software quality includes teamwork, transparency and the ability for others to understand and extend a contribution.

Write code for the next developer, including someone encountering the project for the first time.

Assume that future contributors may not have access to the original author's knowledge or context.

- Prefer discoverability over documentation that merely compensates for unclear code.
- Preserve useful architectural knowledge when modifying existing systems.
- Explain non-obvious decisions and trade-offs.
- Avoid dependencies on undocumented assumptions.
- Make the code easier to understand through the contribution.

Knowledge should survive its original author.

### Evolution over conformity

Some conventions represent deliberate decisions; others are remnants of earlier experiments or commented scaffolding.

Do not confuse historical precedent with architectural intent.

- Respect existing contracts and working behaviour.
- Follow current reference implementations for new work.
- Match local conventions when extending an existing subsystem.
- Recognise technical debt without automatically reproducing it.
- Do not perform unrelated refactoring under the guise of consistency.
- Do not preserve an awkward design merely because it already exists if the task specifically calls for reconsidering it.
- Do not bolt a major architectural migration onto an unrelated ticket.

The goal is to evolve the software responsibly, not freeze it in time.

## 2. Working principles

### Investigate before implementing

Before writing or modifying code:

1. Inspect the relevant implementation and neighbouring modules.
2. Identify how the existing system is composed and where responsibilities belong.
3. Find the call sites, dependencies, registrations and consumers of the affected functionality.
4. Consult Git history when an architectural decision or unusual convention is unclear.
5. Consider whether the requested change fits an existing concept or warrants a new one.

Do not replace code simply because its structure is unfamiliar.

Do not assume an apparent inconsistency is a mistake without understanding its context.

### Prefer focused changes

Keep changes relevant to the requested work.

- Avoid unrelated refactoring and formatting changes.
- Do not introduce additional architectural layers without a demonstrated need.
- Do not rewrite neighbouring systems to accommodate a small feature unless their existing contracts genuinely prevent it.
- Preserve public interfaces and established behaviour unless a change is intentional.
- Consider the consequences for other parts of the codebase before changing shared abstractions.

A contribution should leave the codebase more coherent, not merely larger.

### Agent collaboration

When working as a coding agent, prefer narrow tasks that move one responsibility into the right place.

Broad prompts that attempt to 'fix the architecture' in one pass tend to produce functional results that ruin ownership, boundaries and surrounding code. Prefer a small, single-responsibility change — for example adding a control to `Tools` and wiring it through the active integration — over a sweeping rewrite.

- Functional behaviour is not acceptable if the architecture has been damaged.
- Avoid drive-by churn that is time-consuming to untangle from neighbouring code.
- Prefer reverting a ruined change over spending effort to salvage it.
- Before reverting unsuccessful work, identify which changes belong to the current task. Never discard unrelated or pre-existing modifications.
- Do not treat near-miss refactors as free wins. If the QA cost exceeds the value, abandon them and return to a coherent baseline.
- Finish incomplete placements carefully. Do not assume partial agent work is integrated merely because some of it appeared to run.

### Resolve conflicting guidance

When instructions or conventions appear to conflict, use the following priorities:

1. Preserve correct behaviour and established architectural contracts.
2. Respect the responsibilities and composition of the affected subsystem.
3. Follow local conventions when extending an existing family.
4. Prefer the nominated reference implementations for new work.
5. Apply broader craftsmanship and formatting preferences where they do not conflict with the above.

When a change requires breaking an existing convention, make the reason explicit.

### Validate and communicate

A change is complete when it has been implemented coherently and verified to a reasonable extent.

- Exercise the Media Library image editor flow affected by the change.
- Verify the affected integration points (preview, method switching, save/AJAX), not just the modified function.
- Account for expected edge cases and failure conditions.
- Do not claim to have tested behaviour that has not been tested.
- Report what changed, why it fits the architecture and what remains unverified.
- Identify relevant technical debt without expanding the task to fix everything.
- Prefer work that is solid for this phase over perfectionism or an endless rewrite.
- Prefer an early pivot when a path is architecturally wrong, rather than deepening the wrong model.

Prefer concise, meaningful explanations over lengthy reports of routine actions.

## 3. Reference implementations

For new work, prefer the conventions demonstrated by the first-party files on `master`:

- `openstudios-image-to-vector-converter.php` — WordPress bootstrap, enqueue, script-module data, AJAX save, capability checks, SVG sanitisation and Media Library attachment creation.
- `js/admin.js` — composition root: initialise `window.ositv`, construct UI and integrations, switch method, submit SVG.
- `js/ui/LaunchButton.js` — small UI module that injects Media Library chrome and toggles the panel.
- `js/ui/PreviewArea.js` — preview surface ownership and method-aware `loadSVG()`.
- `js/ui/Tools.js` — output options panel and method selector.
- `js/integrations/PotraceIntegration.js` — black-and-white tracing adapter with `createSVG`, `preview` and `save`.
- `js/integrations/ImagetracerIntegration.js` — colour tracing adapter with the same integration surface.
- `css/admin.css` — minimal admin styling that extends WordPress image-editor classes rather than inventing a parallel design system.

These are the hand-written baselines for WordPress integration, client composition, UI injection and tracing adapters.

Do not treat other first-party files as style or architecture authority unless they already exist on `master`.

However, do not mechanically copy these implementations into unrelated subsystems.

Understand the principles they demonstrate and apply those principles where appropriate.

Do not treat `vendor/` libraries as formatting or architecture references for new first-party code.

## 4. Repository architecture

### Repository layout

- `openstudios-image-to-vector-converter.php` — plugin entry point and server-side save path.
- `js/admin.js` — browser composition root for the Media Library editor extension.
- `js/ui/` — DOM/UI modules that extend the WordPress image editor.
- `js/integrations/` — adapters around vectorisation libraries.
- `css/` — admin styles for the editor UI.
- `vendor/` — third-party tracing and sanitisation libraries.
- `assets/` — WordPress.org / store screenshots and icons.
- `languages/` — translation template(s).

Server-side WordPress concerns belong in the PHP entry file (or carefully introduced PHP modules if the entry file genuinely outgrows its role).

Browser UI and tracing behaviour belong in `js/`.

Do not move tracing algorithms into PHP without a clear reason: the established design keeps conversion in the browser and persists only the resulting SVG through AJAX.

### Composition model

The primary browser composition root is `window.ositv`, created and wired in `js/admin.js`.

New browser subsystems should normally be integrated into that tree, for example:

- `window.ositv.launchButton`
- `window.ositv.preview`
- `window.ositv.tools`
- `window.ositv.potrace`
- `window.ositv.imagetracer`
- `window.ositv.method`
- `window.ositv.src`

Do not introduce a parallel global application singleton or dependency-injection container simply to avoid working with the established architecture.

The composition root is an integration mechanism, not permission for every module to depend on every other module.

Prefer explicit local dependencies where practical while maintaining compatibility with the existing application.

#### String-based and global callbacks

Some UI controls call methods through global paths such as:

`window.ositv.changeMethod()`
`window.ositv.save()`

These paths are effectively runtime contracts.

Renaming, relocating or replacing a method without updating its string-based references may cause silent failures.

Search for indirect references before changing public methods or properties on `window.ositv`.

### Responsibility boundaries

- **UI modules** own Media Library DOM injection and user controls.
- **Integrations** own library configuration, preview generation and save preparation for a vectorisation method.
- **`js/admin.js`** owns wiring, method switching and the shared AJAX submit helper.
- **PHP** owns capability checks, nonce verification, SVG sanitisation and attachment creation.

Do not push Media Library DOM work into integrations, or tracing library details into UI modules, unless a temporary bridge is genuinely required and kept obvious.

When extending an existing family, follow its established integration pattern rather than imposing a different one.

### Adding a vectorisation method

There is no need for a generic plugin framework around every new tracer.

Before introducing a new method:

1. Inspect `PotraceIntegration` and `ImagetracerIntegration` on `master`.
2. Decide whether the work belongs in an existing integration or a new integration class beside them.
3. Wire construction and method switching through `js/admin.js` and `js/ui/Tools.js` in the same style as the existing methods.
4. Keep `preview()` and `save()` as the public surface unless there is a strong reason to change that contract.

Introduce only the layers genuinely required by the method's responsibilities.

## 5. Modules and naming

### Module organisation

Prefer default-exported classes for stateful, long-lived subsystems.

Examples from the reference implementations:

- `LaunchButton`
- `PreviewArea`
- `Tools`
- `PotraceIntegration`
- `ImagetracerIntegration`

Prefer named function exports for reusable procedures without independent lifecycle or state.

Choose the module structure that communicates responsibility most clearly.

### Naming conventions

- Use PascalCase for new UI and integration classes, matching the existing modules.
- Use camelCase for method names and `window.ositv` properties.
- Prefer story-shaped method names that describe meaningful actions (`loadSVG`, `changeMethod`, `createSVG`, `submitFile`).
- Prefix WordPress PHP functions, handles and actions with `ositv_` / `ositv-` as the existing plugin does.
- Keep CSS hooks aligned with WordPress image-editor conventions (`imgedit-*`) and the plugin's `ositv` / `imgedit-ositv` markers.

Prefer a name that reveals the purpose of a method over a generic description of its mechanics.

### British English

Use British English in new comments, documentation and commit messages.

Examples:

- `colour`
- `behaviour`
- `finalising`
- `normalise`

Do not rename existing APIs, external interfaces, library option keys or established identifiers merely to change spelling.

## 6. Readable logic

Write logic that can be followed naturally from top to bottom.

- Prefer early returns over deeply nested conditions.
- Use descriptive intermediate variables where they reveal intent.
- Separate meaningful stages of an operation.
- Avoid dense one-liners and clever expressions that obscure behaviour.
- Do not compress several independent operations into one statement simply to reduce line count.

Methods should read like a coherent sequence of actions.

### Failure handling

Use early returns for expected absence, invalid input and recoverable conditions.

Do not silently conceal programming errors or broken architectural assumptions.

- On the PHP save path, fail closed with `wp_send_json_error()` after capability, nonce, SVG and attachment checks — as in the reference bootstrap file.
- In the browser, surface save failures clearly to the editor user; do not pretend success when AJAX or tracing failed.
- Avoid defensive try/catch boilerplate that adds no meaningful recovery.
- Do not allow an invalid state to masquerade as successful execution.

Failure handling should be proportionate to the responsibility of the code.

### Comments and documentation

Prefer comments that explain intent, context or a non-obvious decision.

Useful comments describe:

- Why an implementation exists.
- How a particular stage relates to the larger operation.
- An architectural constraint or dependency.
- A non-obvious domain rule.
- A known limitation or deliberate compromise.

Avoid comments that merely repeat the next line of code.

Preserve useful file-level descriptions where modules already use them (for example the short headers on the integration classes).

**Code should explain what it does. Comments should explain why it does it.**

## 7. Formatting

Match the surrounding first-party code, especially the `master` reference implementations listed above.

Common conventions in this repository include:

- Spaces inside parentheses in PHP conditionals where that style is already used (`if ( ! defined( 'ABSPATH' ) )`).
- Semicolons in JavaScript.
- Strict equality (`===`) in new JavaScript.
- ESM `import` / `export default` for first-party modules under `js/`.
- WordPress script modules for the admin bootstrap, with data passed through `script_module_data_ositv-admin-bootstrap`.

Indentation and quoting already vary slightly between modules; prefer local consistency with the file family you are extending over imposing a formatter-driven rewrite.

Do not reformat unrelated code as part of a functional change.

### Example: readable operations

Avoid compact implementations that obscure the operation:

```js
const go=(m)=>{ositv.method=m;ositv.preview.loadSVG();};
```

Prefer code that communicates the operation through its structure, as `changeMethod` does in `js/admin.js`:

```js
window.ositv.changeMethod = function () {
    const method = jQuery("#ositv-vectorisation-method").val();
    window.ositv.method = method;
    window.ositv.preview.loadSVG();
}
```

This example illustrates readability and naming, not a complete validated editor flow.

## 8. WordPress and Media Library concerns

This plugin lives inside WordPress admin UI that WordPress itself owns.

- Extend the image editor carefully; prefer the existing `imgedit-*` hooks and panel patterns used by the reference UI modules.
- Keep enqueue limited to the relevant admin screens (`upload.php`, `post.php`, `post-new.php`) unless a change deliberately widens that surface.
- Preserve nonce checks, capability checks and SVG sanitisation on the save path.
- Do not weaken sanitisation to make tracing output easier to store.
- Treat attachment metadata, alt-text copying and source-id linkage as part of a complete save, not optional extras.
- Leave `vendor/svg-sanitizer` alone unless the task is specifically about updating or replacing that dependency.

When modifying editor behaviour — preview, method switching, save — consider the complete interaction rather than only the underlying function.

Do not assume a feature is complete merely because tracing returned an SVG string.

## 9. Interactive editor behaviour

The quality of the implementation includes its behaviour inside the Media Library editor.

- Understand which module owns preview rendering, method state and save submission before introducing new behaviour.
- Avoid competing preview pipelines for the same method.
- Do not attach repeated listeners without considering cleanup or duplicate initialisation when the editor UI is ready more than once.
- Keep expensive tracing work intentional; preview should remain understandable and responsive for typical logos and flat graphics.
- Prefer straightforward algorithms and sensible resource use over elaborate optimisation machinery without a demonstrated need.

A theoretically faster implementation is not automatically better if its complexity makes further development difficult.

## 10. Experimentation and maintainability

Novel approaches are welcome when they improve tracing quality, editor clarity or maintainability.

Experimentation should remain intentional.

- Understand the limitation a new approach is intended to overcome.
- Prefer contained experiments over speculative architectural rewrites.
- Avoid adding dependencies when existing capabilities already provide a suitable solution.
- Keep experimental decisions understandable and reversible where practical.
- Document discoveries that would help future contributors.

Do not reject an approach merely because it is unconventional.

Equally, do not adopt an approach solely because it is new or fashionable.

The best solution is the one that serves the plugin and remains practical to maintain.

Keep the product focused: logos, icons and flat graphics. Do not expand scope toward full design tooling or photo vectorisation unless the requested work explicitly sets out to do that.

## 11. Completing a contribution

Before considering work complete, review the contribution against the following questions.

**Architecture**

- Does the change belong in the subsystem where it was implemented?
- Does it respect existing ownership and lifecycle responsibilities?
- Does it reuse appropriate concepts without introducing competing abstractions?
- Have relevant integration points and indirect `window.ositv` references been checked?

**Craftsmanship**

- Can another developer understand the implementation from its structure and names?
- Are the important decisions discoverable?
- Is the logic easy to follow?
- Does the contribution avoid unnecessary complexity?

**Behaviour**

- Does the change satisfy the requested behaviour?
- Are relevant edge cases and failure conditions handled?
- Have appropriate checks been exercised in the Media Library editor where practical?
- Has the surrounding functionality (preview, method switch, save) been considered?

**Collaboration**

- Is the change focused and understandable?
- Have any significant trade-offs or limitations been explained?
- Has existing behaviour been preserved where required?
- Is the codebase left in a state that another contributor can confidently continue working with?

Summarise meaningful changes and any unverified behaviour at the end of the task.

Do not manufacture confidence, unnecessary documentation or additional work to make a contribution appear more substantial.

---

## Guiding principle

This plugin should be understandable not only as a collection of functions and classes, but as a coherent conversion workflow: editor chrome, tracing adapters and a careful WordPress save path.

Its architecture should reflect the things it represents, its code should communicate its intentions, and its development should preserve knowledge for the people who build upon it.

**Build software that works, makes sense, and is worth continuing.**
