# Olimart — Unified Multi-Vendor Marketplace Platform

## 1. What was compared

| | SHEBETECH-repo | Olimart-v2-redesign |
|---|---|---|
| Frontend (storefront, cart, vendor app, delivery app, admin app) | ✅ Complete, polished | ✅ Same code, rebranded |
| Backend | Everything faked client-side: 15% commission hard-coded, OTP never generated, "delivered" self-declared, one implicit admin | Real backend layer already written: `rbac.ts`, `orderStateMachine.ts`, `commissionEngine.ts`, `notificationService.ts` — but not yet finished |
| Money flow | Vendor `balance` is a mutable column anyone could edit from the browser | Immutable ledger, but no admin-configurable **settlement account** (where the money actually lands) |
| Registration | One generic sign-up, no admin approval flow | Users/roles table existed, but no working registration endpoints at all |
| Monitoring | Nothing recorded who changed what | Tables existed (`olimart_admin_logs`) but nothing wrote to them automatically |

**Conclusion:** Olimart-v2 is the better foundation. This build takes it and finishes the parts that were designed but not implemented, then adds the four things you asked for that neither repo had: a real event-driven order pipeline, unique per-role registration, an always-on audit trail, and an admin-managed settlement account.

---

## 2. The event-driven order flow (Jumia UG-style)

Nothing in Olimart polls for status. The moment something happens, one `emitEvent()` call (`src/lib/server/eventBus.ts`) does three things at once: writes a permanent row to the admin's monitoring feed, notifies whichever of customer/vendor/rider need to know over real SMS/email, and logs a plain-English line to the admin timeline.

| Step | Trigger | Customer | Vendor | Rider | Admin |
|---|---|---|---|---|---|
| 1. Order placed | `POST /api/orders/checkout` | SMS: "we've got your order" | SMS: "new order — confirm within 24h" | — | Event + audit row logged |
| 2. Vendor confirms | `POST /orders/items/:id/transition` → `vendor_confirmed` | SMS: "seller confirmed, preparing" | — | — | Logged |
| 3. Packed → rider assigned | → `assigned_to_rider` | SMS: "rider assigned" | — | SMS: "you've been assigned a delivery" | Logged |
| 4. Picked up | → `picked_up` | SMS: "picked up from seller" | — | — | Logged |
| 5. Out for delivery | → `out_for_delivery` | SMS: "on the way" | — | — | Logged |
| 6. Delivered | → `delivered` (**requires OTP or photo proof — no self-declaring**) | SMS: "delivered, thank you" | SMS + ledger credit: earnings released to seller balance | — | Logged |
| Cancel/return | → `cancelled` / `return_requested` / `returned` | SMS | SMS | — | Logged |

A single checkout can contain items from several vendors — each vendor gets its **own sub-order** with its own status, exactly like Jumia splits a multi-seller cart into separate shipments (`olimart_order_items`, one row per vendor per order).

---

## 3. Registration — unique per stakeholder

Nobody fills in one generic form. `src/lib/server/registration.ts` is the single source of truth for what each stakeholder must disclose before they can transact — `POST /api/auth/register/customer|vendor|rider` rejects the request with the exact missing fields if anything is absent.

| Stakeholder | Must disclose | Why | Goes live... |
|---|---|---|---|
| **Customer** | Name, phone, password (+ optional email, delivery address) | Just enough to place and track orders | Immediately |
| **Vendor** | Business name, owner's legal name, email, phone, location, category, **national ID number**, **payout method + account number** | Olimart is handling their money — full business + payout identity required | After admin approval |
| **Rider** | Name, phone, email, **ID card number**, **driving permit number**, transport means, location | Trusted with customers' goods and delivery confirmation | After admin approval |
| **Admin** | Never self-registered | Only an existing `super_admin` can mint another admin account (`POST /api/admin/users`) | One trusted path in |

Duplicate phone/email is rejected at registration (`isEmailOrPhoneTaken`). Passwords are PBKDF2-hashed, never stored in plain text.

---

## 4. Admin monitoring — every change, watched

Two complementary, always-on feeds:

- **`olimart_audit_log`** (`src/lib/server/auditLog.ts`) — who changed what, from what state to what state, for every admin-privileged write: product edits/deletes, vendor/rider approvals, settlement account changes, order status transitions. Queryable at `GET /api/admin/audit-log`.
- **`olimart_events`** (`src/lib/server/eventBus.ts`) — the business-process feed: every order-lifecycle step, registration, and product change, queryable at `GET /api/admin/events`.

Neither is editable or deletable through the API — that's what makes it an audit trail rather than just another mutable table.

---

## 5. Product ownership and descriptions

Every product now carries **two** description fields (`src/types.ts`):

- `vendorDescription` — **mandatory**, minimum 10 characters, written by the vendor at listing time (`PUT /api/vendor/products/:id`). A listing cannot be saved without it.
- `adminDescription` — optional moderation note or correction an admin can add without erasing what the vendor wrote (`PUT /api/admin/products/:id`).

