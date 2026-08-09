# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server (http://localhost:5173)
npm run build          # production build into dist/
npm run preview        # serve the built output

firebase deploy --only firestore:rules --project budget-tracker-wasin
```

There is no test framework, linter, or typechecker configured — `npm run build` is the only automated check.

Deployment is automatic: pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. Firestore security rules are **not** part of that pipeline; deploy them manually with the command above whenever `firebase-rules/firestore.rules` changes.

## Project context

Single-tenant bookkeeping app for a small Thai partnership (หจก.). All UI text is Thai. Deployed at `https://wns-94002.github.io/budget-tracker/`; Firebase project `budget-tracker-wasin`; GitHub repo `WNS-94002/budget-tracker`.

Four tabs, all rendered from `App.jsx` by an `activePage` string (no router): `home`, `tax`, `cashflow`, `quotation`. The month/year `PeriodSelector` is shared by the first three and hidden on `quotation`.

## Architecture constraints that shape the code

**No authentication, by design.** There is no login screen and Firebase Auth is not initialized at all. Firestore rules are `allow read, write: if true`. Anyone with the deployed URL can read and write everything. Do not add per-user scoping or `request.auth` checks without first changing the auth story — the rules and the app assume a single shared dataset.

**Firebase Spark (free) plan only.** Two paid-plan features were deliberately designed around and must stay avoided:
- *Cloud Storage* requires Blaze, so receipt attachments are stored as base64 **inside the Firestore document** (`image` field). `src/lib/imageCompress.js` enforces the budget against Firestore's ~1 MiB document limit: images are downscaled/JPEG-recompressed to ≤900 KB, PDFs are stored verbatim and rejected above 650 KB.
- *Anonymous Auth* also requires Blaze on new projects, which is why the app has no auth layer.

**Adding a Firestore collection** requires adding a matching `match` block to `firebase-rules/firestore.rules` and deploying the rules, or writes fail at runtime.

## PDF generation — use pdfmake, never jsPDF

This is the single most important constraint in the codebase. Thai stacks a tone mark above an upper vowel (`หนึ่ง` = ึ + ่, `ที่` = ี + ่, `ตั้ง` = ั + ้). jsPDF draws glyphs sequentially without applying the font's OpenType **GPOS** table, so both marks land at the same height and visibly collide. This cannot be fixed by tuning offsets or swapping fonts — it is a jsPDF limitation (parallax/jsPDF#2650, #2778). pdfmake runs on PDFKit + fontkit, which does apply GPOS, and keeps the output as real selectable/searchable text.

Each report is split into two files:
- `*Doc.js` — a **pure** `build*Doc()` returning a pdfmake document definition. No browser APIs, so it can be rendered from Node.
- `*Report.js` — a thin wrapper that loads assets and calls `downloadPdf()`.

| Report | Builder | Wrapper |
| --- | --- | --- |
| Quotation | `quotationDoc.js` | `quotationReport.js` |
| VAT purchase/sales | `vatDoc.js` | `vatReport.js` |
| Income/expense | `incomeExpenseDoc.js` | `pdfReport.js` |

`src/lib/pdfMakeSetup.js` lazy-imports pdfmake, fetches `public/fonts/Sarabun-*.ttf` at runtime and registers them into pdfmake's virtual FS. Fonts are deliberately *not* bundled as base64 so the browser caches them as ordinary files. All report modules are dynamically imported from `App.jsx` so the ~1 MB pdfmake chunk only loads when a download is clicked.

**Verifying a PDF layout change without a browser** — render the pure builder through pdfmake's Node entry point in a throwaway script:

```js
import pdfMake from 'pdfmake'      // Node entry: a singleton, not a class
pdfMake.virtualfs.writeFileSync('Sarabun-Regular.ttf', fs.readFileSync('public/fonts/Sarabun-Regular.ttf'))
pdfMake.setFonts({ Sarabun: { normal: 'Sarabun-Regular.ttf', bold: 'Sarabun-Bold.ttf' } })
await pdfMake.createPdf({ defaultStyle: { font: 'Sarabun', fontSize: 9 }, ...buildQuotationDoc(...) }).write('out.pdf')
```

Then read the PDF back to inspect it visually. Delete the script afterwards.

**Two logo files, not interchangeable.** `public/logo.png` is padded to a square for the round web header badge — ~14% of its height is invisible whitespace, so it can never sit flush against a PDF border. `public/logo-wide.png` is the same artwork tightly cropped, used only by the quotation PDF at aspect ratio `LOGO_ASPECT`.

## Thai domain rules

**VAT.** A transaction's `amount` is always the **gross** (VAT-inclusive) figure. When `hasVat` is set, `splitVatFromGross()` derives `vatBase`/`vatAmount` and stores them as a snapshot on the document. `computeVatSummary()` in `vatSummary.js` is the single source of truth shared by the tax page UI and the PDF, and encodes the legal rules: only `vatInvoiceType === 'full'` expenses count as input VAT, and items flagged `vatCreditBlocked` (ภาษีซื้อต้องห้าม — entertainment, passenger cars) are excluded from the *creditable* total while still being listed.

The VAT PDF reproduces the accountant's existing paper form (merged two-row header, ruled filler rows padding to `TARGET_ROW_COUNT`, totals row). Keep that layout intact — it is matched against real submitted documents.

Other Thai-specific helpers: `bahtText.js` spells an amount in Thai words for the quotation (handles เอ็ด/ยี่ and ล้าน grouping); `taxId.js` validates the 13-digit taxpayer-ID checksum (warn-only, never blocks saving); `toBuddhistYear()` in `categories.js` — years are stored Gregorian and displayed as พ.ศ.

## Other subsystems

**OCR** (`ocr.js`) runs Tesseract.js entirely client-side (`eng+tha`) — free, no API key, images only. `parseReceiptText()` guesses the amount from total-keyword lines and the category from a keyword table. `ocrMemory.js` layers per-device learning on top: when a user corrects the category on an OCR-read expense and saves, the merchant text → category mapping is remembered in `localStorage` and wins over the static keyword table next time.

**Cash flow** (`cashflow.js`) computes an opening balance from *every* transaction before the selected month, then walks that month chronologically producing a running balance.

## Environment

`.env` (gitignored) holds six `VITE_FIREBASE_*` values; the same six exist as GitHub Actions repository secrets for the deploy build. `vite.config.js` sets `base: './'` so relative asset paths work under the GitHub Pages sub-path.
