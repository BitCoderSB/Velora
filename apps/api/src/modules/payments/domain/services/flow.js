import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
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
import { OpenPaymentsClientError, isFinalizedGrant } from '@interledger/open-payments';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

(async () => {
  const config = loadConfig();
  const rl = readline.createInterface({ input, output });

  try {
    await runFixedDeliveryFlow({ config, rl });
    console.log('\n✅ Flujo fixed-delivery completado.');
    process.exit(0);
  } catch (err) {
    handleFatalError(err);
  } finally {
    rl.close();
  }
})();

async function runFixedDeliveryFlow({ config, rl }) {
  const { sender, receiver, charge, customerId, nipExpected } = config;

  console.log('\n=== Configuración ===');
  console.log({
    senderWallet: sender.walletUrl,
    senderKeyId: sender.keyId,
    receiverWallet: receiver.walletUrl,
    receiverKeyId: receiver.keyId,
    customerId
  });

  const [senderClient, receiverClient] = await Promise.all([
    getClient({ walletAddressUrl: sender.walletUrl, keyId: sender.keyId, privateKeyPath: sender.privateKeyPath }),
    getClient({ walletAddressUrl: receiver.walletUrl, keyId: receiver.keyId, privateKeyPath: receiver.privateKeyPath })
  ]);

  const [sendingWallet, receivingWallet] = await Promise.all([
    getWallet(senderClient, sender.walletUrl),
    getWallet(receiverClient, receiver.walletUrl)
  ]);

  const incomingAmount = buildIncomingAmount(charge, receivingWallet);
  console.log('\n=== Paso 1: wallets resueltas ===');
  console.log({
    sendingWallet: sendingWallet.id,
    receivingWallet: receivingWallet.id,
    receiverAsset: `${receivingWallet.assetCode}/${receivingWallet.assetScale}`
  });

  const incomingGrant = await requestIncomingGrant(receiverClient, receiver.walletUrl);
  ensure(isFinalizedGrant(incomingGrant), 'Expected finalized incoming payment grant');
  const incomingAccessToken = ensure(incomingGrant.access_token?.value, 'Incoming payment grant missing access token');

  const incomingPayment = await createIncomingPayment(
    receiverClient,
    receivingWallet,
    incomingAccessToken,
    {
      incomingAmount,
      metadata: { description: charge.description }
    }
  );

  console.log('\n=== Paso 3: Incoming Payment creado ===');
  console.log({ incomingPayment: incomingPayment.id, amount: formatAmount(incomingPayment.incomingAmount) });

  const nip = await ask(rl, '\nIngresa tu NIP para autorizar: ');
  const nipOk = await verifyNipLocally({ customerId, nipPlain: nip, expected: nipExpected });
  if (!nipOk) {
    throw new Error('NIP inválido. Operación cancelada.');
  }

  const quoteGrant = await requestQuoteGrant(senderClient, sender.walletUrl);
  ensure(isFinalizedGrant(quoteGrant), 'Expected finalized quote grant');
  const quoteAccessToken = quoteGrant.access_token?.value;

  const receiveAmountForQuote = incomingPayment.incomingAmount ?? incomingAmount;
  const quote = await createQuote(
    senderClient,
    sendingWallet,
    quoteAccessToken,
    {
      receiver: incomingPayment.id,
      method: 'ilp',
      receiveAmount: receiveAmountForQuote
    }
  );

  console.log('\n=== Paso 5: Quote generada ===');
  console.log({
    receiveAmount: formatAmount(quote.receiveAmount),
    debitAmount: formatAmount(quote.debitAmount)
  });

  const outgoingGrantPending = await requestOutgoingGrantInteractive(
    senderClient,
    sender.walletUrl,
    quote.debitAmount
  );

  console.log('\n=== Paso 6: Grant OUTGOING pendiente ===');
  console.log('Abre esta URL y acepta el consentimiento:', outgoingGrantPending.interact.redirect);
  await ask(rl, '\nCuando termines el consentimiento en el navegador, presiona Enter...');

  let finalizedOutgoingGrant;
  try {
    finalizedOutgoingGrant = await senderClient.grant.continue({
      url: outgoingGrantPending.continue.uri,
      accessToken: outgoingGrantPending.continue.access_token.value
    });
  } catch (err) {
    throw new Error('No se pudo continuar el grant interactivo. Asegúrate de aceptar el consentimiento y reintenta.', { cause: err });
  }

  ensure(isFinalizedGrant(finalizedOutgoingGrant), 'Outgoing payment grant was not finalized');
  const outgoingAccessToken = ensure(finalizedOutgoingGrant.access_token?.value, 'Finalized outgoing grant missing access token');

  const outgoingPayment = await createOutgoingPayment(
    senderClient,
    sendingWallet,
    outgoingAccessToken,
    quote.id
  );

  console.log('\n=== Paso 7: Outgoing Payment creado ===');
  console.log({ outgoingPayment: outgoingPayment.id, state: outgoingPayment.state });
  console.log('\nResumen:');
  console.log(`  Vendedor recibirá: ${formatAmount(quote.receiveAmount)}`);
  console.log(`  Cliente pagará:    ${formatAmount(quote.debitAmount)}`);
}

