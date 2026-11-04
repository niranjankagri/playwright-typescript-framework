import { type Locator, type Page, expect } from '@playwright/test';
import { toCents } from '../utils/money';
import { BasePage } from './BasePage';
import { step } from '../utils/step';

/** Billing address for step 3. The shop looks up street and city from country + postal code. */
export type BillingAddress = {
  country: string;
  postalCode: string;
  houseNumber: string;
};

export type PaymentMethod = 'Bank Transfer' | 'Cash on Delivery' | 'Credit Card' | 'Buy Now Pay Later' | 'Gift Card';

/** One row of the cart table, read from the page. */
export type CartLine = { title: string; quantity: number; unitPriceCents: number; linePriceCents: number };

/**
 * The checkout wizard (/checkout): 1 cart, 2 sign in, 3 billing address, 4 payment.
 * All four steps live on one URL and share their buttons, so they share one page object.
 */
export class CheckoutPage extends BasePage {
  static readonly path = '/checkout';

  // Step 1: cart
  readonly cartRows: Locator;
  readonly cartTotal: Locator;
  readonly proceedFromCartButton: Locator;
  // Step 2: sign in
  readonly alreadyLoggedInMessage: Locator;
  readonly signInEmailInput: Locator;
  readonly proceedFromSignInButton: Locator;
  // Step 3: billing address
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly houseNumberInput: Locator;
  readonly streetInput: Locator;
  readonly proceedFromAddressButton: Locator;
  // Step 4: payment
  readonly paymentMethodSelect: Locator;
  /** "Check payment" first, then "Confirm" once the payment is accepted: one button, two labels. */
  readonly finishButton: Locator;
  readonly paymentSuccessMessage: Locator;
  readonly orderConfirmation: Locator;

  /**
   * Builds the locators once; Playwright locators are lazy, so nothing is looked up until a step uses them.
   */
  constructor(page: Page) {
    super(page);
    // A cart row is the table row that holds a product title.
    this.cartRows = page.locator('tbody tr').filter({ has: page.getByTestId('product-title') });
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedFromCartButton = page.getByTestId('proceed-1');

    this.alreadyLoggedInMessage = page.getByText(/you are already logged in/);
    this.signInEmailInput = page.getByTestId('email');
    this.proceedFromSignInButton = page.getByTestId('proceed-2');

    this.countrySelect = page.getByTestId('country');
    this.postalCodeInput = page.getByTestId('postal_code');
    this.houseNumberInput = page.getByTestId('house_number');
    this.streetInput = page.getByTestId('street');
    this.proceedFromAddressButton = page.getByTestId('proceed-3');

    this.paymentMethodSelect = page.getByTestId('payment-method');
    this.finishButton = page.getByTestId('finish');
    this.paymentSuccessMessage = page.getByTestId('payment-success-message');
    // No data-test attribute on the confirmation; its id is stable.
    this.orderConfirmation = page.locator('#order-confirmation');
  }

  /** Opens the checkout at the cart step. */
  @step('Open the checkout')
  async open(): Promise<void> {
    await this.page.goto(CheckoutPage.path);
  }

  /** Reads every cart row: title, quantity, unit price and line price (in cents). */
  @step('Read the cart lines')
  async getCartLines(): Promise<CartLine[]> {
    await expect(this.cartRows.first()).toBeVisible();
    const lines: CartLine[] = [];
    for (const row of await this.cartRows.all()) {
      lines.push({
        title: (await row.getByTestId('product-title').innerText()).trim(),
        quantity: Number(await row.getByTestId('product-quantity').inputValue()),
        unitPriceCents: toCents(await row.getByTestId('product-price').innerText()),
        linePriceCents: toCents(await row.getByTestId('line-price').innerText()),
      });
    }
    return lines;
  }

  /** The cart total in cents, so sums are compared without rounding errors. */
  async getCartTotalCents(): Promise<number> {
    return toCents(await this.cartTotal.innerText());
  }

  /** Step 1 -> 2 */
  @step('Checkout step 1: proceed from the cart')
  async proceedFromCart(): Promise<void> {
    await this.proceedFromCartButton.click();
  }

  /** Step 2 -> 3, for a customer who is already logged in. */
  @step('Checkout step 2: continue as the logged-in customer')
  async proceedAsLoggedInCustomer(): Promise<void> {
    await expect(this.alreadyLoggedInMessage).toBeVisible();
    await this.proceedFromSignInButton.click();
  }

  /**
   * Step 3 -> 4. After country, postal code and house number the shop calls
   * GET /postcode-lookup and fills street, city and state from its answer.
   *
   * Wait for that answer to be IN the form before going on. The logged-in test user's own
   * address (see AuthApi.register) is already in the form, so "Proceed" is enabled at once;
   * clicking it before the lookup lands sends that profile address, which the shop then
   * rejects at POST /invoices (422 "The city does not belong to the selected country").
   * That happened on slow CI runs only, never locally, where the lookup is always first.
   */
  @step('Checkout step 3: enter the billing address')
  async enterBillingAddress(address: BillingAddress): Promise<void> {
    // Start listening before typing, so a fast answer cannot be missed. Only the lookup for
    // the complete address counts: typing may also trigger lookups for partial input.
    const lookup = this.page.waitForResponse(
      (response) =>
        response.url().includes('/postcode-lookup') &&
        response.url().includes(`postcode=${address.postalCode}`) &&
        response.url().includes(`house_number=${address.houseNumber}`),
    );
    await this.countrySelect.selectOption({ label: address.country });
    await this.postalCodeInput.fill(address.postalCode);
    await this.houseNumberInput.fill(address.houseNumber);

    const response = await lookup;
    expect(response.ok(), `postcode lookup failed: ${response.status()}`).toBe(true);
    const found = (await response.json()) as { street: string };
    // The street field shows the looked-up street: the form now holds the lookup's address.
    await expect(this.streetInput).toHaveValue(found.street);

    await expect(this.proceedFromAddressButton).toBeEnabled();
    await this.proceedFromAddressButton.click();
  }

  /**
   * Step 4: choose a payment method, have it checked, then confirm the order.
   * Confirm places the order with POST /invoices. When the shop rejects the order the page
   * shows nothing, so the API's answer is checked here: a rejected order fails with the
   * shop's reason instead of a 10 s wait for a confirmation that never comes. (That reason is
   * how the step 3 race was found: 422 "The city does not belong to the selected country"
   * for the profile address, see enterBillingAddress.)
   */
  @step('Checkout step 4: pay with {0}')
  async payWith(method: PaymentMethod): Promise<void> {
    await this.paymentMethodSelect.selectOption({ label: method });
    await this.finishButton.click();
    await expect(this.paymentSuccessMessage).toHaveText('Payment was successful');
    const order = this.page.waitForResponse(
      (response) => response.url().endsWith('/invoices') && response.request().method() === 'POST',
    );
    await this.finishButton.click();
    const response = await order;
    expect(response.ok(), `the shop rejected the order: ${response.status()} ${await response.text()}`).toBe(true);
  }

  /** Checks the confirmation and returns the invoice number, e.g. "INV-2026000005". */
  @step('Check the order is confirmed')
  async expectOrderConfirmed(): Promise<string> {
    await expect(this.orderConfirmation).toContainText('Thanks for your order!');
    const invoiceNumber = (await this.orderConfirmation.locator('span').innerText()).trim();
    expect(invoiceNumber).toMatch(/^INV-\d+$/);
    return invoiceNumber;
  }
}
