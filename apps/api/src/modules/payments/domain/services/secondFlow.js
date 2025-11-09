import {
  createAuthenticatedClient,
  OpenPaymentsClientError,
  isFinalizedGrant
} from '@interledger/open-payments';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../../../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const DEFAULT_KEY_ID = process.env.KEY_ID ?? '';
const DEFAULT_CLIENT_WALLET =
  process.env.CLIENT_WALLET ??
  process.env.CLIENT_WALLET_ADDRESS_URL ??
  '';
const DEFAULT_PRIVATE_KEY_PATH =
  resolvePath(process.env.PRIVATE_KEY_PATH) ?? path.join(projectRoot, 'private.key');

/**
 * Paso 1 del flujo: crea el Incoming Payment y arma el contexto que usaremos más adelante.
 * @param {object} params
 * @param {string} params.sendingWalletAddressUrl
 * @param {string} params.receivingWalletAddressUrl
 * @param {string|number} params.amount - valor en las unidades mínimas del asset.
 * @param {string} [params.clientWalletAddressUrl]
 * @param {string} [params.keyId]
 * @param {string} [params.privateKeyPath]
 * @param {string} [params.privateKey]
 * @param {string} [params.expiresAtISO]
 * @param {object} [params.metadata]
 */
export async function createIncomingPaymentDetails(params) {
  const {
    sendingWalletAddressUrl,
    receivingWalletAddressUrl,
    amount,
    clientWalletAddressUrl,
    keyId,
    privateKeyPath,
    privateKey,
    expiresAtISO,
    metadata
  } = params ?? {};

  assertString(sendingWalletAddressUrl, 'Missing sendingWalletAddressUrl');
  assertString(receivingWalletAddressUrl, 'Missing receivingWalletAddressUrl');

  const normalizedAmount = normalizeAmount(amount);
  const clientConfig = resolveClientConfig({
    clientWalletAddressUrl,
    sendingWalletAddressUrl,
    keyId,
    privateKeyPath,
    privateKey
  });
  const client = await createClient(clientConfig);

  const sendingWalletAddress = await client.walletAddress.get({
    url: sendingWalletAddressUrl
  });
  const receivingWalletAddress = await client.walletAddress.get({
    url: receivingWalletAddressUrl
  });

  const incomingPaymentGrant = await client.grant.request(
    { url: receivingWalletAddress.authServer },
    {
      access_token: {
        access: [
          {
            type: 'incoming-payment',
            actions: ['read', 'complete', 'create']
          }
        ]
      }
    }
  );

  if (!isFinalizedGrant(incomingPaymentGrant)) {
    throw new Error('Incoming payment grant was not finalized');
  }

  const incomingAccessToken = incomingPaymentGrant.access_token?.value;
  if (!incomingAccessToken) {
    throw new Error('Incoming payment grant did not provide an access token');
  }

  const incomingPayment = await client.incomingPayment.create(
    {
      url: receivingWalletAddress.resourceServer,
      accessToken: incomingAccessToken
    },
    {
      walletAddress: receivingWalletAddress.id,
      incomingAmount: {
        assetCode: receivingWalletAddress.assetCode,
        assetScale: receivingWalletAddress.assetScale,
        value: normalizedAmount
      },
      ...(expiresAtISO ? { expiresAt: expiresAtISO } : {}),
      ...(metadata ? { metadata } : {})
    }
  );

  return {
    incomingPayment,
    confirmation: {
      incomingPaymentId: incomingPayment.id,
      amount: normalizedAmount,
      wallets: {
        sending: serializeWallet(sendingWalletAddress),
        receiving: serializeWallet(receivingWalletAddress)
      },
      auth: {
        clientWalletAddressUrl: clientConfig.clientWalletAddressUrl,
        keyId: clientConfig.keyId,
        privateKeyPath: clientConfig.privateKeyPath
      }
    }
  };
}

/**
 * Paso 2 del flujo: parte desde la confirmación del paso anterior,
 * crea la quote y regresa la URL de autorización del grant interactivo.
 * @param {object} confirmation
 */
