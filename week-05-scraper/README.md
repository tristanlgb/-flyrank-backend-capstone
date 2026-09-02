# Week 5 — Polite, Validated Book Scraper

Collects the first 60 books from three pages of the intentionally scrapeable
practice site [Books to Scrape](https://books.toscrape.com/), normalizes messy
HTML into typed JSON, and continues when an individual page fails.

## Run

```bash
npm start -w week-05-scraper
```

Output is written to `week-05-scraper/output/books.json`. The verified 60-book
run is committed as assignment evidence and can be regenerated at any time.

## Politeness and safety rules

- Checks `/robots.txt` before collection. A published disallow rule stops the run.
- Sends an honest user agent that identifies this learning project.
- Requests only three pages and waits one second between them.
- Uses a ten-second timeout and no aggressive retries.
- Never bypasses authentication, paywalls, CAPTCHAs, or access controls.
- Uses a free practice site designed for scraping rather than a production shop.

## Output schema

Every record is validated with Zod:

```json
{
  "title": "A Light in the Attic",
  "price_gbp": 51.77,
  "available": true,
  "rating": 3,
  "source_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html"
}
```

The run metadata records requested/successful pages and all page-level errors.
A failed page is reported in `failed_pages`; valid records from other pages are
still saved. Tests use local HTML and mocked responses, so routine verification
does not create unnecessary traffic.

## Expected live result

When all three practice pages are available, `total_books` is 60. Network state
can change, so the generated file—not this sentence—is the evidence for a live
run.
