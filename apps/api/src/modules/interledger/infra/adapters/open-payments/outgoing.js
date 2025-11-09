import { assertAccessToken, resolveWalletDetails } from './utils.js';

export async function createOutgoingPayment(client, walletOrUrl, accessToken, quoteId) {
  const { walletAddress, resourceServer } = await resolveWalletDetails(client, walletOrUrl);
  if (!resourceServer) {
    throw new Error('Wallet address is missing the resource server URL required to create the outgoing payment');
  }
  assertAccessToken(accessToken, 'create an outgoing payment');

  return client.outgoingPayment.create(
    { url: resourceServer, accessToken },
    {
      walletAddress,
      quoteId
    }
  );
}

export async function listOutgoingPayments(client, walletOrUrl, accessToken, pagination) {
  const { walletAddress, resourceServer } = await resolveWalletDetails(client, walletOrUrl);
  if (!resourceServer) {
    throw new Error('Wallet address is missing the resource server URL required to list outgoing payments');
  }
  assertAccessToken(accessToken, 'list outgoing payments');

  return client.outgoingPayment.list(
    {
      url: resourceServer,
      walletAddress,
      accessToken
    },
    pagination
  );
}

export async function getOutgoingPayment(client, url, accessToken) {
  return client.outgoingPayment.get({ url, accessToken });
}