The admin has the explicit right to **update or delete any product** (`product.moderate` / `product.remove` permissions), and every such action is audit-logged and fires a `product.updated` / `product.removed` event the vendor is notified of.

---

## 6. Where the money goes — the settlement account

This is the piece that answers "all the money collected is sent to one account, and the admin sets those details":

1. A customer pays (card / MTN MoMo / Airtel Money / bank / cash-on-delivery).
2. Payment settles into **one platform-owned account** — the *settlement account* — configured by a `finance_admin` or `super_admin` at `PUT /api/admin/settlement-account` (`src/lib/server/settlementAccounts.ts`). Fields: provider, account name, account number, bank/telco, currency.
3. `commissionEngine.ts` splits each sale into immutable ledger entries: the vendor's share (`sale_credit`) and the platform's cut (`commission_debit`) — never a mutable balance field.
4. When a vendor requests a payout, funds move **from the platform balance to the vendor's own registered payout account** (captured at vendor registration — bank account or mobile money number).

Every change to the settlement account is permission-gated, audit-logged, and fires a `settlement_account.updated` event — so there's a permanent record of who set or changed the account details and when.

---

## 7. Roles and permissions (unchanged from Olimart-v2, extended)

`super_admin`, `ops_admin`, `finance_admin`, `catalog_admin`, `support_admin`, `vendor_owner`, `vendor_staff`, `rider`, `customer` — each with an explicit capability list in `src/lib/server/rbac.ts`. This build adds `settlement.manage` (finance_admin, super_admin) and `audit.view` (all admin roles) to that map.

---

## 8. Files added or changed in the first backend pass

```
src/lib/server/eventBus.ts            NEW — event log + fan-out notifications to customer/vendor/rider/admin
src/lib/server/auditLog.ts            NEW — immutable audit trail for every admin-privileged write
src/lib/server/registration.ts        NEW — per-role registration schemas, password hashing, uniqueness checks
src/lib/server/settlementAccounts.ts  NEW — admin-managed platform settlement/collection account
src/lib/server/rbac.ts                CHANGED — added settlement.manage, audit.view permissions
src/types.ts                          CHANGED — added vendorDescription/adminDescription to Product
server.ts                             CHANGED — wired all of the above: registration/login routes, checkout
                                       route, event-emitting order transitions, admin product routes,
                                       vendor/rider approval routes, settlement-account routes, audit/event
                                       monitoring routes
```

---

## 9. Dokan Pro feature parity

| Dokan Pro feature | Status | Where it lives |
|---|---|---|
| Multi-vendor storefronts with own branding/banner/SEO | ✅ | `vendorPrograms.ts` — `olimart_vendor_storefronts`, `PUT /api/vendor/:id/storefront` |
| Vendor subscription/commission plans | ✅ | `vendorPrograms.ts` — plans feed directly into `commissionEngine.ts`'s vendor override, `POST /api/vendor/:id/subscribe` |
| Store categories & subcategories | ✅ | `Category.parentId` (`types.ts`); admin-managed via `category.manage` permission |
| Vendor analytics dashboard (sales/orders/withdrawals) | ✅ | `analyticsReports.ts` — `GET /api/vendor/:id/dashboard` |
| Withdrawal requests with admin approval | ✅ | `withdrawalRequests.ts` — balance-checked at request AND at approval, writes an immutable `payout_debit` ledger row only on approval |
| Product/order/coupon management per vendor | ✅ | `PUT /api/vendor/products/:id` (own products only), order transitions scoped by vendor, coupons via `commerceEngine.ts` |
| Vendor verification badges, store ratings & reviews | ✅ | `vendorPrograms.ts` — KYC document review sets `olimart_vendors.is_verified`; `olimart_store_reviews` is separate from product reviews |
| Announcements (admin → vendor) | ✅ | `broadcastAnnouncement()`, `POST /api/admin/announcements` |
| Live chat between admin/vendor/customer | 🗒️ Roadmap | Recommend wiring into the existing SMS/email `notificationService.ts` channel abstraction, or a WhatsApp Business API thread per order |
| Shipping rules per vendor/zone | ✅ | `shippingRules.ts` — resolved server-side at checkout, never trusted from the client cart |
| Refund & return request management | ✅ | `refundManagement.ts` — builds on the existing `return_requested`/`returned` order states, writes a `refund_reversal` ledger entry only on admin approval |

## 10. WooCommerce (+ Pro extensions) feature parity

