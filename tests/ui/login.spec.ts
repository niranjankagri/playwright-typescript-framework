import { expect, test } from '../../src/fixtures/test';
import { skipIfBotCheck } from '../../src/utils/botCheck';

// testUser: a customer this worker registered through the API (see src/fixtures/test.ts).
test.describe('Login', { tag: '@login' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test(
    '[TC-109] customer can log in and lands on the account page',
    { tag: '@smoke' },
    async ({ page, loginPage, accountPage, testUser }) => {
      await loginPage.login(testUser.email, testUser.password);

      // The redirect alone proves the server accepted the login.
      await accountPage.expectRedirectedHere();
      // From CI runners the site may show its Cloudflare bot check instead of the page: skip then (with the reason).
      await skipIfBotCheck(page, accountPage.pageTitle);
      await accountPage.expectOpen();
      // The header switches from "Sign in" to the user's name.
      await accountPage.header.expectLoggedInAs(testUser.fullName);
    },
  );

  test('[TC-110] wrong password is rejected with a message', { tag: '@negative' }, async ({ loginPage, testUser }) => {
    await loginPage.login(testUser.email, 'not-the-password');

    await loginPage.expectLoginError('Invalid email or password');
    // Still on the login page, still logged out.
    await loginPage.expectOpen();
    await loginPage.header.expectLoggedOut();
  });

  test('[TC-111] empty form shows a message for each required field', { tag: '@negative' }, async ({ loginPage }) => {
    await loginPage.submitButton.click();

    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(loginPage.passwordError).toHaveText('Password is required');
  });

  test('[TC-112] customer can sign out again', async ({ page, loginPage, accountPage, homePage, testUser }) => {
    await loginPage.login(testUser.email, testUser.password);
    await accountPage.expectRedirectedHere();
    await skipIfBotCheck(page, accountPage.pageTitle);
    await accountPage.expectOpen();

    await accountPage.header.signOut();

    await loginPage.expectOpen();
    await loginPage.header.expectLoggedOut();
    // The session is really gone: a fresh page load elsewhere is still logged out.
    await homePage.open();
    await homePage.header.expectLoggedOut();
  });
});
