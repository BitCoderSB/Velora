import {
  getClient,
  getWallet,
  requestIncomingGrant,
  requestQuoteGrant,
  requestOutgoingGrantInteractive,
  createIncomingPayment,
  createQuote
} from '../../interledger/infra/adapters/open-payments/index.js';
import { isFinalizedGrant } from '@interledger/open-payments';
import { identifyParticipants } from './identify-participants.js';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import { custom } from 'zod';

export async function initiateCharge(payload = {}) {
  const {
    customerEmail,
    merchantEmail,
    amountMinorUnits,
    description,
    customerNip
  } = normalizePayload(payload);

  const { customer, merchant } = await identifyParticipants({
    customerEmail,
    merchantEmail
  });

  console.log(customer, merchant);

  await verifyCustomerNip(customer, customerNip);

  const sender = extractParticipantCredentials(customer, 'customer');
  const receiver = extractParticipantCredentials(merchant.role="merchant", 'merchant');

  const charge = {
    value: amountMinorUnits,
    description: description ?? `Cobro de ${merchant.profile?.brand ?? 'comercio'}`
  };

  const [senderClient] = await Promise.all([
    getClient({
      walletAddressUrl: sender.walletUrl,
      keyId: sender.keyId,
      privateKeyPem: sender.privateKey
    })
  ]);

  const [sendingWallet, receivingWallet] = await Promise.all([
    getWallet(senderClient, sender.walletUrl),
    getWallet(receiverClient, receiver.walletUrl)
  ]);

  const incomingAmount = buildIncomingAmount(charge, receivingWallet);

  const incomingGrant = await requestIncomingGrant(receiverClient, receiver.walletUrl);
  ensure(isFinalizedGrant(incomingGrant), 'El grant de incoming payment no se finalizó');
  const incomingAccessToken = ensure(
    incomingGrant.access_token?.value,
    'El incoming grant no entregó access token'
  );

  const incomingPayment = await createIncomingPayment(
    receiverClient,
    receivingWallet,
    incomingAccessToken,
    {
      incomingAmount,
      metadata: { description: charge.description }
    }
  );

  const quoteGrant = await requestQuoteGrant(senderClient, sender.walletUrl);
  ensure(isFinalizedGrant(quoteGrant), 'El grant de quote no se finalizó');
  const quoteAccessToken = ensure(
    quoteGrant.access_token?.value,
    'El quote grant no entregó access token'
  );

  const quote = await createQuote(
    senderClient,
    sendingWallet,
    quoteAccessToken,
    {
      receiver: incomingPayment.id,
      method: 'ilp',
      receiveAmount: incomingPayment.incomingAmount ?? incomingAmount
    }
  );

  const outgoingGrantPending = await requestOutgoingGrantInteractive(
    senderClient,
    sender.walletUrl,
    quote.debitAmount
  );

  return {
    status: 'awaiting_consent',
    incomingPayment: {
      id: incomingPayment.id,
      walletId: receivingWallet.id,
      amount: incomingPayment.incomingAmount ?? incomingAmount
    },
    quote: {
      id: quote.id,
      receiveAmount: quote.receiveAmount,
      debitAmount: quote.debitAmount,
      formatted: {
        merchantReceives: formatAmount(quote.receiveAmount),
        customerPays: formatAmount(quote.debitAmount)
      }
    },
    consent: {
      redirect: outgoingGrantPending.interact.redirect,
      continueUri: outgoingGrantPending.continue.uri,
      continueAccessToken: outgoingGrantPending.continue.access_token.value
    },
    summary: {
      description: charge.description,
      merchantReceives: formatAmount(quote.receiveAmount),
      customerPays: formatAmount(quote.debitAmount)
    }
  };
}

function normalizePayload(input) {
  const amount = input.amount ?? {};
  return {
    customerEmail: input.customerEmail ?? input.customerIdentifier,
    merchantEmail: input.merchantEmail ?? input.merchantIdentifier,
    amountMinorUnits: normalizeMinorUnits(
      input.amountMinorUnits ?? amount.value ?? input.value
    ),
    description: input.description ?? amount.description,
    customerNip: input.customerNip ?? input.nip ?? ''
  };
}

async function verifyCustomerNip(customer, nipProvided) {
  if (!nipProvided) {
    throw buildHttpError(400, 'Debes enviar el NIP del cliente para autorizar el cobro.');
  }
  const storedNip = `${customer.nip ?? ''}`.trim();
  if (!storedNip) {
    throw buildHttpError(400, 'El cliente no tiene NIP registrado.');
  }
  const provided = nipProvided.trim();

  if (storedNip.startsWith('$argon2')) {
    const matches = await argon2.verify(storedNip, provided);
    if (!matches) {
      throw buildHttpError(401, 'El NIP proporcionado es inválido.');
    }
    return true;
  }

  if (
    storedNip.startsWith('$2a$') ||
    storedNip.startsWith('$2b$') ||
    storedNip.startsWith('$2y$')
  ) {
    const matches = await bcrypt.compare(provided, storedNip);
    if (!matches) {
      throw buildHttpError(401, 'El NIP proporcionado es inválido.');
    }
    return true;
  }

  if (provided !== storedNip) {
    throw buildHttpError(401, 'El NIP proporcionado es inválido.');
  }
  return true;
}

