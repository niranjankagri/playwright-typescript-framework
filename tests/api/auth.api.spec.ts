import { LoginResponseSchema, UserSchema } from '../../src/api/schemas';
import { buildNewUser } from '../../src/data/users';
import { expect, test } from '../../src/fixtures/test';

// testUser: a customer this worker registered through the API (see src/fixtures/test.ts).
test.describe('Auth API', { tag: '@auth' }, () => {
  test('[TC-201] a new customer can register', { tag: '@smoke' }, async ({ authApi }) => {
    const user = buildNewUser();

    const response = await authApi.register(user);

    expect(response.status()).toBe(201);
    const created = UserSchema.parse(await response.json());
    expect(created).toMatchObject({ email: user.email, first_name: user.firstName, last_name: user.lastName });
    // The password must never come back in a response.
    expect(await response.json()).not.toHaveProperty('password');
  });

  test(
    '[TC-202] registering the same e-mail twice is rejected',
    { tag: '@negative' },
    async ({ authApi, testUser }) => {
      const response = await authApi.register({ ...buildNewUser(), email: testUser.email });

      // 409 Conflict (not 422): the request is valid, but the account already exists.
      expect(response.status()).toBe(409);
      expect(await response.json()).toEqual({ email: ['A customer with this email address already exists.'] });
    },
  );

  test('[TC-203] valid login returns a bearer JWT', { tag: '@smoke' }, async ({ authApi, testUser }) => {
    const response = await authApi.login(testUser.email, testUser.password);

    expect(response.status()).toBe(200);
    // Contract: the schema checks the token format, the token type and the expiry.
    const body = LoginResponseSchema.parse(await response.json());
    expect(body.expires_in, 'token lifetime in seconds').toBeGreaterThan(0);
  });

  test('[TC-204] the token identifies the logged-in user', async ({ authApi, testUser }) => {
    const token = await authApi.getAccessToken(testUser.email, testUser.password);

    const user = await authApi.getCurrentUser(token);

    expect(user.email).toBe(testUser.email);
    expect(`${user.first_name} ${user.last_name}`).toBe(testUser.fullName);
  });

  test('[TC-205] wrong password is rejected with 401', { tag: '@negative' }, async ({ authApi, testUser }) => {
    const response = await authApi.login(testUser.email, 'not-the-password');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  test('[TC-206] current user needs a token', { tag: '@negative' }, async ({ authApi }) => {
    const response = await authApi.me();

    expect(response.status()).toBe(401);
  });

  test('[TC-207] a made-up token is rejected', { tag: '@negative' }, async ({ authApi }) => {
    // Right JWT shape, wrong signature.
    const response = await authApi.me('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalid-signature');

    expect(response.status()).toBe(401);
  });
});
