import { env } from '../../src/config/env';
import { buildProduct, buildProductPage } from '../../src/data/products';
import { expect, test } from '../../src/fixtures/test';

/**
 * Tests that control the network between the browser and the API with page.route().
 * They check how the front end reacts to answers the real API rarely gives
 * (an exact data set, an empty list, a server error), fast and without test data on the server.
 */

// The catalogue's list request: /products exactly (not /products/search or /products/{id}).
const PRODUCT_LIST = new RegExp(`^${env.apiUrl}/products(\\?.*)?$`);

test.describe('Catalogue with a mocked API', { tag: '@network' }, () => {
  test('[TC-120] renders exactly the products the API sends', async ({ page, homePage }) => {
    const products = [
      buildProduct({ name: 'Mocked Mallet', price: 1.23 }),
      buildProduct({ name: 'Mocked Spanner', price: 45.6 }),
    ];
    await page.route(PRODUCT_LIST, (route) => route.fulfill({ json: buildProductPage(products) }));

    await homePage.open();

    // Names and prices on the cards come straight from the mocked response.
    await expect(homePage.productNames).toHaveText(['Mocked Mallet', 'Mocked Spanner']);
    await expect(homePage.productPrices).toHaveText(['$1.23', '$45.60']);
  });

  test('[TC-121] shows a message when the API returns no products', async ({ page, homePage }) => {
    await page.route(PRODUCT_LIST, (route) => route.fulfill({ json: buildProductPage([]) }));

    await page.goto('/');

    await expect(homePage.noResultsMessage).toHaveText('There are no products found.');
    await expect(homePage.productCards).toHaveCount(0);
  });

  test('[TC-122] a failing product API leaves the rest of the page working', async ({ page, homePage }) => {
    await page.route(PRODUCT_LIST, (route) => route.fulfill({ status: 500, json: { message: 'Server Error' } }));

    await page.goto('/');

    // Current behaviour: no products and no error message, but the page does not break:
    // navigation, search and sorting are still there.
    await expect(homePage.header.signInLink).toBeVisible();
    await expect(homePage.searchInput).toBeEditable();
    await expect(homePage.sortDropdown).toBeEnabled();
    await expect(homePage.productCards).toHaveCount(0);
  });
});

test.describe('Requests the front end sends', { tag: '@network' }, () => {
  test('[TC-123] sorting asks the API for sorted data', async ({ page, homePage }) => {
    await homePage.open();

    // Start listening before the action that triggers the request, so it cannot be missed.
    const sortRequest = page.waitForRequest(
      (request) =>
        PRODUCT_LIST.test(request.url()) && (request.postDataJSON() as { sort?: string } | null)?.sort === 'price,asc',
    );
    await homePage.sortBy('Price (Low - High)');
    const request = await sortRequest;

    // The front end sends the list filters in the body of an HTTP QUERY request
    // (a newer, cacheable alternative to GET with a body), not as URL parameters.
    expect(request.method()).toBe('QUERY');
    expect(request.postDataJSON()).toMatchObject({ sort: 'price,asc' });
  });

  test('[TC-124] search sends the search term to the search endpoint', async ({ page, homePage }) => {
    await homePage.open();

    const searchResponse = page.waitForResponse(`${env.apiUrl}/products/search`);
    await homePage.search('saw');
    const response = await searchResponse;

    expect(response.request().postDataJSON()).toEqual({ q: 'saw' });
    expect(response.ok()).toBe(true);
    // The UI shows as many cards as the API returned products.
    const body = (await response.json()) as { data: unknown[] };
    await expect(homePage.productCards).toHaveCount(body.data.length);
  });
});
