import { ValidationErrorSchema } from '../../src/api/schemas';
import { expect, test as base } from '../../src/fixtures/test';

// Every test that asks for `cartId` gets its own new cart, so tests never see each
// other's items. A fixture instead of a shared `let` variable: safe in parallel runs.
const test = base.extend<{ cartId: string }>({
  cartId: async ({ cartsApi }, use) => {
    await use(await cartsApi.create());
  },
});

test.describe('Carts API', { tag: '@carts' }, () => {
  test('[TC-208] a new cart is empty', { tag: '@smoke' }, async ({ cartsApi, cartId }) => {
    const cart = await cartsApi.getCart(cartId);

    expect(cart.id).toBe(cartId);
    expect(cart.cart_items).toEqual([]);
  });

  test(
    '[TC-209] an added product is in the cart with its quantity',
    { tag: '@smoke' },
    async ({ cartsApi, productsApi, cartId }) => {
      const hammer = await productsApi.findByName('Claw Hammer');

      const response = await cartsApi.addItem(cartId, hammer.id, 2);

      await expect(response).toBeOK();
      const cart = await cartsApi.getCart(cartId);
      expect(cart.cart_items).toHaveLength(1);
      expect(cart.cart_items[0]).toMatchObject({ product_id: hammer.id, quantity: 2 });
      // The cart carries the product's current price.
      expect(cart.cart_items[0].product.price).toBe(hammer.price);
    },
  );

  test('[TC-210] quantity can be changed and the product removed', async ({ cartsApi, productsApi, cartId }) => {
    const hammer = await productsApi.findByName('Claw Hammer');
    await cartsApi.addItem(cartId, hammer.id, 1);

    await expect(await cartsApi.updateQuantity(cartId, hammer.id, 5)).toBeOK();
    expect((await cartsApi.getCart(cartId)).cart_items[0].quantity).toBe(5);

    const removed = await cartsApi.removeItem(cartId, hammer.id);
    expect(removed.status()).toBe(204);
    expect((await cartsApi.getCart(cartId)).cart_items).toEqual([]);
  });

  test(
    '[TC-211] quantity below 1 is rejected with a field error',
    { tag: '@negative' },
    async ({ cartsApi, productsApi, cartId }) => {
      const hammer = await productsApi.findByName('Claw Hammer');

      const response = await cartsApi.addItem(cartId, hammer.id, 0);

      expect(response.status()).toBe(422);
      const body = ValidationErrorSchema.parse(await response.json());
      expect(body.errors.quantity).toContain('The quantity field must be at least 1.');
    },
  );

  test('[TC-212] unknown product id is rejected', { tag: '@negative' }, async ({ cartsApi, cartId }) => {
    const response = await cartsApi.addItem(cartId, 'no-such-product', 1);

    expect(response.status()).toBe(422);
    const body = ValidationErrorSchema.parse(await response.json());
    expect(body.errors.product_id).toContain('The selected product id is invalid.');
  });

  test(
    '[TC-213] business rule: only one Thor Hammer per cart',
    { tag: '@negative' },
    async ({ cartsApi, productsApi, cartId }) => {
      const thorHammer = await productsApi.findByName('Thor Hammer');

      const response = await cartsApi.addItem(cartId, thorHammer.id, 2);

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ message: 'You can only have one Thor Hammer in the cart.' });
      // Nothing was added.
      expect((await cartsApi.getCart(cartId)).cart_items).toEqual([]);
    },
  );

  test('[TC-214] unknown cart id returns 404', { tag: '@negative' }, async ({ cartsApi }) => {
    const response = await cartsApi.getById('no-such-cart');

    expect(response.status()).toBe(404);
  });
});
