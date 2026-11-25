# Plan: Add Federated-Social Video Resources

<!-- cspell:ignore Microblogging Fediverse scanability Gulaschprogrammiernacht -->

## Goal

Add two timestamped recordings about the Fediverse and the IndieWeb to the site's Nostr/Fediverse resources so visitors can find them alongside related tools and learning material.

## Source

- Video: [EFF Austin Meetup: Indie Microblogging and the Fediverse](https://www.youtube.com/live/mQ8dNGTS3JU?t=434s)
- Publisher: Austin Tech Live
- Start point: 07:14 (`t=434s`), preserving the supplied timestamp rather than linking viewers to the beginning of the livestream.
- Video: [IndieWeb: Publish on Your Own Site, Syndicate Elsewhere](https://media.ccc.de/v/gpn23-134-indieweb-publish-on-your-own-site-syndicate-elsewhere#t=3)
- Publisher: Gulaschprogrammiernacht 2023 / media.ccc.de
- Start point: 00:03 (`#t=3`), preserving the supplied timestamp.

## Scope

- Update `src/content/notes/nostr.md` only.
- Add a small `### Community & Fediverse` subsection under `## Links`.
- Include both recordings as descriptive Markdown links, retaining their exact timestamped URLs.
- Place community and protocol-level resources separately from the existing `### Apps` list, which is reserved for software and services.

## Implementation steps

1. In `src/content/notes/nostr.md`, insert the `### Community & Fediverse` heading after `### Articles` and before `### Pub Key Miners`.
2. Add one bullet for the EFF Austin meetup recording. Use its published title and append a short qualifier such as “(starts at the Fediverse discussion)” only if it improves scanability without restating the heading.
3. Add one bullet for the IndieWeb recording using its published title, keeping the `#t=3` fragment intact.
4. Do not embed an iframe or introduce a video component: the content collection is Markdown-based and its existing external-video resources are ordinary links. This avoids new CSP, responsive-layout, consent, and third-party embed concerns for two references.
5. Leave frontmatter and all unrelated Nostr resources unchanged.

## Validation

1. Run `npm run qa:content` to validate Markdown structure, spelling, and outbound links.
2. Run `npm run build` to confirm Astro can render the updated notes collection.
3. Preview the Nostr note and confirm:
   - the new heading follows the existing hierarchy;
   - both links are visible and have the expected descriptive text;
   - opening each link retains its timestamp and begins near 07:14 and 00:03, respectively.

## Acceptance criteria

- The Nostr note includes both timestamped recordings under a clearly named Fediverse/community subsection.
- Both supplied URLs are preserved exactly, including `?t=434s` and `#t=3`.
- Existing resource groups and frontmatter are unchanged.
- Content QA and the production build pass.