async function verifyNipLocally({ customerId, nipPlain, expected }) {
  void customerId;
  if (!nipPlain) return false;
  return nipPlain.trim() === expected;
}

function loadConfig() {
  const senderWallet = ensure(process.env.SENDER_WALLET ?? process.env.SENDER_WALLET_URL, 'Configura SENDER_WALLET en tu .env');
  const receiverWallet = ensure(process.env.RECEIVER_WALLET ?? process.env.RECEIVER_WALLET_URL, 'Configura RECEIVER_WALLET en tu .env');

  const senderKeyId = ensure(process.env.SENDER_KEY_ID ?? process.env.KEY_ID, 'Configura SENDER_KEY_ID o KEY_ID en tu .env');
  const receiverKeyId = ensure(process.env.RECEIVER_KEY_ID ?? process.env.KEY_ID, 'Configura RECEIVER_KEY_ID o KEY_ID en tu .env');

  const senderKeyPath = resolveKeyPath(process.env.SENDER_KEY_PATH ?? process.env.PRIVATE_KEY_PATH ?? 'private.key');
  const receiverKeyPath = resolveKeyPath(process.env.RECEIVER_KEY_PATH ?? process.env.PRIVATE_KEY_PATH ?? 'private.key');

  return {
    sender: { walletUrl: senderWallet, keyId: senderKeyId, privateKeyPath: senderKeyPath },
    receiver: { walletUrl: receiverWallet, keyId: receiverKeyId, privateKeyPath: receiverKeyPath },
    charge: {
      value: normalizeMinorUnits(process.env.CHARGE_VALUE ?? '1000'),
      assetCode: process.env.CHARGE_ASSET_CODE,
      assetScale: process.env.CHARGE_ASSET_SCALE ? Number(process.env.CHARGE_ASSET_SCALE) : undefined,
      description: process.env.CHARGE_DESCRIPTION ?? 'Compra demo fixed-delivery'
    },
    customerId: process.env.CUSTOMER_ID ?? 'demo-user',
    nipExpected: process.env.DEMO_NIP ?? '1234'
  };
}

function buildIncomingAmount(charge, receivingWallet) {
  const assetCode = charge.assetCode ?? receivingWallet.assetCode;
  const assetScale = Number.isInteger(charge.assetScale) ? charge.assetScale : receivingWallet.assetScale;
  ensure(assetCode, 'Receiver wallet missing asset code');
  ensure(Number.isInteger(assetScale), 'Receiver wallet missing asset scale');
  return {
    value: normalizeMinorUnits(charge.value),
    assetCode,
    assetScale
  };
}

function normalizeMinorUnits(value) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('CHARGE_VALUE debe ser un entero positivo en unidades mínimas');
    }
    return value.toString();
  }
  if (typeof value === 'string') {
    const sanitized = value.trim();
    if (!/^\d+$/.test(sanitized)) {
      throw new Error('CHARGE_VALUE debe ser un string de números enteros (minor units)');
    }
    return sanitized;
  }
  throw new Error('CHARGE_VALUE debe ser número o string');
}

function formatAmount(amount) {
  if (!amount) return 'N/D';
  const scale = Number(amount.assetScale ?? 2);
  const value = Number(amount.value ?? 0) / 10 ** scale;
  return `${value.toFixed(scale)} ${amount.assetCode}`;
}

function ensure(value, message) {
  if (value === undefined || value === null || value === '') {
    throw new Error(message);
  }
  return value;
}

function resolveKeyPath(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath) {
    throw new Error('Debes configurar PRIVATE_KEY_PATH o una ruta específica para la clave');
  }
  if (path.isAbsolute(relativeOrAbsolutePath)) {
    return relativeOrAbsolutePath;
  }
  return path.resolve(findProjectRoot(), relativeOrAbsolutePath);
}

function findProjectRoot() {
  let dir = __dirname;
  const root = path.parse(dir).root;
  while (dir && dir !== root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

async function ask(rl, question) {
  return (await rl.question(question)).trim();
}

function handleFatalError(err) {
  const openPaymentsError = err instanceof OpenPaymentsClientError ? err : err?.cause instanceof OpenPaymentsClientError ? err.cause : null;

  console.error('\nError ejecutando el flujo fixed-delivery:');
  console.error(err.message);

  if (openPaymentsError) {
    console.error('Detalles Open Payments:', {
      status: openPaymentsError.status,
      description: openPaymentsError.description,
      code: openPaymentsError.code
    });
    if (openPaymentsError.code === 'invalid_client') {
      console.error(
        'Sugerencia: verifica que SENDER_KEY_ID/SENDER_KEY_PATH y RECEIVER_KEY_ID/RECEIVER_KEY_PATH ' +
          'correspondan a las credenciales registradas en cada wallet address.'
      );
    }
  }

  process.exit(1);
}