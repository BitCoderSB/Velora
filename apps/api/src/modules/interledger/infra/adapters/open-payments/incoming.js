import { assertAccessToken, resolveWalletDetails } from './utils.js';

// Crear un Incoming Payment (opcional: monto máximo y expiración)
export async function createIncomingPayment(client, walletOrUrl, accessToken, { incomingAmount, expiresAtISO, metadata } = {}) {
  const { walletAddress, resourceServer } = await resolveWalletDetails(client, walletOrUrl);
  if (!resourceServer) {
    throw new Error('Wallet address is missing the resource server URL required to create the incoming payment');
  }
  assertAccessToken(accessToken, 'create an incoming payment');

  return client.incomingPayment.create(
    { url: resourceServer, accessToken },
    {
      walletAddress,
      ...(incomingAmount ? { incomingAmount } : {}),
      ...(expiresAtISO ? { expiresAt: expiresAtISO } : {}),
      ...(metadata ? { metadata } : {})
    }
  );
}

export async function listIncomingPayments(client, walletOrUrl, accessToken, pagination) {
  const { walletAddress, resourceServer } = await resolveWalletDetails(client, walletOrUrl);
  if (!resourceServer) {
    throw new Error('Wallet address is missing the resource server URL required to list incoming payments');
  }
  assertAccessToken(accessToken, 'list incoming payments');

  return client.incomingPayment.list(
    {
      url: resourceServer,
      walletAddress,
      accessToken
    },
    pagination
  );
}

export async function getIncomingPayment(client, url, accessToken) {
  return client.incomingPayment.get({ url, accessToken });
}

export async function completeIncomingPayment(client, url, accessToken) {
  assertAccessToken(accessToken, 'complete the incoming payment');
  return client.incomingPayment.complete({ url, accessToken });
}
