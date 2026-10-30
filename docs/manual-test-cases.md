# Manual test cases

The test cases this framework automates, written as a tester would run them by hand. Every case has
an ID; the automated test that covers it carries the same ID at the start of its name
(`[TC-101] ...`), so a failure in the report leads straight to the case below.

| ID range         | Area                                  | Automated in                                     |
| ---------------- | ------------------------------------- | ------------------------------------------------ |
| TC-101 to TC-124 | Toolshop web shop in the browser (UI) | `tests/ui/*.spec.ts` (Chromium, Firefox, WebKit) |
| TC-201 to TC-223 | Toolshop REST API                     | `tests/api/*.api.spec.ts` (project `api`)        |

## Setup for manual runs

- Shop: <https://practicesoftwaretesting.com>; API: <https://api.practicesoftwaretesting.com>
  (a public demo, shared with other testers: product counts and stock change, so the cases compare
  with what the API says now instead of fixed numbers).
- A customer account: register one on the shop (or `POST /users/register`, TC-201).
- For the API cases use curl, Postman or similar. For the "mocked API" cases (TC-120 to TC-122) use
  browser DevTools › Network › **Override content** (Chrome) or a proxy such as Charles / mitmproxy.
- Billing address used at checkout: Austria, postal code `1010`, house number `1`.

## Summary

| ID     | Title                                                   | Type           | Priority |
| ------ | ------------------------------------------------------- | -------------- | -------- |
| TC-101 | Home page shows a full first page of 9 products         | Smoke          | High     |
| TC-102 | Search shows only matching products                     | Smoke          | High     |
| TC-103 | Search without a match says so                          | Negative       | Medium   |
| TC-104 | Category filter shows the category's products           | Regression     | Medium   |
| TC-105 | Sort "Name (A - Z)"                                     | Regression     | Low      |
| TC-106 | Sort "Name (Z - A)"                                     | Regression     | Low      |
| TC-107 | Sort "Price (Low - High)"                               | Regression     | Medium   |
| TC-108 | Sort "Price (High - Low)"                               | Regression     | Medium   |
| TC-109 | Customer logs in and lands on the account page          | Smoke          | High     |
| TC-110 | Wrong password is rejected with a message               | Negative       | High     |
| TC-111 | Empty login form shows a message per required field     | Negative       | Medium   |
| TC-112 | Customer signs out                                      | Regression     | High     |
| TC-113 | Card and detail page show the same name and price       | Smoke          | High     |
| TC-114 | Adding a product with a quantity updates the cart badge | Regression     | High     |
| TC-115 | The + button raises the quantity by one                 | Regression     | Low      |
| TC-116 | Logged-in customer orders two products (end to end)     | Smoke / E2E    | High     |
| TC-117 | Cart line prices and total add up                       | Regression     | High     |
| TC-118 | Guest is asked to sign in at checkout                   | Regression     | Medium   |
| TC-119 | A cart filled through the API shows up in the browser   | Hybrid         | Medium   |
| TC-120 | Catalogue shows exactly what the API sends              | Network        | Medium   |
| TC-121 | Empty product list shows "no products"                  | Network        | Medium   |
| TC-122 | Failing product API leaves the rest of the page working | Network        | Medium   |
| TC-123 | Sorting asks the API for sorted data                    | Network        | Low      |
| TC-124 | Search sends the term to the search endpoint            | Network        | Low      |
| TC-201 | A new customer can register                             | API / Smoke    | High     |
| TC-202 | Registering the same e-mail twice: 409                  | API / Negative | High     |
| TC-203 | Valid login returns a bearer JWT                        | API / Smoke    | High     |
| TC-204 | The token identifies the logged-in user                 | API            | High     |
| TC-205 | Wrong password: 401                                     | API / Negative | High     |
| TC-206 | Current user without a token: 401                       | API / Negative | High     |
| TC-207 | Made-up token: 401                                      | API / Security | High     |
| TC-208 | A new cart is empty                                     | API / Smoke    | Medium   |
| TC-209 | An added product is in the cart with quantity and price | API / Smoke    | High     |
| TC-210 | Quantity can be changed and the product removed         | API            | Medium   |
| TC-211 | Quantity below 1: 422 with a field error                | API / Negative | Medium   |
| TC-212 | Unknown product id in a cart: 422                       | API / Negative | Medium   |
| TC-213 | Business rule: only one Thor Hammer per cart            | API / Negative | Medium   |
| TC-214 | Unknown cart id: 404                                    | API / Negative | Low      |
| TC-215 | First product page matches the paging contract          | API / Smoke    | High     |
| TC-216 | Product pages do not overlap                            | API            | Medium   |
| TC-217 | A product can be fetched by id                          | API            | Medium   |
| TC-218 | Unknown product id: 404                                 | API / Negative | Low      |
| TC-219 | Search returns only matching products                   | API / Smoke    | High     |
| TC-220 | Search without a match returns an empty page            | API / Negative | Medium   |
| TC-221 | Sort by price ascending                                 | API            | Low      |
| TC-222 | Sort by price descending                                | API            | Low      |
| TC-223 | Category filter returns only that category              | API            | Medium   |

