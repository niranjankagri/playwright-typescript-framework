import { expect, test } from '../../src/fixtures/test';
import type { SortOption } from '../../src/pages/HomePage';
import { isSorted, type SortDirection } from '../../src/utils/sorting';

test.describe('Product catalogue', { tag: '@catalog' }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('[TC-101] home page shows a full first page of products', { tag: '@smoke' }, async ({ homePage }) => {
    // The shop pages its catalogue by 9 products.
    await expect(homePage.productCards).toHaveCount(9);
    // Every card has a name and a price.
    await expect(homePage.productNames).toHaveCount(9);
    await expect(homePage.productPrices).toHaveCount(9);
  });

  test('[TC-102] search shows only matching products', { tag: '@smoke' }, async ({ homePage, productsApi }) => {
    // The demo is shared and its data can change, so the expected count comes from the API now.
    const expected = await productsApi.search('pliers');

    await homePage.search('pliers');

    await expect(homePage.searchResultCount).toHaveText(`${expected.total} products found for 'pliers'`);
    await expect(homePage.productCards).toHaveCount(expected.data.length);
    for (const name of await homePage.getProductNames()) {
      expect(name, 'every result should mention the search term').toMatch(/pliers/i);
    }
  });

  test('[TC-103] search without a match says so', { tag: '@negative' }, async ({ homePage }) => {
    await homePage.search('no-such-tool-xyz');

    await expect(homePage.noResultsMessage).toHaveText('There are no products found.');
    await expect(homePage.productCards).toHaveCount(0);
  });

  test('[TC-104] category filter shows the same products as the API', async ({ homePage, productsApi }) => {
    // Other people's tests add products to the shared demo (e.g. into "Hammer"), so neither
    // a fixed count nor "every name contains hammer" holds. The API is the source of truth.
    const hammer = await productsApi.findByName('Claw Hammer');
    const expected = await productsApi.list({ byCategory: hammer.category.id });
    const expectedNames = expected.data.map((product) => product.name).sort();

    await homePage.filterBy(hammer.category.name);

    // The grid reloads after the click; re-read it until it shows the category's products.
    await expect.poll(async () => (await homePage.getProductNames()).sort()).toEqual(expectedNames);
  });

  // One test per sort option, generated from this table.
  const sortCases: { id: string; option: SortOption; by: 'name' | 'price'; direction: SortDirection }[] = [
    { id: 'TC-105', option: 'Name (A - Z)', by: 'name', direction: 'asc' },
    { id: 'TC-106', option: 'Name (Z - A)', by: 'name', direction: 'desc' },
    { id: 'TC-107', option: 'Price (Low - High)', by: 'price', direction: 'asc' },
    { id: 'TC-108', option: 'Price (High - Low)', by: 'price', direction: 'desc' },
  ];

  for (const { id, option, by, direction } of sortCases) {
    test(`[${id}] sort "${option}" orders the products by ${by}`, async ({ homePage }) => {
      await homePage.sortBy(option);

      // The grid re-renders after the API answers. expect.poll re-reads it until the order
      // is right (or the timeout ends), so there is no fixed wait and no race.
      await expect
        .poll(
          async () =>
            by === 'name'
              ? isSorted(await homePage.getProductNames(), direction)
              : isSorted(await homePage.getProductPricesInCents(), direction),
          { message: `products should be sorted by ${by} ${direction}` },
        )
        .toBe(true);
    });
  }
});
