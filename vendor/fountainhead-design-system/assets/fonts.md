# Fonts — Montserrat & Nunito

The Fountainhead **brand** uses two Google Fonts (Montserrat + Nunito). The **product/ERP
profile** (`data-profile="product"`, added in v1.3.0) uses a third — **Plus Jakarta Sans**
— for both headings and body:

| Role | Family | Weights used |
|------|--------|--------------|
| Headings / Subheads / UI labels | **Montserrat** | 400, 500 (subheads), 600, 700 (headlines), 800 (display); italic 700 for expressive headlines |
| Body / long-form / forms | **Nunito** | 400 (body), 600, 700 |
| Product/ERP — headings + body (`data-profile="product"`) | **Plus Jakarta Sans** | 400, 500, 600 (headings/titles), 700 (KPI numbers), 800 |

The design system's `--fh-font-heading` / `--fh-font-body` tokens fall back to
`system-ui` if the webfonts are unavailable, so nothing breaks — but load the
real fonts for an on-brand result.

## Option A — Google Fonts CDN (fastest to set up)

Put this in your `<head>` **before** `fountainhead.css`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&family=Nunito:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
```

> **Product/ERP only:** if a surface uses `data-profile="product"`, load **Plus Jakarta
> Sans** (already included in the link above). Brand-only surfaces can drop the
> `Plus+Jakarta+Sans` family from the link.

## Option B — Self-host (recommended for ERP / offline / privacy)

Many ERP deployments run on internal networks or must avoid third-party CDNs
for privacy. Self-host instead:

1. Download the families from <https://fonts.google.com/specimen/Montserrat>
   and <https://fonts.google.com/specimen/Nunito> (or via `google-webfonts-helper`).
2. Drop the `.woff2` files in `assets/fonts/` and add `@font-face` rules:

```css
@font-face {
  font-family: "Montserrat";
  font-style: normal;
  font-weight: 400 800;          /* variable range */
  font-display: swap;
  src: url("./fonts/Montserrat.woff2") format("woff2");
}
@font-face {
  font-family: "Nunito";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("./fonts/Nunito.woff2") format("woff2");
}
```

Load that CSS before `fountainhead.css`.

> Tip: ship only the weights you use. Headlines need Montserrat 700, subheads
> 500, body needs Nunito 400 — that trio covers most screens.