---

## UI: catalogue (`tests/ui/catalog.spec.ts`)

### TC-101 Home page shows a full first page of 9 products

Automated by `[TC-101] home page shows a full first page of products`. Preconditions: none.

| #   | Step                      | Expected result               |
| --- | ------------------------- | ----------------------------- |
| 1   | Open the shop's home page | 9 product cards               |
| 2   | Look at each card         | Each shows a name and a price |

### TC-102 Search shows only matching products

Automated by `[TC-102] search shows only matching products`. Test data: `pliers`.

| #   | Step                                                                            | Expected result                                                 |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `GET /products/search?q=pliers`, note `total` and the number of items in `data` | e.g. total 4                                                    |
| 2   | Type `pliers` into the search box, click **Search**                             | "4 products found for 'pliers'" (the API's total)               |
| 3   | Count and read the cards                                                        | As many cards as the API returned; every name contains "pliers" |

### TC-103 Search without a match says so

Automated by `[TC-103] search without a match says so`. Test data: `no-such-tool-xyz`.

| #   | Step                          | Expected result                                  |
| --- | ----------------------------- | ------------------------------------------------ |
| 1   | Search for `no-such-tool-xyz` | "There are no products found."; no product cards |

### TC-104 Category filter shows the category's products

Automated by `[TC-104] category filter shows the same products as the API`.

| #   | Step                                                                                                            | Expected result                                   |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | Find "Claw Hammer" through the API; note its category (e.g. "Hammer") and list `GET /products?by_category=<id>` | The category's product names                      |
| 2   | In the shop's filter panel tick that category                                                                   | The grid shows exactly those products (any order) |

### TC-105 to TC-108 Sort options

Automated by `[TC-105] sort "Name (A - Z)" ...` to `[TC-108] sort "Price (High - Low)" ...` (one test per row).

| ID     | Step: choose in the **Sort** list | Expected result                             |
| ------ | --------------------------------- | ------------------------------------------- |
| TC-105 | Name (A - Z)                      | Product names in alphabetical order         |
| TC-106 | Name (Z - A)                      | Product names in reverse alphabetical order |
| TC-107 | Price (Low - High)                | Prices ascending                            |
| TC-108 | Price (High - Low)                | Prices descending                           |

## UI: login (`tests/ui/login.spec.ts`)

Preconditions for all: a registered customer; open `/auth/login`.

### TC-109 Customer logs in and lands on the account page

Automated by `[TC-109] customer can log in and lands on the account page`.

| #   | Step                                                      | Expected result                                   |
| --- | --------------------------------------------------------- | ------------------------------------------------- |
| 1   | Enter the customer's e-mail and password, click **Login** | Redirect to `/account`, title "My account"        |
| 2   | Look at the header                                        | "Sign in" is replaced by the customer's full name |

Note: from CI runners the site sometimes shows a Cloudflare bot check instead of the page; the test
then skips with that reason. Manually, solve the check and continue.

### TC-110 Wrong password is rejected with a message

Automated by `[TC-110] wrong password is rejected with a message`. Test data: password `not-the-password`.

| #   | Step                                                     | Expected result                                         |
| --- | -------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Enter the e-mail and the wrong password, click **Login** | "Invalid email or password"                             |
| 2   | Look at page and header                                  | Still on the login page; header still shows **Sign in** |

### TC-111 Empty login form shows a message per required field

Automated by `[TC-111] empty form shows a message for each required field`.

| #   | Step                                      | Expected result                                                 |
| --- | ----------------------------------------- | --------------------------------------------------------------- |
| 1   | Click **Login** without entering anything | "Email is required" and "Password is required" under the fields |

### TC-112 Customer signs out

Automated by `[TC-112] customer can sign out again`.

| #   | Step                                   | Expected result                        |
| --- | -------------------------------------- | -------------------------------------- |
| 1   | Log in as in TC-109                    | Account page                           |
| 2   | Open the user menu, click **Sign out** | Login page; header shows **Sign in**   |
| 3   | Open the home page                     | Still logged out (the session is gone) |

## UI: product (`tests/ui/product.spec.ts`)

### TC-113 Card and detail page show the same name and price

Automated by `[TC-113] card and detail page show the same name and price`.

| #   | Step                                                  | Expected result                                                                |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | On the home page note the first card's name and price |                                                                                |
| 2   | Click the card                                        | Detail page with the same name and the same unit price; a description is shown |

### TC-114 Adding a product with a quantity updates the cart badge

Automated by `[TC-114] adding a product with a quantity updates the cart badge`. Preconditions: an in-stock product (check `in_stock` through the API).

| #   | Step                                                      | Expected result                        |
| --- | --------------------------------------------------------- | -------------------------------------- |
| 1   | Open the product, set quantity `3`, click **Add to cart** | Toast "Product added to shopping cart" |
| 2   | Look at the cart badge in the header                      | `3` (pieces, not lines)                |

### TC-115 The + button raises the quantity by one

Automated by `[TC-115] the + button raises the quantity by one`.

| #   | Step               | Expected result |
| --- | ------------------ | --------------- |
| 1   | Open "Thor Hammer" | Quantity `1`    |
| 2   | Click **+**        | Quantity `2`    |

## UI: checkout (`tests/ui/checkout.spec.ts`)

### TC-116 Logged-in customer orders two products (end to end)

Automated by `[TC-116] customer can order two products`. Preconditions: logged in; two in-stock products A and B.

| #   | Step                                                                                    | Expected result                                 |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Add 1 × A to the cart, then 2 × B                                                       | Cart badge `3`                                  |
| 2   | Open the cart                                                                           | Lines: A × 1, B × 2                             |
| 3   | **Proceed to checkout**                                                                 | Sign-in step says you are already logged in     |
| 4   | **Proceed**, enter the billing address (Austria, `1010`, house number `1`), **Proceed** | Payment step                                    |
| 5   | Choose **Cash on Delivery**, **Confirm**                                                | "Payment was successful"                        |
| 6   | **Confirm** again                                                                       | "Thanks for your order!" with an invoice number |

### TC-117 Cart line prices and total add up

Automated by `[TC-117] cart line prices and total add up`.

| #   | Step                               | Expected result                                  |
| --- | ---------------------------------- | ------------------------------------------------ |
| 1   | Add 3 × A and 1 × B, open the cart | Two lines                                        |
| 2   | Check each line                    | Line price = unit price × quantity (to the cent) |
| 3   | Check the total                    | Total = sum of the line prices                   |

### TC-118 Guest is asked to sign in at checkout

Automated by `[TC-118] guest is asked to sign in at checkout`. Preconditions: logged out.

| #   | Step                                                                  | Expected result                                                          |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Add "Claw Hammer" to the cart, open the cart, **Proceed to checkout** | The sign-in form (e-mail field) is shown; no "already logged in" message |

### TC-119 A cart filled through the API shows up in the browser

Automated by `[TC-119] a cart filled through the API shows up in the browser`.

| #   | Step                                                                                                | Expected result                                                                |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | `POST /carts`, then `POST /carts/<id>` with Claw Hammer, quantity `4`                               | `201` / `200`                                                                  |
| 2   | In the browser's Session Storage set `cart_id` = `<id>` and `cart_quantity` = `4`, open `/checkout` | One line: Claw Hammer × 4 at the API's unit price, line price = 4 × unit price |

## UI: network (`tests/ui/network.spec.ts`)

The front end's product list request is `/products` on the API host (not `/products/search` or
`/products/{id}`).

