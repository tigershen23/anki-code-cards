In JavaScript, objects stay in memory as long as something still references them (globals, active stack frames, or long-lived registries like event listener lists / timer queues), which can lead to {{c1::memory leaks}}.

setTimeout and addEventListener are examples of {{c2::strong}} references to functions, so the function can’t be {{c3::GC’d}}. If the function is a closure, it also retains its {{c4::lexical environment / captured bindings::what closures keep}}, which can accidentally keep large request-scoped objects alive (e.g. {{c5::request body / init / options / this / other big objects in scope::examples}}) for as long as the callback remains referenced.

Key mental model: a “leak” is often a callback that outlives {{c6::the request it was created for}}, because the callback is registered somewhere long-lived.

In this diff, the original code created fresh arrow functions:

```ts
if (signal) signal.addEventListener('abort', () => controller.abort());
const timeout = setTimeout(() => controller.abort(), ms);
```

Problem setup: when the user passes a {{c7::long-lived AbortSignal::kind of signal}}, the signal keeps a reference to the listener callback {{c8::forever unless removed::listener lifetime}}. Even though AbortSignal’s "abort" fires {{c9::at most once::how many times}}, the listener can still remain in the signal’s listener list if you don’t remove it (dead weight). Across many requests, that piles up into {{c10::lots of unreachable-to-you but still-reachable-to-GC callbacks::what accumulates}}, and if those callbacks retain big scopes, you can see {{c11::huge memory growth (e.g. ~1GB in very long sessions)::symptom}}.

The fix did two orthogonal things: (1) {{c12::bound callback instead of arrow closure::technique}} and (2) {{c13::auto-unsubscribe after first run::lifetime control}}.

```ts
const abort = {{c14::controller.abort.bind(controller);}}
if (signal) {{c15::signal.addEventListener('abort', abort, { once: true });}}

const timeout = {{c16::setTimeout(abort, ms)}};
```

Why {{c17::{ once: true }::option}} matters: it ensures the event listener is removed automatically after it runs once

Why {{c18::.bind(controller)::method}} still matters: it creates a callback whose retained graph is much {{c19::smaller::size}}.
