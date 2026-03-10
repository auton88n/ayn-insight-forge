

# Why AYN's Memory Got Worse After Recent Changes

## The Problem

The last change to `systemPrompts.ts` changed the memory section from:

```
YOU REMEMBER ABOUT THIS USER (use naturally when relevant):
- profile/name: {"value":"John","source":"ai_extracted"...}
```

To:

```
BACKGROUND YOU KNOW ABOUT THIS USER (silent context only):
- name: John
Rules: Never say "I remember that you..." or bring up past topics unprompted.
If they start a new topic, follow their lead completely.
Only use this if it genuinely helps answer what they are asking RIGHT NOW.
```

**The new rules are too restrictive.** The instruction "Only use this if it genuinely helps answer what they are asking RIGHT NOW" tells the AI to basically ignore memories most of the time. Combined with "never bring up past topics unprompted" and "follow their lead completely," the AI interprets this as: **don't use memories unless the user explicitly asks about them.**

That's why AYN feels "stupid" now — it knows who you are but the prompt tells it to pretend it doesn't.

## The Fix

### Change 1: Fix memory section wording in `systemPrompts.ts` (line 22-25)

Replace the overly restrictive rules with balanced ones:

```
WHAT YOU KNOW ABOUT THIS USER:
- name: John
- profession: freelance designer
Use this naturally in conversation — greet them by name, reference their work when relevant.
Don't announce "I remember..." — just use it like a colleague who knows them.
Don't repeat the same facts back unless asked.
```

This tells the AI: **use the memory, just don't be weird about it.**

### Change 2: Increase `max_tokens` from 1024 to 1536 in `index.ts` (line 188)

At 1024 tokens, the AI often runs out of space before it can append `[MEMORY:]` tags. This means new facts the user shares get lost because the response gets cut off before the tags. Bumping to 1536 gives enough room for both a good answer AND memory tags.

### Change 3: Fix build error in `send-application-email/index.ts`

Change `npm:resend@2.0.0` to `https://esm.sh/resend@2.0.0` to fix the current build error.

## Summary

The memory system works end-to-end (loading, injection, extraction, saving). The problem is purely in the **prompt wording** — the new rules told AYN to suppress using its memories. We fix the wording, increase token space for reliable tag emission, and fix the build error.