### TC-120 Catalogue shows exactly what the API sends

Automated by `[TC-120] renders exactly the products the API sends`.

| #   | Step                                                                                                         | Expected result                                                   |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1   | Override the `/products` answer with a page of two products: "Mocked Mallet" `1.23`, "Mocked Spanner" `45.6` |                                                                   |
| 2   | Open the home page                                                                                           | Exactly two cards: Mocked Mallet `$1.23`, Mocked Spanner `$45.60` |

### TC-121 Empty product list shows "no products"

Automated by `[TC-121] shows a message when the API returns no products`.

| #   | Step                                                                                 | Expected result                          |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1   | Override `/products` with an empty page (`data: []`, `total: 0`), open the home page | "There are no products found."; no cards |

### TC-122 Failing product API leaves the rest of the page working

Automated by `[TC-122] a failing product API leaves the rest of the page working`.

| #   | Step                                                       | Expected result                                                  |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Override `/products` with status `500`, open the home page | No product cards (and, currently, no error message)              |
| 2   | Check the rest of the page                                 | **Sign in** link visible; search box editable; sort list enabled |

### TC-123 Sorting asks the API for sorted data

Automated by `[TC-123] sorting asks the API for sorted data`.

| #   | Step                                                   | Expected result                                                        |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | DevTools › Network open; choose **Price (Low - High)** | A `QUERY` request to `/products` with body `{"sort":"price,asc", ...}` |

