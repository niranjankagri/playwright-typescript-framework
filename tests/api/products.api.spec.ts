import { expect, test } from '../../src/fixtures/test';
import { isSorted } from '../../src/utils/sorting';

test.describe('Products API', { tag: '@products' }, () => {
  test('[TC-215] first page matches the paging contract', { tag: '@smoke' }, async ({ productsApi }) => {
    // list() already validates every product against ProductSchema.
    const page = await productsApi.list();

    expect(page.current_page).toBe(1);
    expect(page.data).toHaveLength(page.per_page);
    expect(page.last_page).toBe(Math.ceil(page.total / page.per_page));
  });

  test('[TC-216] pages do not overlap', async ({ productsApi }) => {
    const first = await productsApi.list({ page: 1 });
    const second = await productsApi.list({ page: 2 });

    const firstIds = new Set(first.data.map((product) => product.id));
    // A product that shows up on two pages would be counted twice by a client.
    expect(second.data.filter((product) => firstIds.has(product.id))).toEqual([]);
  });

  test('[TC-217] a product can be fetched by id', async ({ productsApi }) => {
    const [listed] = (await productsApi.list()).data;

    const product = await productsApi.getProduct(listed.id);

    // The detail endpoint agrees with the list endpoint.
    expect(product).toMatchObject({ id: listed.id, name: listed.name, price: listed.price });
  });

  test('[TC-218] unknown product id returns 404', { tag: '@negative' }, async ({ productsApi }) => {
    const response = await productsApi.getById('01ZZZZZZZZZZZZZZZZZZZZZZZZ');

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Requested item not found' });
  });

  test('[TC-219] search returns only matching products', { tag: '@smoke' }, async ({ productsApi }) => {
    const result = await productsApi.search('hammer');

    expect(result.total).toBeGreaterThan(0);
    for (const product of result.data) {
      expect(product.name).toMatch(/hammer/i);
    }
  });

  test('[TC-220] search without a match returns an empty page', { tag: '@negative' }, async ({ productsApi }) => {
    const result = await productsApi.search('no-such-tool-xyz');

    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  // TC-221: ascending, TC-222: descending
  for (const [id, direction] of [
    ['TC-221', 'asc'],
    ['TC-222', 'desc'],
  ] as const) {
    test(`[${id}] sort by price ${direction} is applied by the API`, async ({ productsApi }) => {
      const page = await productsApi.list({ sort: `price,${direction}` });

      const prices = page.data.map((product) => product.price);
      expect(isSorted(prices, direction), `prices ${prices.join(', ')}`).toBe(true);
    });
  }

  test('[TC-223] category filter returns only that category', async ({ productsApi }) => {
    // Take the category id from a known product instead of hard-coding it.
    const hammer = await productsApi.findByName('Claw Hammer');

    const page = await productsApi.list({ byCategory: hammer.category.id });

    expect(page.total).toBeGreaterThan(0);
    for (const product of page.data) {
      expect(product.category.name).toBe(hammer.category.name);
    }
  });
});
