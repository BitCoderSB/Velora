
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import readline from 'readline/promises';
import {
  getClient,
  getWallet,
  requestIncomingGrant,
  requestQuoteGrant,
  requestOutgoingGrantInteractive,
  createIncomingPayment,
  createQuote,
  createOutgoingPayment
} from '../modules/interledger/infra/adapters/open-payments/index.js';

import {
  OpenPaymentsClientError,
  isFinalizedGrant
} from '@interledger/open-payments';



(async () => {
  // =========================
  // Configuración del cliente
  // =========================
  // Asegúrate de que estas URLs comienzan con https:// (no con $)
  const CLIENT_WALLET_ADDRESS_URL   = "https://ilp.interledger-test.dev/2376c2db";   // para firmar llamadas (puede ser igual al sender)
  const SENDING_WALLET_ADDRESS_URL  = "https://ilp.interledger-test.dev/mxn-tony";      // wallet del emisor
  const RECEIVING_WALLET_ADDRESS_URL= "https://ilp.interledger-test.dev/bitsb3";         // wallet del receptor

  const KEY_ID          = "f23930dc-0fb8-404e-b0f4-60d80d7900b8";               // ID de la clave
  const PRIVATE_KEY_PATH= "../../../../private.key";     // ruta al PEM (nuestro helper lo lee)

  if (!CLIENT_WALLET_ADDRESS_URL || !SENDING_WALLET_ADDRESS_URL || !RECEIVING_WALLET_ADDRESS_URL) {
    throw new Error('Faltan variables: CLIENT_WALLET, SENDER_WALLET, RECEIVER_WALLET');
  }

  // Cliente autenticado que usaremos para operar (puede ser el mismo para emisor y receptor
  // si las credenciales dan acceso a ambos; si no, crea dos clientes como en ejemplos anteriores).
  const client = await getClient({
    walletAddressUrl: CLIENT_WALLET_ADDRESS_URL,
    keyId: KEY_ID,
    privateKeyPath: PRIVATE_KEY_PATH
  });

  // ======================================================
  // Paso 1: obtener info de las wallet addresses (sender/receiver)
  // ======================================================
  const sendingWalletAddress   = await getWallet(client, SENDING_WALLET_ADDRESS_URL);
  const receivingWalletAddress = await getWallet(client, RECEIVING_WALLET_ADDRESS_URL);

  console.log('\nPaso 1: got wallet addresses', {
    receivingWalletAddress,
    sendingWalletAddress
  });

  // ==================================================================================
  // Paso 2: pedir grant para INCOMING en la wallet receptora (crear/leer/listar/completar)
  // ==================================================================================
  // usamos el helper requestIncomingGrant (no interactivo normalmente)
  const incomingPaymentGrant = await requestIncomingGrant(client, RECEIVING_WALLET_ADDRESS_URL);

  console.log('\nPaso 2: got incoming payment grant for receiving wallet address', incomingPaymentGrant);

  if (!isFinalizedGrant(incomingPaymentGrant)) {
    throw new Error('Expected finalized incoming payment grant');
  }

  const incomingPaymentAccessToken = incomingPaymentGrant.access_token?.value;
  if (!incomingPaymentAccessToken) {
    throw new Error('Incoming payment grant did not return an access token');
  }

  // ======================================================================
  // Paso 3: crear el INCOMING PAYMENT (donde se recibirán los fondos)
  // ======================================================================
  const incomingPayment = await createIncomingPayment(
    // OJO: el helper usa la ruta simple (no necesitas resourceServer/AT manual)
    client,
    receivingWalletAddress,
    incomingPaymentAccessToken,
    {
      incomingAmount: {
        assetCode: receivingWalletAddress.assetCode,
        assetScale: receivingWalletAddress.assetScale,
        value: '1000' // p.ej. 10.00 si scale=2
      }
      // expiresAtISO / metadata opcionales
    }
  );

  console.log('\nPaso 3: created incoming payment on receiving wallet address', incomingPayment);

  // ===========================================================
  // Paso 4: pedir grant para QUOTE en la wallet emisora
  // ===========================================================
  const quoteGrant = await requestQuoteGrant(client, SENDING_WALLET_ADDRESS_URL);

  console.log('\nPaso 4: got quote grant for sending wallet address', quoteGrant);

  if (!isFinalizedGrant(quoteGrant)) {
    throw new Error('Expected finalized quote grant');
  }

  const quoteAccessToken = quoteGrant.access_token?.value;
  if (!quoteAccessToken) {
    throw new Error('Quote grant did not return an access token');
  }

  // ===========================================================
  // Paso 5: crear la QUOTE contra ese incoming del receptor
  // ===========================================================
  // Puedes usar receiveAmount (monto a entregar) o debitAmount (monto a debitar)
  const quote = await createQuote(
    client,
    sendingWalletAddress,
    quoteAccessToken,
    {
      receiver: incomingPayment.id,
      method: 'ilp', // requerido por el AS actual
      receiveAmount: {
        assetCode: receivingWalletAddress.assetCode,
        assetScale: receivingWalletAddress.assetScale,
        value: '1000'
      }
    }
  );

  console.log('\nPaso 5: got quote on sending wallet address', quote);

  // ===================================================================================
  // Paso 6: iniciar grant OUTGOING (INTERACTIVO) en la wallet emisora (requiere redirect)
  // ===================================================================================
  const outgoingPaymentGrant = await requestOutgoingGrantInteractive(
    client,
    SENDING_WALLET_ADDRESS_URL,
    quote.debitAmount // límite de débito sugerido por la quote
  );

  console.log('\nPaso 6: got pending outgoing payment grant', outgoingPaymentGrant);
  console.log('Please navigate to the following URL, to accept the interaction from the sending wallet:');
  console.log(outgoingPaymentGrant.interact.redirect);

  await readline
    .createInterface({ input: process.stdin, output: process.stdout })
    .question('\nPlease accept grant and press enter...');

  // Continuation del grant interactivo (igual que tu script original)
  let finalizedOutgoingPaymentGrant;
  const grantContinuationErrorMessage =
    '\nThere was an error continuing the grant. You probably have not accepted the grant at the url (or it has already been used up, in which case, rerun the script).';

  try {
    finalizedOutgoingPaymentGrant = await client.grant.continue({
      url: outgoingPaymentGrant.continue.uri,
      accessToken: outgoingPaymentGrant.continue.access_token.value
    });
  } catch (err) {
    if (err instanceof OpenPaymentsClientError) {
      console.log(grantContinuationErrorMessage);
      process.exit(1);
    }
    throw err;
  }

  if (!isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
    console.log('There was an error continuing the grant. You probably have not accepted the grant at the url.');
    process.exit(1);
  }

  const outgoingPaymentAccessToken = finalizedOutgoingPaymentGrant.access_token?.value;
  if (!outgoingPaymentAccessToken) {
    throw new Error('Finalized outgoing payment grant did not include an access token');
  }

  console.log('\nPaso 6 (finalizado): got finalized outgoing payment grant', finalizedOutgoingPaymentGrant);

  // ==============================================================================
  // Paso 7: crear el OUTGOING PAYMENT usando la quote (moverá fondos via ILP)
  // ==============================================================================
  const outgoingPayment = await createOutgoingPayment(
    client,
    sendingWalletAddress,
    outgoingPaymentAccessToken,
    quote.id
  );

  console.log(
    '\nPaso 7: Created outgoing payment. Funds will now move from the outgoing payment to the incoming payment.',
    outgoingPayment
  );

  process.exit(0);
})();