### TC-124 Search sends the term to the search endpoint

Automated by `[TC-124] search sends the search term to the search endpoint`.

| #   | Step             | Expected result                                                       |
| --- | ---------------- | --------------------------------------------------------------------- |
| 1   | Search for `saw` | Request to `/products/search` with body `{"q":"saw"}`, answered `2xx` |
| 2   | Compare          | As many cards as products in the answer's `data`                      |

---

## API: auth (`tests/api/auth.api.spec.ts`)

Base URL `https://api.practicesoftwaretesting.com`. Preconditions: a registered customer (TC-201).

### TC-201 A new customer can register

Automated by `[TC-201] a new customer can register`. Test data: a unique e-mail, e.g. `pw-ts-<random>@example.com`, a strong password.

| #   | Step                                                                   | Expected result                                           |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | `POST /users/register` with first/last name, address, e-mail, password | `201`; the body has the e-mail, `first_name`, `last_name` |
| 2   | Check the body                                                         | **No** `password` field                                   |

### TC-202 Registering the same e-mail twice: 409

Automated by `[TC-202] registering the same e-mail twice is rejected`.

| #   | Step                                      | Expected result                                                           |
| --- | ----------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Register again with an e-mail that exists | `409`, `{"email":["A customer with this email address already exists."]}` |

### TC-203 Valid login returns a bearer JWT

Automated by `[TC-203] valid login returns a bearer JWT`.

| #   | Step                                         | Expected result                                                                                 |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | `POST /users/login` with e-mail and password | `200`; `access_token` (JWT, three dot-separated parts), `token_type` `bearer`, `expires_in` > 0 |

### TC-204 The token identifies the logged-in user

Automated by `[TC-204] the token identifies the logged-in user`.

| #   | Step                                                              | Expected result                                   |
| --- | ----------------------------------------------------------------- | ------------------------------------------------- |
| 1   | Log in, then `GET /users/me` with `Authorization: Bearer <token>` | `200`; the customer's e-mail, first and last name |

### TC-205 Wrong password: 401

Automated by `[TC-205] wrong password is rejected with 401`.

| #   | Step                                      | Expected result                   |
| --- | ----------------------------------------- | --------------------------------- |
| 1   | `POST /users/login` with a wrong password | `401`, `{"error":"Unauthorized"}` |

### TC-206 Current user without a token: 401

Automated by `[TC-206] current user needs a token`.

| #   | Step                                    | Expected result |
| --- | --------------------------------------- | --------------- |
| 1   | `GET /users/me` without `Authorization` | `401`           |

### TC-207 Made-up token: 401

Automated by `[TC-207] a made-up token is rejected`.

| #   | Step                                                                                 | Expected result              |
| --- | ------------------------------------------------------------------------------------ | ---------------------------- |
| 1   | `GET /users/me` with `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalid-signature` | `401` (signature is checked) |

## API: carts (`tests/api/carts.api.spec.ts`)

