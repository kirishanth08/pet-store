# PetsMart — Pet Shop & Pet Supplies Store

A friendly, warm, animal-themed static website for a pet shop and pet supplies store. Built with HTML5, CSS3, Bootstrap 5, and vanilla JavaScript — no backend required.

## Features

- **13 public pages** — Home, About, Products, Product Details, Grooming, Pets for Sale, Pet Details, Brands, Blog, Blog Details, Contact, 404, Coming Soon
- **Dark / Light mode** — CSS variables with localStorage persistence
- **RTL support** — Full right-to-left layout toggle
- **Responsive design** — Mobile, tablet, desktop, and large screen breakpoints
- **Accessibility** — WCAG 2.1 AA patterns (skip links, ARIA labels, focus states, semantic HTML)
- **Form validation** — Client-side validation on contact and grooming booking forms
- **SEO ready** — Unique meta tags, JSON-LD schema, sitemap.xml, robots.txt
- **Premium hover effects** — Smooth card lifts, button scales, image zooms, nav underlines

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 + CSS Variables | Theming and layout |
| Bootstrap 5.3.3 | Grid, navbar, accordion, forms |
| JavaScript ES6+ | Dark mode, RTL, form validation |
| Google Fonts | Fredoka One (headings) + Nunito (body) |
| Font Awesome 6 | Icons |

## Color Scheme

| Variable | Color | Usage |
|---|---|---|
| `--color-primary` | `#00897B` | Teal — buttons, links, logo |
| `--color-secondary` | `#FF7043` | Warm orange — CTAs, accents |
| `--color-bg` | `#FFFDF7` | Warm white background |
| `--color-text` | `#2D2D2D` | Body text |
| `--color-section` | `#FFF3E0` | Section backgrounds |

## Quick Start

```bash
# Navigate to project folder
cd pet-shop

# Start a local server (Python)
python -m http.server 8080

# Open in browser
# http://localhost:8080/pages/index.html
```

Or open `pet-shop/index.html` which redirects to the home page.

## Project Structure

```
pet-shop/
├── assets/
│   ├── css/
│   │   ├── style.css        # Main styles & CSS variables
│   │   ├── dark-mode.css    # Dark theme overrides
│   │   └── rtl.css          # RTL layout support
│   ├── js/
│   │   ├── main.js          # Dark mode, RTL, form validation
│   │   └── plugins/         # Reserved for future plugins
│   ├── images/              # Local image assets
│   └── fonts/               # Local font files (optional)
├── pages/                   # All 13 HTML pages
├── documentation/
│   ├── installation-guide.txt
│   ├── customization-guide.txt
│   └── credits.txt
├── sitemap.xml
├── robots.txt
├── index.html               # Root redirect
└── README.md
```

## Pages

| Page | Description |
|---|---|
| `index.html` | Home — hero, categories, pets teaser, products, grooming, brands, testimonials |
| `about.html` | Store story, team, in-store pets, charity |
| `products.html` | Filter sidebar, 12 product cards, sort, pagination |
| `product-details.html` | Gallery, options, accordion, reviews |
| `grooming.html` | 6 services, FAQ, gallery, booking form |
| `pets-for-sale.html` | Filters, 12 pet listings, health banner |
| `pet-details.html` | Gallery, health badges, enquiry form |
| `brands.html` | 10 brand cards, trust section |
| `blog.html` | 6 articles, filter tabs, sidebar |
| `blog-details.html` | Full article, share, author, comments |
| `contact.html` | Form, map, hours, WhatsApp |
| `404.html` | Error page with paw icon |
| `coming-soon.html` | Countdown timer, email signup |

## Integration Placeholders

Before deploying, replace these placeholders:

- **Formspree** — `https://formspree.io/f/YOUR_FORM_ID` in contact, grooming, and pet-details forms
- **Mailchimp** — Newsletter forms in index.html and coming-soon.html
- **Google Maps** — iframe src in contact.html

## Browser Support

Tested on Chrome, Firefox, Safari, and Edge (latest versions).

## License

This template is provided for educational and commercial use. Replace placeholder images and content before production deployment.

See `documentation/credits.txt` for third-party attributions.