function extractParticipantCredentials(participant, role) {
  const walletUrl = participant.activeKey?.url ?? participant.walletUrl;
  let keyId = participant.activeKey?.keyId ?? participant.keyId ?? resolveKeyIdFromEnv(role);
  const privateKeyFromDb = sanitizePrivateKey(participant.activeKey?.privateKey ?? participant.privateKey);
  let privateKey = privateKeyFromDb ?? (role === 'merchant' ? loadPrivateKeyFromEnv(role) : null);

  if (!walletUrl || !keyId || (role === 'customer' && !privateKey)) {
    throw buildHttpError(
      422,
      `El ${role} no tiene walletUrl, keyId o privateKey configurados en la base de datos`
    );
  }

  if (!privateKey) {
    throw buildHttpError(
      422,
      `No se pudo resolver la clave privada para el ${role}. Configura PAYMENTS_${role.toUpperCase()}_PRIVATE_KEY o *_PATH`
    );
  }
  console.log(walletUrl, keyId, privateKey);
  return { walletUrl, keyId, privateKey };
}

function sanitizePrivateKey(raw) {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;
  if (/PRIVATE_KEY_NOT_PROVIDED/i.test(value)) return null;
  return value;
}

function loadPrivateKeyFromEnv(role) {
  const envKeyNames = [
    `PAYMENTS_${role.toUpperCase()}_PRIVATE_KEY`,
    `${role.toUpperCase()}_PRIVATE_KEY`,
    role === 'merchant' ? 'RECEIVER_PRIVATE_KEY' : null,
    'PAYMENTS_PRIVATE_KEY',
    'PRIVATE_KEY_PEM'
  ].filter(Boolean);
  for (const keyName of envKeyNames) {
    if (process.env[keyName]) {
      return process.env[keyName];
    }
  }

  const envPathNames = [
    `PAYMENTS_${role.toUpperCase()}_PRIVATE_KEY_PATH`,
    `${role.toUpperCase()}_PRIVATE_KEY_PATH`,
    role === 'merchant' ? 'RECEIVER_PRIVATE_KEY_PATH' : null,
    'PAYMENTS_PRIVATE_KEY_PATH',
    'PRIVATE_KEY_PATH'
  ].filter(Boolean);
  for (const pathName of envPathNames) {
    const filePath = process.env[pathName];
    if (filePath) {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (fs.existsSync(absolutePath)) {
        return fs.readFileSync(absolutePath, 'utf8');
      }
    }
  }
  // const defaultFiles =
  //   role === 'merchant'
  //     ? ['private2.key', 'private.key']
  //     : ['private1.key', 'private.key'];
  // for (const candidate of defaultFiles) {
  //   const absolutePath = path.resolve(process.cwd(), candidate);
  //   if (fs.existsSync(absolutePath)) {
  //     return fs.readFileSync(absolutePath, 'utf8');
  //   }
  // }
  return null;
}

function buildIncomingAmount(charge, receivingWallet) {
  const assetCode = charge.assetCode ?? receivingWallet.assetCode;
  const assetScale = Number.isInteger(charge.assetScale)
    ? charge.assetScale
    : receivingWallet.assetScale;
  ensure(assetCode, 'El comercio no tiene assetCode configurado en su wallet');
  ensure(Number.isInteger(assetScale), 'El comercio no tiene assetScale configurado');
  return {
    value: normalizeMinorUnits(charge.value),
    assetCode,
    assetScale
  };
}

function normalizeMinorUnits(value) {
  if (value === undefined || value === null) {
    throw buildHttpError(400, 'Debes indicar amountMinorUnits (valor en unidades mínimas)');
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) {
      throw buildHttpError(400, 'amountMinorUnits debe ser un entero positivo');
    }
    return value.toString();
  }
  if (typeof value === 'string') {
    const sanitized = value.trim();
    if (!/^\d+$/.test(sanitized)) {
      throw buildHttpError(400, 'amountMinorUnits debe ser un string numérico positivo');
    }
    return sanitized;
  }
  throw buildHttpError(400, 'amountMinorUnits debe ser string o number');
}

function formatAmount(amount) {
  if (!amount) return 'N/D';
  const scale = Number(amount.assetScale ?? 2);
  const value = Number(amount.value ?? 0) / 10 ** scale;
  return `${value.toFixed(scale)} ${amount.assetCode}`;
}

function ensure(value, message) {
  if (value === undefined || value === null || value === '') {
    throw buildHttpError(422, message);
  }
  return value;
}

function buildHttpError(status, message) {
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function resolveKeyIdFromEnv(role) {
  const candidates = [
    `PAYMENTS_${role.toUpperCase()}_KEY_ID`,
    `${role.toUpperCase()}_KEY_ID`,
    role === 'merchant' ? 'RECEIVER_KEY_ID' : null,
    role === 'customer' ? 'SENDER_KEY_ID' : null,
    'PAYMENTS_KEY_ID',
    'KEY_ID'
  ].filter(Boolean);

  for (const keyName of candidates) {
    const value = process.env[keyName];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return null;
}
