# Contributing to Adult Web Directory

Thank you for your interest in contributing! This document explains how to add websites and submit changes.

## How to Add a Website

1. **Fork** the repository
2. **Edit** `data/sites.json` — add your entry following the data format below
3. **Run validation**: `npm run validate-data`
4. **Run tests**: `npm test`
5. **Commit** your changes with a clear message
6. **Open a Pull Request**
7. **Wait for manual review** — no automatic merging
8. Maintainer reviews and merges

## Data Format

```json
{
  "id": "unique-id",
  "name": "Site Name",
  "url": "https://example.com",
  "description": "Short description",
  "category": "communities",
  "tags": ["community"],
  "languages": ["en"],
  "regions": ["global"],
  "requiresRegistration": null,
  "featured": false,
  "addedAt": "2026-09-27",
  "lastReviewedAt": "2026-09-27"
}
```

### Rules

- `id` must be unique across all entries
- `url` must be HTTPS and unique
- `category` must exist in `data/categories.json`
- `tags` must exist in `data/tags.json`
- Dates must be in `YYYY-MM-DD` format
- `requiresRegistration` must be `null`, `true`, or `false`
- `featured` must be a boolean

## Content Policy

We do not accept entries for:

- Child sexual abuse material (CSAM)
- Content featuring minors
- Non-consensual intimate imagery (NCII)
- Voyeurism or hidden camera content
- Leaked private content
- Sexual exploitation or trafficking
- Malware, phishing, or malicious download sites
- Any illegal content

Violations will be reported to appropriate authorities.

## Pull Request Guidelines

- One website per PR (unless closely related)
- Fill in all required fields
- Ensure validation passes before submitting
- Provide accurate descriptions
- Do not include affiliate links or redirects

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/adult-web-directory.git
cd adult-web-directory
npm install  # no dependencies, just for scripts
npm run dev  # start local server
```

## Questions?

Open an issue for questions or discussions.
