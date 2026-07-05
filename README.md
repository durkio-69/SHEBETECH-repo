# Olimart — Enterprise Multi-Vendor Marketplace Platform

Olimart is a full multi-vendor e-commerce marketplace for the Uganda market — customer storefront, vendor seller-center, rider delivery app, and admin console — built on a real, audited backend rather than client-side simulation. It combines the storefront experience of Jumia UG with the vendor tooling depth of **Dokan Pro** and the commerce logic of **WooCommerce Pro**, purpose-built and integrated end-to-end rather than plugged together.

## What's inside

- **Storefront** — category browsing with subcategories, flash sales, deals, banners, advanced filtering (price/brand/rating/delivery), product variations & attributes, reviews & ratings, wishlists, back-in-stock alerts.
- **Vendor Seller Center** — subscription plans with real commission consequences, KYC-verified storefronts with branding & SEO, staff sub-accounts, per-zone shipping rules, withdrawal requests, sales/orders/withdrawal analytics dashboard, vacation mode, store follows & reviews.
- **Rider Delivery App** — assigned-delivery queue, proof-of-delivery capture (OTP or photo — no self-declared deliveries).
- **Admin Console** — role-based access (super/ops/finance/catalog/support admin), full audit log, live event monitoring feed, product moderation, vendor/rider approvals, admin-configured settlement account, platform-wide reports, broadcast announcements.
- **Event-driven order pipeline** — every order-lifecycle step fires a real event that notifies customer, vendor, rider, and admin simultaneously — see `PLATFORM_OVERVIEW.md`.

## Run locally

```bash
npm install
cp .env.example .env   # fill in your Postgres connection string + SMS/email credentials
npm run dev
```

## Documentation

See `PLATFORM_OVERVIEW.md` for the full architecture, the event-driven order flow, the registration model, and the complete Dokan Pro / WooCommerce Pro feature-parity matrix.
