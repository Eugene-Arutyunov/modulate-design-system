# Remaining screenshot privacy review

The 55 previously unpublished captures were inspected. 37 images were prepared for public use; the following 18 required content replacement before publication (resolved below). Raw images remain in ignored local storage.

- `playground`: prototype
- `playground-redaction`: prototype
- `conversations`: prototype, production
- `conversations-review`: prototype, production
- `conversations-review-detail`: prototype, production
- `conversations-report`: prototype, production
- `dashboard-home`: prototype, production
- `dashboard-usage`: prototype, production
- `dashboard-billing`: production
- `dashboard-organization`: prototype, production
- `dashboard-members`: prototype

Conversation captures contain transcript/summary content and personal-looking fixtures. Overview, Usage and Billing contain usage/financial data. Organization and Members contain organization and member details. Do not approve these by changing metadata alone.

## Native screenshot refresh

53 published images now use field replacement before rendering: four production
Internal tables, followed by 37 prototype and 12 production images. Superseded
untracked raster candidates are archived in ignored private storage.

Platform Usage still needs a canvas-preserving recapture: both full-page and
clipped Chrome screenshot requests timed out. Its existing published image was
not replaced with an incomplete rendering. Production Unverified Signups returned
a load error and retains its previous reviewed capture. These are not new approvals.

## Completed remaining capture publication

The user explicitly approved the remaining anonymized captures and confirmed that
chart content may be retained unchanged. All 18 previously withheld sides are now
included: 10 prototype sides and 8 production sides (17 unique image files; the two
conversation detail rows share the same production view).

Names, emails, identifiers and private account/table fields were replaced before
rendering. Prototype transcript fixtures use synthetic identities. The production
conversation is the observed seeded demo scenario. Overview preserves separately
captured chart pixels; it was captured at 1237px width, so no pixel comparison score
is claimed. Source snapshots and intermediate candidates remain private.

Reviewed all final images visually and with local OCR over 43 overlapping image
regions (2655 recognized lines). No checked original names, emails or identifiers
remained. Verified file hashes immediately before publication; OCR is supplementary
to visual review, not a privacy guarantee.

The public dataset now contains 58 states and 77 unique images. Platform Usage and
Unverified Signups still retain their earlier reviewed images, as noted above;
this refresh does not claim to replace those two existing captures.

## Billing and Usage refresh (30 September 2026)

The redesigned Billing and Usage prototypes and the matching production pages were
recaptured at 1440 × 1000 with field replacement before rendering. Prototype: the
header user name. Production: the header user name, credit balance, lifetime spend,
history and request credits, API key names and all table timestamps (replaced with
valid synthetic dates in the production format). No canvases were present on the
production pages. All four images were reviewed visually before publication; the
four superseded images were removed. The dataset still contains 58 states and 77 images.

The other 45 prototype states were marked stale by shared layout, navigation and
icon changes and were recaptured the same day with field replacement before rendering:
the owner name, email and organization, a member email, a real uploader and
organization name, reviewer initials, and the PII-demo transcript identity (name,
contact details, address, IDs and employer) use the same synthetic values as the
previous refresh. A leftover check blocked capture while any original value remained
visible. Clearly fictional fixtures (example.com users, fictional companies, the
policy number and physician in the transcript) were kept. Production images and
production notes were not recaptured; only the Review Queue and Review Detail notes
were updated for the redesigned prototype.

Later the same day 26 production states (27 rows; Conversation Report reuses the
Review Detail capture) were recaptured with the user's approval from a saved local
session, read-only (GET/HEAD/OPTIONS). All replacements were made in the page before
rendering, with no masks or image edits: table columns (users, recipients, creators,
emails, UUIDs, SES IDs, credit codes, links, organizations and tags), every
non-example email, the owner name and organization, API key names, account values and
internal server IP addresses use synthetic values, and UUID colour dots are re-derived
in the page from the synthetic UUID. A per-state check blocked capture while any
replaced original, non-example email or original IP remained visible. All images were
reviewed visually. Platform Usage was also recaptured, replacing the legacy raster
sanitization (Demo placeholders and empty chart boxes): its canvas charts draw only
model names, series labels, dates and numbers, so they are shown unchanged, while
organization names and member emails in the Top tables are replaced in the page;
distinct organizations receive distinct synthetic names. Captures that showed a load
error or empty data were discarded. The dataset still contains 58 states and 77 images.