Preconditions for all: a new cart from `POST /carts` (the answer's `id`).

### TC-208 A new cart is empty

Automated by `[TC-208] a new cart is empty`.

| #   | Step              | Expected result                    |
| --- | ----------------- | ---------------------------------- |
| 1   | `GET /carts/<id>` | `200`, same `id`, `cart_items: []` |

### TC-209 An added product is in the cart with quantity and price

Automated by `[TC-209] an added product is in the cart with its quantity`.

| #   | Step                                                                | Expected result                                                                            |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | `POST /carts/<id>` `{"product_id":"<Claw Hammer id>","quantity":2}` | `2xx`                                                                                      |
| 2   | `GET /carts/<id>`                                                   | One item: that `product_id`, `quantity` `2`, `product.price` = the product's current price |

### TC-210 Quantity can be changed and the product removed

Automated by `[TC-210] quantity can be changed and the product removed`.

| #   | Step                                                                                       | Expected result                    |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| 1   | Add Claw Hammer × 1; `PUT /carts/<id>/product/quantity` `{"product_id":..., "quantity":5}` | `2xx`; the cart shows quantity `5` |
| 2   | `DELETE /carts/<id>/product/<product id>`                                                  | `204`; `cart_items: []`            |

### TC-211 Quantity below 1: 422 with a field error

Automated by `[TC-211] quantity below 1 is rejected with a field error`.

| #   | Step                                | Expected result                                                            |
| --- | ----------------------------------- | -------------------------------------------------------------------------- |
| 1   | Add Claw Hammer with `quantity` `0` | `422`; `errors.quantity` contains "The quantity field must be at least 1." |

### TC-212 Unknown product id in a cart: 422

Automated by `[TC-212] unknown product id is rejected`.

| #   | Step                               | Expected result                                                           |
| --- | ---------------------------------- | ------------------------------------------------------------------------- |
| 1   | Add `product_id` `no-such-product` | `422`; `errors.product_id` contains "The selected product id is invalid." |

### TC-213 Business rule: only one Thor Hammer per cart

Automated by `[TC-213] business rule: only one Thor Hammer per cart`.

| #   | Step                                | Expected result                                                       |
| --- | ----------------------------------- | --------------------------------------------------------------------- |
| 1   | Add Thor Hammer with `quantity` `2` | `400`, `{"message":"You can only have one Thor Hammer in the cart."}` |
| 2   | `GET /carts/<id>`                   | Still empty                                                           |

### TC-214 Unknown cart id: 404

Automated by `[TC-214] unknown cart id returns 404`.

| #   | Step                      | Expected result |
| --- | ------------------------- | --------------- |
| 1   | `GET /carts/no-such-cart` | `404`           |

## API: products (`tests/api/products.api.spec.ts`)

### TC-215 First product page matches the paging contract

Automated by `[TC-215] first page matches the paging contract`.

| #   | Step            | Expected result                                                                                                                               |
| --- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `GET /products` | `current_page` `1`; `data` has `per_page` items; `last_page` = ceil(`total` / `per_page`); every product has id, name, price, category, brand |

### TC-216 Product pages do not overlap

Automated by `[TC-216] pages do not overlap`.

| #   | Step                                                  | Expected result     |
| --- | ----------------------------------------------------- | ------------------- |
| 1   | `GET /products?page=1` and `?page=2`, compare the ids | No id on both pages |

### TC-217 A product can be fetched by id

Automated by `[TC-217] a product can be fetched by id`.

| #   | Step                                                            | Expected result                        |
| --- | --------------------------------------------------------------- | -------------------------------------- |
| 1   | Take the first product of `GET /products`; `GET /products/<id>` | Same id, name and price as in the list |

### TC-218 Unknown product id: 404

Automated by `[TC-218] unknown product id returns 404`.

| #   | Step                                       | Expected result                                 |
| --- | ------------------------------------------ | ----------------------------------------------- |
| 1   | `GET /products/01ZZZZZZZZZZZZZZZZZZZZZZZZ` | `404`, `{"message":"Requested item not found"}` |

### TC-219 Search returns only matching products

Automated by `[TC-219] search returns only matching products`.

| #   | Step                            | Expected result                                      |
| --- | ------------------------------- | ---------------------------------------------------- |
| 1   | `GET /products/search?q=hammer` | `total` > 0; every name contains "hammer" (any case) |

### TC-220 Search without a match returns an empty page

Automated by `[TC-220] search without a match returns an empty page`.

| #   | Step                                      | Expected result         |
| --- | ----------------------------------------- | ----------------------- |
| 1   | `GET /products/search?q=no-such-tool-xyz` | `total` `0`, `data: []` |

### TC-221 / TC-222 Sort by price

Automated by `[TC-221] sort by price asc ...` and `[TC-222] sort by price desc ...`.

| ID     | Step                            | Expected result               |
| ------ | ------------------------------- | ----------------------------- |
| TC-221 | `GET /products?sort=price,asc`  | Prices on the page ascending  |
| TC-222 | `GET /products?sort=price,desc` | Prices on the page descending |

### TC-223 Category filter returns only that category

Automated by `[TC-223] category filter returns only that category`.

| #   | Step                                                             | Expected result                                |
| --- | ---------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Find Claw Hammer's category id; `GET /products?by_category=<id>` | `total` > 0; every product is in that category |
