import { assertAccessToken, resolveWalletDetails } from './utils.js';

// Crea una quote:
export async function createQuote(client, walletOrUrl, accessToken, quoteArgs = {}) {
  const { walletAddress, resourceServer } = await resolveWalletDetails(client, walletOrUrl);
  if (!resourceServer) {
    throw new Error('Wallet address is missing the resource server URL required to create a quote');
  }
  // Algunas implementaciones permiten crear quotes sin token, por eso es opcional.
  assertAccessToken(accessToken, 'create a quote', { optional: true });

  return client.quote.create(
    {
      url: resourceServer,
      accessToken
    },
    {
      walletAddress: quoteArgs.walletAddress ?? walletAddress,
      ...quoteArgs
    }
  );
}

export async function getQuote(client, url, accessToken) {
  return client.quote.get({ url, accessToken });
}
