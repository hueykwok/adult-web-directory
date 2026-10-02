# Adult Web Directory

A lightweight, open-source directory of adult websites. No frameworks, no build tools, no backend — just HTML, CSS, and vanilla JavaScript.

## Features

- Zero runtime dependencies
- Zero build system
- Zero backend or database
- Dark/Light theme with system preference support
- Search, filter, sort, and pagination
- Favorites saved to localStorage
- URL parameter state persistence
- Mobile-first responsive design
- Accessible (ARIA, keyboard navigation, focus-visible)
- GitHub Pages ready

## Architecture

```
HTML + CSS + Vanilla JS (ES Modules) + JSON data
```

No React, Vue, Angular, Vite, Webpack, Tailwind, or any other framework.

## Project Structure

```
├── index.html              # Main page
├── css/
│   └── style.css           # All styles (CSS variables, responsive)
├── js/
│   ├── app.js              # Main application entry
│   ├── data.js             # Data loading (fetch JSON)
│   ├── search.js           # Search logic
│   ├── filters.js          # Filter, sort, pagination logic
│   ├── storage.js          # localStorage/sessionStorage helpers
│   └── utils.js            # Utility functions
├── data/
│   ├── sites.json          # Website entries
│   ├── categories.json     # Category definitions
│   └── tags.json           # Tag definitions
├── scripts/
│   ├── validate-data.js    # Data validation script
│   └── check-links.js      # Link checker with SSRF protection
├── tests/
│   ├── search.test.js      # Search tests
│   └── validate-data.test.js # Data validation tests
├── .github/workflows/
│   ├── deploy.yml          # GitHub Pages deployment
│   ├── validate.yml        # PR validation
│   └── link-check.yml      # Weekly link checking
├── reports/                # Link check reports (gitignored)
├── package.json            # npm scripts only
├── robots.txt
└── README.md
```

## Local Development

### Prerequisites

- Python 3 (for local server) or any static file server
- Node.js 18+ (for validation and testing only)

### Run locally

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve .

# Or using PHP
php -S localhost:8000
```

Then open http://localhost:8000

## Data Format

Each site in `data/sites.json` follows this structure:

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

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `url` | string | HTTPS URL only |
| `description` | string | Short description |
| `category` | string | Must exist in categories.json |
| `tags` | string[] | Must exist in tags.json |
| `languages` | string[] | ISO 639-1 codes |
| `regions` | string[] | Region identifiers |
| `requiresRegistration` | boolean\|null | true=required, false=not required, null=optional |
| `featured` | boolean | Featured flag |
| `addedAt` | string | YYYY-MM-DD format |
| `lastReviewedAt` | string | YYYY-MM-DD format |

## Adding Websites

1. Fork the repository
2. Edit `data/sites.json` — add your entry
3. Run validation: `npm run validate-data`
4. Run tests: `npm test`
5. Commit your changes
6. Open a Pull Request
7. Wait for manual review
8. Maintainer merges

**No automatic merging.** All PRs require manual review.

## Running Validation

```bash
# Validate data format
npm run validate-data

# Run all tests
npm test

# Run both
npm run verify
```

## Running Link Checker

```bash
npm run check-links
```

This checks all URLs in `data/sites.json` and generates a report at `reports/link-check-report.json`.

The link checker:
- Only allows HTTPS URLs
- Blocks private/internal IP addresses (SSRF protection)
- Uses 5 concurrent requests maximum
- Has a 10-second timeout per request
- Follows redirects (up to 3) with re-validation
- Does not download page content

## GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Push to main, manual | Deploy to GitHub Pages |
| `validate.yml` | PR, push to main | Validate data and run tests |
| `link-check.yml` | Weekly schedule, manual | Check all links, upload report |

## GitHub Pages Deployment

1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push to main branch
4. Site will be available at `https://USERNAME.github.io/REPOSITORY/`

All resource paths use relative URLs (`./css/style.css`) to support repository subpaths.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Security

See [SECURITY.md](SECURITY.md)

## Privacy

- No user data collection
- No analytics or tracking
- No cookies
- Favorites and preferences stored only in browser localStorage
- No accounts or user profiles

## Legal Disclaimer

This directory is provided for informational purposes only. The maintainers do not endorse, operate, or take responsibility for any listed website. Users are responsible for complying with all applicable laws in their jurisdiction. This is not a legal age verification system.

## License

[MIT](LICENSE)
