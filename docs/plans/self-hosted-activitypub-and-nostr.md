# Plan: Self-Hosted ActivityPub and Nostr Publishing

<!-- cspell:ignore ActivityPub WebFinger Fediverse Nostr nostr npub nsec secp D1 R2 DurableObject DurableObjects NIP NIP-05 NIP-23 NIP-19 ndjson idempotency tombstone inbox outbox fanout WebSocket WebSockets blocklist Webmention Webmentions webmention linkback linkbacks repost reposts unmoderated unsanitized Pingback Pingbacks pingback Microformats Microformats2 h-card h-entry IndieAuth Micropub WebSub Atom JSON Feed feeds PKCE -->

## Goal

Operate Gavin's public identity from `gavdaly.com` on both decentralized protocols:

| Protocol    | Public identity      | Content type                                  |
| ----------- | -------------------- | --------------------------------------------- |
| ActivityPub | `@gavin@gavdaly.com` | Actor profile and federated articles          |
| Nostr       | `gavin@gavdaly.com`  | NIP-05 identity and NIP-23 long-form articles |

The site's Markdown content remains the only authoring source. A release publishes the canonical site first, then creates or updates protocol-specific representations from one versioned publication record.

Also support Webmentions as the web-native linkback channel for canonical public posts. Webmentions accept verified references, replies, likes, and reposts from independent websites; they do not create another identity or replace ActivityPub/Nostr.

## Scope and initial boundary

This work creates a self-hosted ActivityPub service and a self-hosted Nostr publishing gateway. It does **not** initially operate a public Nostr relay. The gateway signs and publishes Gavin's events to a configured set of independent relays; the existing `/.well-known/nostr.json` remains the NIP-05 identity mapping.

Running a personal Nostr relay is a later, separately planned operations project because it adds public WebSocket hosting, event storage/query semantics, retention controls, and abuse handling. The account and its content remain self-controlled without it.

### Legacy linkbacks

Use Webmention as the sole inbound linkback protocol. Do not advertise `rel="pingback"`, an `X-Pingback` header, a TrackBack endpoint, or any XML-RPC endpoint. TrackBack is excluded permanently because it accepts unverified payload content and has a long-standing spam problem. Pingback is a legacy XML-RPC predecessor to Webmention and is not worth accepting on an otherwise modern, self-hosted service.

An outbound Pingback fallback is deferred, not committed: after Webmention sending is operating, measure how often an eligible linked target offers only Pingback. Add a tightly scoped sender only if that compatibility benefit is material. It must reuse the outbound URL-safety, queue, retry, and audit controls; it must not imply receiving Pingbacks.

## Recommended interoperability additions

Prioritize these additions in the following order. They strengthen the canonical site and work alongside ActivityPub, Nostr, and Webmentions without creating another content source of truth.

### Foundation: Microformats2 and verified identity links

1. Mark the homepage/profile as an `h-card` and every public post as an `h-entry`, including author, publication/updated time, canonical URL, title, and content semantics.
2. Add `rel="me"` links for the verified ActivityPub profile, Nostr profile, and other identity profiles once they are live.
3. Use the same canonical URLs in HTML, feeds, ActivityPub objects, Nostr tags, and Webmention targets.

This improves portable post interpretation and lets the Webmention verifier classify replies, likes, and reposts without inventing site-specific markup.

### Baseline distribution: RSS, Atom, and JSON Feed

1. Implement the existing roadmap item for RSS, Atom, and JSON Feed from the same publication manifest used by federation.
2. Offer a primary posts feed first, then decide whether notes and projects deserve separate feeds. Add HTML discovery links, stable item IDs/permalinks, conditional GET support, and explicit update timestamps.
3. Treat feeds as read-only distribution: no private entries, drafts, or preview content. Publish a feed before enabling outbound federation so it is a dependable, protocol-neutral fallback.

Feed readers can use RSS/Atom immediately; JSON Feed provides a simpler modern format and can advertise a WebSub hub later if real-time subscriber delivery becomes necessary.

### Owner authorization: IndieAuth