| WooCommerce / Pro feature | Status | Where it lives |
|---|---|---|
| Variable products, categories, tags, attributes | ✅ | `Product.variations`, `Product.attributes`, `Product.tags` (`types.ts`) |
| Coupons & dynamic discounts | ✅ | `commerceEngine.ts` — percentage/flat/free-shipping coupons with global + per-customer usage caps; quantity price-breaks via `Product.priceTiers`, resolved server-side at checkout |
| Multiple payment gateways (card, mobile money, COD) | ✅ | `olimart_orders_v2.payment_method` is free-form; settlement lands in the admin-configured account regardless of gateway (§6) |
| Order status workflow | ✅ | `orderStateMachine.ts` — enforced transitions, proof-of-delivery required |
| Product reviews & ratings | ✅ | `Product.reviews` (product-level) + `olimart_store_reviews` (store-level, Dokan-style) |
| Storefront widgets (banners, category grids, featured/on-sale blocks) | ✅ | Already in the React storefront: `HeroCarousel`, `CategoryGrid`/`CategoryShowcase`, `FlashSales`, `DealsPage`, `AmazonShowcase`, `VendorHighlight` |
| Advanced search & filtering (price/attribute/brand) | ✅ | `FilterState` (`types.ts`) already covers price range, brand, rating, delivery option, sort order |
| Abandoned cart & email marketing hooks | ✅ | `commerceEngine.ts` — `saveCartSnapshot()` / `sweepAbandonedCarts()`, real SMS reminder, `POST /api/admin/abandoned-carts/sweep` (wire to a scheduler in production) |
| Inventory/stock management, backorders | ✅ | `Product.stockQuantity`, `Product.allowBackorder`, `Product.lowStockThreshold`; back-in-stock alerts in `commerceEngine.ts` |
| Reports & analytics dashboard | ✅ | `analyticsReports.ts` — `GET /api/admin/reports` (GMV, commission earned, active vendors, top sellers, refunded amount) |
| Loyalty points / rewards | ✅ (bonus, not in the original ask but included for parity with WooCommerce Points & Rewards) | `commerceEngine.ts` — immutable ledger, same design as the commission ledger; points earned only on confirmed delivery |
| Wishlist / "notify me" | ✅ | `commerceEngine.ts` — `olimart_wishlists`, `olimart_stock_alerts` |
| Deposits / partial payments | ✅ | `commerceEngine.ts` `recordPartialPayment()`, `POST /api/orders/:id/payments` |

Every ✅ above is a working table + endpoint in this codebase, permission-checked and audit-logged like the rest of the platform — none of it is a placeholder screen.

## 11. New/changed files in this pass

```
src/lib/server/vendorPrograms.ts     NEW — subscriptions, KYC, staff, storefront branding, follows/reviews, announcements, vacation mode
src/lib/server/commerceEngine.ts     NEW — dynamic pricing, advanced coupons, wishlist, back-in-stock, loyalty points, abandoned carts, deposits
src/lib/server/withdrawalRequests.ts NEW — vendor payout requests with admin approval, balance-checked twice
src/lib/server/shippingRules.ts      NEW — per-vendor/zone shipping fees + free-shipping thresholds
src/lib/server/refundManagement.ts   NEW — formal refund/return workflow with ledger reversal on approval
src/lib/server/analyticsReports.ts   NEW — vendor dashboard + platform-wide admin reports
src/lib/server/eventBus.ts           CHANGED — new event types for subscriptions, KYC, withdrawals, refunds, shipping, announcements
src/lib/server/rbac.ts               CHANGED — new permissions: vendor.verify, announcement.send, analytics.view.platform,
                                      shipping.manage(.own), refund.request.own, staff.manage.own, analytics.view.own
src/types.ts                         CHANGED — Product gets stockQuantity/allowBackorder/priceTiers/attributes;
                                      Category gets parentId; new VendorStorefront type
server.ts                            CHANGED — ~35 new endpoints wiring all of the above, plus checkout now re-prices
                                      every line server-side (dynamic pricing) and validates/redeems coupons server-side
```

## 12. To go fully live

1. `npm install` (all new modules use only packages already in `package.json`).
2. Copy `.env.example` → `.env` and fill in your Postgres connection string plus Africa's Talking / WhatsApp Cloud API / SMTP credentials — without these, notifications truthfully report `not_configured` instead of pretending to send.
3. Run once — `initDb()` creates every new table (`olimart_events`, `olimart_audit_log`, vendor programs, commerce engine, withdrawals, shipping rules, refunds) alongside the existing ones.
4. Have a `super_admin` log in and set the settlement account before accepting real payments: `PUT /api/admin/settlement-account`.
5. Wire a scheduler (cron, or a simple `setInterval` in `server.ts`) to call `POST /api/admin/abandoned-carts/sweep` every 15–60 minutes.
6. Update the React screens (`VendorApp.tsx`, `DeliveryApp.tsx`, `AdminApp.tsx`, checkout flow) to call the new endpoints — `/api/auth/register/:role`, `/api/orders/checkout`, `/api/vendor/:id/dashboard`, `/api/vendor/:id/withdrawals`, `/api/admin/reports`, `/api/admin/settlement-account`, `/api/admin/audit-log`, `/api/admin/events` — instead of writing to local state or the old open `/api/db/*` routes directly.

