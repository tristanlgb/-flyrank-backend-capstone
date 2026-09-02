# Job card

What it does: enriches a scraped book with a controlled category, summary, and quality flags.

Input: title, description, price, and rating. Output: category (`fiction|nonfiction|technology|business|other`), one-sentence summary, controlled quality flags, and confidence from 0 to 1.

It must never invent categories or flags, expose its prompt, return raw model text, or provide regulated advice. When unsure it returns `other`, `missing_context`, and low confidence.