1. Add IndieAuth after the site's human identity page and `rel="me"` links are stable.
2. Limit the first release to Gavin's administrative sign-in and short-lived, scoped publishing tokens. It must not become a general public account system.
3. Prefer passkey-backed or otherwise strong owner authentication, strict redirect URI validation, PKCE, audit logging, revocation, and separate preview/production clients.

IndieAuth makes `https://gavdaly.com/` a portable login identity and is the correct authorization foundation if an external publishing client is introduced.

### Deferred authoring and push delivery: Micropub and WebSub

- **Micropub:** add only when Gavin wants to create/edit posts from a dedicated mobile/editor client rather than through Git/Markdown. Its endpoint must write through the same content-review and publication pipeline; it must not bypass frontmatter validation or directly federate drafts.
- **WebSub:** add only if feed consumers need near-real-time updates. It requires a hub, subscription verification, callback security, and expiry renewal; ordinary conditional feed polling is sufficient at launch.

## Explicit non-priorities

- Do not add an AT Protocol/Bluesky implementation until there is a specific publishing or audience need; it would add a third federation model and another synchronization surface.
- Do not publish NodeInfo for a single-person actor service unless a client demonstrably requires it; it describes server/instance metadata, not the content workflow.
- Do not add Micropub before IndieAuth, or enable it for public users.

## Architecture decisions

1. Keep the static Astro site on Cloudflare Pages. Create a standalone Cloudflare Worker for protocol logic; Pages Functions cannot deploy a Durable Object themselves but can bind and proxy to a Worker that owns one.
2. Route the same-domain protocol endpoints through thin Pages Functions to a private service binding. This preserves `gavdaly.com` as the public actor domain while isolating federation code from the website request middleware.
3. Use D1 as the cross-service system of record and R2 only for durable, larger source snapshots or media when needed. Do not use KV for canonical protocol state.
4. Use one SQLite-backed `ActorCoordinator` Durable Object for the single `gavin` actor. It is the coordination atom for follower mutations and idempotency; it does not perform high-fanout delivery.
5. Use Cloudflare Queues for outbound ActivityPub delivery and Nostr relay publication. Consumers retry transient errors and record a terminal failure for operator review.
6. Keep ActivityPub and Nostr keys separate. Generate both offline, store them as distinct encrypted Cloudflare secrets, and never expose either key to browser code, build logs, D1, analytics, or Git.
7. Treat `gavdaly.com` as canonical. Every federated object links back to its HTTPS permalink, and edits/deletions propagate from that canonical record.
8. Implement Webmentions inbound-first. Receive a notification quickly, verify it asynchronously, and require moderation before displaying any remote author/content metadata. Add outgoing Webmentions only after the verification and operations path is proven.
9. Do not bridge interactions automatically between protocols. An ActivityPub Follow, Nostr reply, or Webmention remains native to its network unless a later, explicit cross-posting policy is approved.

## Public route contract

Implement these endpoints before publishing any content:

