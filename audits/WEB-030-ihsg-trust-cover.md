# WEB-030: a distinct market-trust cover

The owner requested a unique cover for the 16 October IHSG edition instead of
the illustration reused from 2 October. The new conceptual artwork depicts a
brass balance on a fractured pedestal, with glass blocks and a stone weight.
It illustrates the report's trust theme; it is not documentary evidence.

Generated with the built-in imagegen tool on 19 October 2026. The complete
prompt and method are recorded in `assets/img/research/covers/ihsg-trust-art.json`.
The 1024 by 1536 original is proportionally encoded as WebP with 640 and 320
pixel responsive variants. No semantic retouch or crop. Website typography
retains the exact catalogue title, issue 014 and publication date. A full
typeset JPEG is exported from the browser. Earlier artwork remains preserved.

Owner follow-up: the balance sits in front of the title using a vector mask
aligned to the existing illustration. Three fine vector fractures cut through
small portions of the title. Both treatments are specific to this cover, retain
the accessible catalogue title, and do not alter the underlying raster artwork.

Validation: JavaScript syntax and metadata JSON parse, 150 passing tests,
and eight desktop/mobile Home and Library checks across both themes.
Browser inspection confirms readable typesetting, no horizontal overflow,
the distinct new asset and the unchanged 2 October cover. Research claims,
charts and calculations are unchanged. The site checker runs before publication.

Codex author QA and publication use the continuing temporary takeover
authorization in AI_COLLABORATION.md while Claude is unavailable.

Publication status: local work is complete at commit 5b1f56c. Repeated GitHub
push/API requests timed out, including an explicit TLS handshake timeout and
a separate 15-second HTTPS request timeout. No PR or live deployment is yet
confirmed. Resume from this branch and publish when connectivity returns.

Publication resumed on 19 October: upload succeeded using an IPv4 connection.
PR #108 contains the owner-selected large title behind the balance, with fine
fractures. The owner explicitly requested publication to GitHub Pages.