export async function requestAuthorizationUrl(confirmation) {
  const normalizedConfirmation = assertConfirmation(confirmation);
  const { wallets } = normalizedConfirmation;

  const clientConfig = resolveClientConfig({
    clientWalletAddressUrl: normalizedConfirmation.auth.clientWalletAddressUrl,
    keyId: normalizedConfirmation.auth.keyId,
    privateKeyPath: normalizedConfirmation.auth.privateKeyPath
  });
  const client = await createClient(clientConfig);

  const quoteGrant = await client.grant.request(
    { url: wallets.sending.authServer },
    {
      access_token: {
        access: [
          {
            type: 'quote',
            actions: ['create', 'read']
          }
        ]
      }
    }
  );

  if (!isFinalizedGrant(quoteGrant)) {
    throw new Error('Quote grant was not finalized');
  }

  const quoteAccessToken = quoteGrant.access_token?.value;
  if (!quoteAccessToken) {
    throw new Error('Quote grant did not return an access token');
  }

  const quote = await client.quote.create(
    {
      url: wallets.sending.resourceServer,
      accessToken: quoteAccessToken
    },
    {
      walletAddress: wallets.sending.id,
      receiver: normalizedConfirmation.incomingPaymentId,
      method: 'ilp',
      receiveAmount: {
        assetCode: wallets.receiving.assetCode,
        assetScale: wallets.receiving.assetScale,
        value: normalizedConfirmation.amount
      }
    }
  );

  const outgoingPaymentGrant = await client.grant.request(
    { url: wallets.sending.authServer },
    {
      access_token: {
        access: [
          {
            type: 'outgoing-payment',
            actions: ['read', 'create'],
            limits: {
              debitAmount: {
                assetCode: quote.debitAmount.assetCode,
                assetScale: quote.debitAmount.assetScale,
                value: quote.debitAmount.value
              }
            },
            identifier: wallets.sending.id
          }
        ]
      },
      interact: {
        start: ['redirect']
      }
    }
  );

  const authorizationUrl = outgoingPaymentGrant.interact?.redirect;
  if (!authorizationUrl) {
    throw new Error('Authorization URL was not provided by the outgoing grant');
  }

  return {
    authorizationUrl,
    pendingAuthorization: {
      quote,
      incomingPaymentId: normalizedConfirmation.incomingPaymentId,
      amount: normalizedConfirmation.amount,
      wallets,
      auth: normalizedConfirmation.auth,
      continuation: {
        uri: outgoingPaymentGrant.continue?.uri,
        accessToken: outgoingPaymentGrant.continue?.access_token?.value
      }
    }
  };
}

/**
 * Paso 3 del flujo: se invoca después de que el usuario autorizó el grant.
 * Continúa el grant y crea el outgoing payment, devolviendo los detalles.
 * @param {object} pendingAuthorization
 */
export async function finalizeAuthorizedPayment(pendingAuthorization) {
  const normalized = assertPendingAuthorization(pendingAuthorization);

  const clientConfig = resolveClientConfig({
    clientWalletAddressUrl: normalized.auth.clientWalletAddressUrl,
    keyId: normalized.auth.keyId,
    privateKeyPath: normalized.auth.privateKeyPath
  });
  const client = await createClient(clientConfig);

  let finalizedGrant;
  try {
    finalizedGrant = await client.grant.continue({
      url: normalized.continuation.uri,
      accessToken: normalized.continuation.accessToken
    });
  } catch (err) {
    if (err instanceof OpenPaymentsClientError) {
      throw new Error(
        'Unable to finalize the outgoing payment grant. Make sure the authorization has been accepted.'
      );
    }
    throw err;
  }

  if (!isFinalizedGrant(finalizedGrant)) {
    throw new Error('The outgoing payment grant could not be finalized');
  }

  const outgoingAccessToken = finalizedGrant.access_token?.value;
  if (!outgoingAccessToken) {
    throw new Error('Finalized outgoing payment grant did not return an access token');
  }

  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: normalized.wallets.sending.resourceServer,
      accessToken: outgoingAccessToken
    },
    {
      walletAddress: normalized.wallets.sending.id,
      quoteId: normalized.quote.id
    }
  );

  return {
    outgoingPayment,
    finalizedGrant
  };
}

