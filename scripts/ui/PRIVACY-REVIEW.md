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
