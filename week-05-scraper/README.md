# Week 5 — Polite, Validated Book Scraper

This assignment scrapes [Books to Scrape](https://books.toscrape.com/), a public sandbox created for scraping practice. It follows the catalogue's `next` link for three pages, discovers 60 unique product URLs, and then visits each product page. The browser is not required because every selected field is present in the server-rendered HTML.

## Scope and ethics

The collector stores only information needed for the exercise: title, product URL, displayed price, displayed availability, displayed rating, optional description, catalogue source page, and collection time. It never attempts login, ignores no access controls, and does not bypass paywalls, CAPTCHAs, blocks, or rate limits. An official API would be preferred whenever one exists.

The site currently returns `no robots file found`. A missing robots file is not permission, so the run is still deliberately small and polite. I will not reuse this code on another site without checking its rules and terms first.

## Run

From the repository root:

```bash
npm start -w week-05-scraper
```

To prove that one failed product page does not stop the collection:

```bash
npm start -w week-05-scraper -- --inject-broken-url
```

The command writes:

- `output/books.json`: schema-valid records only.
- `output/errors.json`: page or validation errors separated from good data.
- `output/run-report.json`: timing and counts for the normal run.
- `output/failure-proof-report.json`: evidence from the intentionally broken run.

## Politeness and reliability controls

- Honest user agent: `FlyRankLearningScraper/1.0 (educational assignment)`.
- One request at a time with at least one second between network requests.
- Ten-second timeout for every request.
- File cache avoids downloading unchanged pages again.
- HTTP status is checked before parsing.
- Network errors and server errors (`5xx`) are retried once.
- Client errors (`4xx`) are not retried.
- A failure is recorded while the remaining product pages continue.

## Validated schema

Each record preserves eight raw/provenance fields:

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "It's hard to imagine a world without A Light in the Attic...",
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-09-02T04:15:22.462Z"
}
```

Normalization adds `price_gbp`, `available`, and numeric `rating`. Zod validates both raw and normalized values. Missing descriptions are accepted as `null`; malformed prices and other invalid values are sent to the error report rather than silently becoming good records.

## Real run evidence

Normal run (the second run demonstrates the cache):

```text
catalogue_pages=3 discovered=60 unique_urls=60
valid=60 failed_pages=0 fetched=0 cache_hits=63
duration_ms=606 robots_result="no robots file found"
```

Failure-proof run with one intentionally invalid product URL:

```text
catalogue_pages=3 discovered=60 unique_urls=61
valid=60 failed_pages=1 fetched=0 cache_hits=63
```

The first live run fetched 63 pages (three catalogue pages and 60 product pages) and produced 60 valid records. The immediately repeated run fetched zero pages and used 63 cached responses. The injected 404 was isolated in `errors.json`, while all 60 valid products were still saved.

## Test coverage and known limitation

The automated tests cover pagination, absolute URL discovery, all eight raw fields, normalization, missing descriptions, malformed prices, robots handling, caching, retry behavior, and continuation after a broken page.

Known limitation: this scraper intentionally targets the current HTML structure of one learning sandbox. A markup redesign could require selector updates; it is not a generic scraper and should not be pointed at another website unchanged.