function resolvePath(relativeOrAbsolute) {
  if (!relativeOrAbsolute) {
    return undefined;
  }
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(projectRoot, relativeOrAbsolute);
}

function assertString(value, message) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(message);
  }
}

function normalizeAmount(amount) {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Amount must be a positive number');
    }
    if (!Number.isInteger(amount)) {
      throw new Error(
        'Amount must be expressed in the smallest unit (integer). For decimals, convert before calling.'
      );
    }
    return String(amount);
  }

  if (typeof amount === 'string' && /^\d+$/.test(amount)) {
    return amount;
  }

  throw new Error(
    'Amount must be a numeric string (only digits) or a positive integer in the smallest unit.'
  );
}

function serializeWallet(walletAddress) {
  return {
    id: walletAddress.id,
    assetCode: walletAddress.assetCode,
    assetScale: walletAddress.assetScale,
    authServer: walletAddress.authServer,
    resourceServer: walletAddress.resourceServer
  };
}

async function createClient(config) {
  const privateKey = config.privateKey ?? (config.privateKeyPath
    ? await fs.readFile(config.privateKeyPath, 'utf8')
    : undefined);

  if (!privateKey) {
    throw new Error(
      'Missing private key. Provide privateKey|privateKeyPath argument or set PRIVATE_KEY_PATH env var.'
    );
  }

  assertString(config.clientWalletAddressUrl, 'clientWalletAddressUrl is required to create the client');
  assertString(config.keyId, 'keyId is required to create the client');

  return createAuthenticatedClient({
    walletAddressUrl: config.clientWalletAddressUrl,
    keyId: config.keyId,
    privateKey
  });
}

function resolveClientConfig({
  clientWalletAddressUrl,
  sendingWalletAddressUrl,
  keyId,
  privateKeyPath,
  privateKey
} = {}) {
  return {
    clientWalletAddressUrl:
      clientWalletAddressUrl || DEFAULT_CLIENT_WALLET || sendingWalletAddressUrl || '',
    keyId: keyId || DEFAULT_KEY_ID,
    privateKeyPath: resolvePath(privateKeyPath) ?? DEFAULT_PRIVATE_KEY_PATH,
    privateKey
  };
}

function assertConfirmation(confirmation) {
  if (!confirmation) {
    throw new Error('Confirmation payload is required');
  }
  const { incomingPaymentId, amount, wallets, auth } = confirmation;
  assertString(incomingPaymentId, 'Confirmation is missing the incomingPaymentId');
  assertString(amount, 'Confirmation is missing the amount');
  if (!wallets?.sending?.id || !wallets?.receiving?.id) {
    throw new Error('Confirmation is missing wallet details');
  }
  if (!auth?.clientWalletAddressUrl || !auth?.keyId || !auth?.privateKeyPath) {
    throw new Error('Confirmation is missing auth details (clientWalletAddressUrl, keyId, privateKeyPath)');
  }
  return confirmation;
}

function assertPendingAuthorization(pendingAuthorization) {
  if (!pendingAuthorization) {
    throw new Error('pendingAuthorization payload is required');
  }
  const { continuation, quote, wallets, auth } = pendingAuthorization;
  if (!continuation?.uri || !continuation?.accessToken) {
    throw new Error('pendingAuthorization is missing continuation info');
  }
  if (!quote?.id) {
    throw new Error('pendingAuthorization is missing the quote details');
  }
  if (!wallets?.sending?.resourceServer || !wallets?.sending?.id) {
    throw new Error('pendingAuthorization is missing the sending wallet details');
  }
  if (!auth?.clientWalletAddressUrl || !auth?.keyId || !auth?.privateKeyPath) {
    throw new Error('pendingAuthorization is missing auth info');
  }
  return pendingAuthorization;
}