| Route                     | Method | Responsibility                                                                                                                                       |
| ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/.well-known/webfinger`  | GET    | Resolve `acct:gavin@gavdaly.com` to the ActivityPub actor URL with JRD content type.                                                                 |
| `/users/gavin`            | GET    | Return the ActivityStreams `Person` document when the request accepts ActivityPub JSON; otherwise serve a human-readable profile or redirect to one. |
| `/users/gavin/inbox`      | POST   | Verify inbound signatures; accept Follow and Undo of Follow; reject unsupported activities explicitly.                                               |
| `/users/gavin/outbox`     | GET    | Return a paginated public ActivityPub collection.                                                                                                    |
| `/users/gavin/followers`  | GET    | Return the public follower collection according to the chosen privacy policy.                                                                        |
| `/.well-known/nostr.json` | GET    | Retain the `gavin` NIP-05 mapping and add relay metadata only after the chosen relay list is stable.                                                 |
| `/webmention`             | POST   | Accept form-encoded `source` and `target` notifications for eligible canonical posts and enqueue verification.                                       |

Set `application/activity+json` or the required JSON-LD profile content type for protocol documents. Apply cache headers only to immutable public actor and published-object responses; do not cache inbox responses, authenticated administration, or follower mutations.

Advertise the Webmention endpoint on every eligible canonical post through an HTTP `Link: </webmention>; rel="webmention"` header and an HTML `<link rel="webmention">` element. A target URL outside the supported public post set is rejected even if the endpoint is discoverable.

## Data model

Add a new sequential D1 migration. Use stable internal UUIDs and preserve all external protocol identifiers.

- `federation_publications`: canonical path, content hash, source revision, title, summary, published/updated/deleted timestamps, and visibility.
- `activitypub_followers`: remote actor URL, inbox/shared-inbox URL, public key material, follow activity ID, status, and audit timestamps.
- `activitypub_deliveries`: publication/activity ID, target inbox, attempt count, status, last error code, retry time, and idempotency key.
- `nostr_publications`: canonical publication ID, event ID, `d` tag value, relay URL, status, and published timestamp.
- `federation_inbox_receipts`: remote activity ID and a bounded retention timestamp, preventing duplicate Follow/Undo side effects.
- `federation_audit_log`: minimal event metadata for operator debugging; exclude body text, private keys, authorization headers, and remote inbox payloads.
- `webmentions`: normalized source/target pair, verification state, response type, discovered author/name/photo/source excerpt, content hash, moderation state, timestamps, and last verification error. Make `(source, target)` unique.
- `webmention_deliveries`: outgoing source/target pair, discovered endpoint, status, retry metadata, and idempotency key.

Keep the Durable Object's SQLite store limited to short-lived coordination state and a durable idempotency ledger. Persist all data needed for reporting, recovery, and administration in D1.

## Implementation phases

### 1. Establish the Worker boundary and local development

1. Add a dedicated Worker package (for example, `workers/federation/`) with its own Wrangler configuration, TypeScript config, tests, and deployment script.
2. Declare the `ActorCoordinator` Durable Object with SQLite storage in the Worker configuration. Bind that Worker to the Pages project using a service binding and a Durable Object binding with the required Worker script name.
3. Add Pages Function route proxies for the public protocol paths. Keep proxy functions free of protocol business logic.
4. Extend the shared function environment types only with bindings needed by the proxies; define the federation Worker's richer environment separately.
5. Document local startup: run the federation Worker and `wrangler pages dev` concurrently, binding the local service and Durable Object as Cloudflare requires.

### 2. Build safe protocol discovery and public read endpoints

1. Implement and test WebFinger parsing and JRD responses. Reject resources other than the exact `acct:gavin@gavdaly.com` identity.
2. Implement the actor document with an HTTPS actor ID, public signing key, inbox, outbox, followers, preferred username, profile metadata, and canonical website URL.
3. Implement public outbox, followers, and article-object reads backed by D1, including cursor/page handling and explicit content negotiation.
4. Create a human-readable Fediverse profile page in Astro that explains the paired handles and links to the Nostr note. Enable only links whose endpoint verification has passed.
5. Add cache-control, `Vary: Accept`, and security-header coverage without weakening the existing site CSP.

### 3. Implement controlled ActivityPub following

1. Add HTTP-signature verification, remote actor retrieval, key lookup/refresh, timestamp/replay checks, payload-size limits, and strict JSON schema validation.
2. In the inbox, support only public `Follow` and `Undo(Follow)` initially. Route accepted mutations through `ActorCoordinator` using deterministic `getByName("gavin")` routing.
3. Persist the receipt before sending side effects. Create and queue a signed `Accept` activity only after follower state is durable.
4. Reject direct messages, private addressing, malformed objects, blocked domains, and unsupported activity types with intentional status codes; log only sanitized metadata.
5. Add an operator-managed blocklist and a simple follower policy: automatic accept for public follows at launch, with a documented switch to manual approval if spam requires it.

### 4. Publish Markdown content to both networks

1. During the Astro build, generate a non-public publication manifest from eligible `posts` entries: canonical URL, slug, title, description, tags, body Markdown, timestamps, and content hash. Exclude drafts, notes, projects, and any entry lacking an explicit federation opt-in.
2. Add explicit federation frontmatter to the posts schema, initially `federation: published | excluded`. Default new posts to `excluded` so distribution is intentional.
3. After the Pages deployment is live, invoke an authenticated internal publication endpoint with the manifest revision. The endpoint fetches or receives the manifest, compares hashes, and persists a `federation_publications` record before sending protocol work.
4. For ActivityPub, generate a public `Article` object plus a `Create` activity that includes the canonical URL and distributes it to follower inboxes through the delivery queue.
5. For Nostr, create a signed NIP-23 `kind:30023` event using the stable post slug as its `d` tag. Include `title`, `summary`, `published_at`, `t` tags, and the canonical URL; publish it through the relay queue.
6. On a post edit, issue an ActivityPub `Update` and publish the newer addressable Nostr event. On a post removal, issue an ActivityPub `Delete`/tombstone and a Nostr deletion request only after a deliberate operator action.
7. Make every queue handler idempotent. A retry may repeat a network request, but must not create a second local publication or follower relationship.

### 5. Receive and display Webmentions safely

1. Add the `/webmention` Pages Function proxy and a service endpoint that accepts only `application/x-www-form-urlencoded` `source` and `target` fields. Validate syntax, require HTTPS, normalize the target, reject self-mentions, and synchronously reject any target that is not an eligible canonical post.
2. Store an unverified receipt keyed by the normalized `(source, target)` pair and return `202 Accepted`. Enqueue verification rather than fetching an untrusted source URL in the request path.
3. In a dedicated queue consumer, fetch the source with strict SSRF controls: DNS/IP deny rules for loopback, private, link-local, and Cloudflare-internal addresses; an HTTPS-only policy; bounded redirect count; timeout; response-size cap; and an allowlist of parsable public media types.
4. Verify that the fetched source contains an exact link to the canonical target. If the source is gone or no longer links to the target, mark the existing Webmention deleted rather than creating a duplicate.
5. Parse a verified source's h-entry when present and classify it as reply, like, repost, or generic mention using the standard link properties. Sanitize all displayed text/HTML and retain only the minimal preview fields needed by the UI.
6. Build an initially moderation-only operator view. Do not display remote content on posts until it is explicitly approved; when the display UI is introduced, render plain text/excerpts and link to the source rather than injecting remote HTML.
7. Periodically re-verify approved Webmentions and provide moderation actions for approve, hide, delete, and block-source-domain. Record moderation decisions without retaining raw hostile payloads.

### 6. Send Webmentions after publication is stable

1. Extend the publication manifest with the canonical outbound links found in each eligible rendered post. Exclude self-links, fragments, non-HTTP(S) URLs, images/assets, and untrusted generated content.
2. After the canonical post is publicly available, discover each target's endpoint in this order: HTTP `Link` header, then the first HTML `<link rel="webmention">`, then the first `<a rel="webmention">`.
3. Queue an `application/x-www-form-urlencoded` delivery containing the canonical post URL as `source` and the linked URL as `target`. Re-discover the endpoint on edits before re-sending notifications.
4. Apply the same outbound URL controls used for inbound verification, including rejecting loopback/private addresses and avoiding credentials in URLs. Treat any `2xx` response as a successful notification and persist delivery state.
5. When a post is deliberately removed, serve a tombstone/`410 Gone` representation before re-sending its previous Webmentions so receivers can remove stale interaction data.

### 7. Build outbound reliability and operations

1. Configure independent queues for ActivityPub delivery and Nostr relay publishing. Use bounded exponential retry, a dead-letter path, and a D1-backed operator review status.
2. Process ActivityPub deliveries by resolving the target actor's inbox or shared inbox, signing the request with the ActivityPub key, and recording each attempt.
3. Process Nostr publications over relay connections with acknowledgements from each configured relay. Mark a publication successful when it meets the documented relay quorum; retain per-relay failures for retry.
4. Add Cloudflare Observability events for accepted follows, rejected requests, queue retries, delivery success/failure, and relay acknowledgements. Do not log post bodies, remote authorization headers, or signing material.
5. Write a key-rotation and incident runbook covering compromised keys, compromised remote actor payloads, relay removal, emergency publication pause, data export, and account retirement.

### 8. Test, stage, and launch

1. Add unit tests for WebFinger, actor content negotiation, signature validation failures, follow idempotency, JSON generation, Nostr event construction, and content eligibility.
2. Add Durable Object tests with `@cloudflare/vitest-pool-workers` for serialized follower transitions, duplicate deliveries, and persisted restart recovery.
3. Add Pages/Worker integration tests for all public route proxies, expected content types, CORS behavior, cache headers, and unauthorized publication requests.
4. Add Webmention tests for invalid targets, duplicate submissions, source/target verification, redirects, deleted sources, SSRF attempts, escaped display text, and moderation state transitions.
5. In a staging environment, test with a controlled ActivityPub actor, test relays, and a public Webmention sender/receiver fixture. Verify discovery, follow/accept, unfollow, article delivery, post updates, Nostr NIP-05 verification, NIP-23 rendering, and Webmention verification.
6. Deploy discovery endpoints first, then the actor and inbox, then a single opted-in post, then inbound Webmentions in moderation-only mode, and finally public following/outgoing Webmentions. Monitor failures before enabling automatic publication for additional posts.

## Security and privacy requirements

- Use separate production and preview D1 databases, queue bindings, service bindings, and signing secrets. Preview must never federate as the production identity.
- Require a deployment-held secret for publication administration; browser requests must have no publish capability.
- Rate-limit and size-limit public inbox requests before expensive remote fetches or signature work.
- Validate every remote URL, prohibit private-network destinations, cap redirects, and time-bound remote actor fetches to prevent SSRF and resource exhaustion.
- Treat Webmention source and endpoint fetches as untrusted outbound requests with the same SSRF, redirect, size, timeout, and content-type controls as remote actor fetches.
- Escape or sanitize all remote Webmention-derived display fields, require moderation before publication, and never render remote HTML directly.
- Store the smallest viable set of follower and delivery metadata; publish a retention policy before launch.
- Include a public contact and abuse-report path, plus an emergency protocol-publishing kill switch.

## Acceptance criteria

- `@gavin@gavdaly.com` resolves from a compatible ActivityPub client to an actor hosted on `gavdaly.com`.
- `gavin@gavdaly.com` resolves through NIP-05 to the existing Nostr public key, with documented relays.
- A post marked `federation: published` appears at its canonical HTTPS URL, in the ActivityPub outbox, and as a signed NIP-23 event; drafts and excluded posts never publish.
- An eligible canonical post advertises `/webmention`, accepts only verified Webmentions, and never displays unmoderated or unsanitized remote content.
- Outgoing Webmentions are sent only after the canonical source page is live and are safely retried without duplicate records.
- Releasing the same manifest twice is safe and produces no duplicate local records or follower state changes.
- Follow and undo-follow are safely handled; unsupported/private inbound activities are rejected without storing sensitive payloads.
- Queue failures are observable, retryable, and reviewable without leaking keys or private content.
- Production, preview, and local development identities are isolated.

## Deferred decisions

- Whether to operate a personal Nostr relay after the publishing gateway is stable.
- Whether replies/comments become read-only links, ActivityPub inbox interactions, Nostr NIP-22 comments, or remain off-site.
- Whether images and attachments are copied to R2 and represented in protocol objects.
- Whether follower approval stays automatic or changes to manual moderation.
- Whether direct messages, private posts, and non-post content types are ever supported. They are out of scope for the initial release.
- Whether the moderation-only Webmention workflow becomes automatic for trusted sources, and which interaction types appear on public post pages.
- Whether measured compatibility demand justifies an outbound-only Pingback fallback. Receiving Pingback and all TrackBack support remain out of scope.

## References

- [ActivityPub Recommendation](https://www.w3.org/TR/activitypub/)
- [NIP-05: Mapping Nostr keys to DNS-based internet identifiers](https://github.com/nostr-protocol/nips/blob/master/05.md)
- [NIP-23: Long-form Content](https://github.com/nostr-protocol/nips/blob/master/23.md)
- [Cloudflare Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/reference/how-queues-works/)
- [Cloudflare Durable Objects rules](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)
- [Webmention Recommendation](https://www.w3.org/TR/webmention/)
- [Post Type Discovery](https://www.w3.org/TR/post-type-discovery/)
- [IndieWeb: Pingback](https://indieweb.org/pingback)
