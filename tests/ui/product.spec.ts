import { expect, test } from '../../src/fixtures/test';
import { toCents } from '../../src/utils/money';

test.describe('Product details', { tag: '@product' }, () => {
  test(
    '[TC-113] card and detail page show the same name and price',
    { tag: '@smoke' },
    async ({ homePage, productPage }) => {
      await homePage.open();
      // Remember what the first card promises before clicking it.
      const name = (await homePage.productNames.first().innerText()).trim();
      const cardPrice = toCents(await homePage.productPrices.first().innerText());

      await homePage.openProduct(name);

      await productPage.expectOpenFor(name);
      expect(await productPage.getUnitPriceInCents()).toBe(cardPrice);
      await expect(productPage.description).not.toBeEmpty();
    },
  );

  test('[TC-114] adding a product with a quantity updates the cart badge', async ({
    homePage,
    productPage,
    productsApi,
  }) => {
    // Out-of-stock products can't be added, and the demo's stock changes: pick one in stock now.
    const [product] = await productsApi.findInStockOnFirstPage(1);
    await homePage.open();
    await homePage.openProduct(product.name);

    await productPage.setQuantity(3);
    await productPage.addToCart();

    // The badge counts pieces, not product lines.
    await productPage.header.expectCartQuantity(3);
  });

  test('[TC-115] the + button raises the quantity by one', async ({ homePage, productPage }) => {
    await homePage.open();
    await homePage.openProduct('Thor Hammer');

    await expect(productPage.quantityInput).toHaveValue('1');
    await productPage.increaseQuantityButton.click();
    await expect(productPage.quantityInput).toHaveValue('2');
  });
});
