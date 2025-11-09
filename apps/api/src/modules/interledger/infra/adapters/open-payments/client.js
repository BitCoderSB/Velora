import { createAuthenticatedClient } from '@interledger/open-payments';
import fs from 'node:fs';

export async function getClient({ walletAddressUrl, keyId, privateKeyPem, privateKeyPath }) {
  const privateKey =
    privateKeyPem ??
    (privateKeyPath ? fs.readFileSync(privateKeyPath, 'utf8') : undefined);

  if (!privateKey) {
    throw new Error('Falta la clave privada: proporciona privateKeyPem o privateKeyPath');
  }

  return createAuthenticatedClient({
    walletAddressUrl,
    keyId,
    privateKey
  });
}
