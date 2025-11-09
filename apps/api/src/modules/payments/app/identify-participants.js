import { pool } from '../infra/persistence/db.js';

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const CLIENT_KEYS_TABLE = sanitizeIdentifier(process.env.CLIENT_KEYS_TABLE ?? 'client_keys');
const MERCHANT_KEYS_TABLE = sanitizeIdentifier(
  process.env.MERCHANT_KEYS_TABLE ?? process.env.CLIENT_KEYS_TABLE ?? 'client_keys'
);

const CUSTOMER_LOOKUP_SQL = `
  SELECT
    u.id,
    u.email,
    u.nip,
    cp.nombre,
    cp.apellido,
    cp.ciudad,
    cp.pais,
    ck.key_id        AS customer_key_id,
    ck.url           AS customer_wallet_url,
    ck.private_key   AS customer_private_key
  FROM users u
  LEFT JOIN client_profile cp ON cp.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT key_id, url, private_key
    FROM ${CLIENT_KEYS_TABLE}
    WHERE client_user_id = u.id
    ORDER BY id DESC
    LIMIT 1
  ) ck ON true
  WHERE u.email = $1
    AND u.is_client = true
  LIMIT 1;
`;

const MERCHANT_LOOKUP_SQL = `
  SELECT
    u.id,
    u.email,
    u.nip,
    vp.marca,
    vp.direccion,
    vp.descripcion,
    vk.key_id        AS merchant_key_id,
    vk.url           AS merchant_wallet_url,
    vk.private_key   AS merchant_private_key
  FROM users u
  LEFT JOIN vendor_profile vp ON vp.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT key_id, url, private_key
    FROM ${MERCHANT_KEYS_TABLE}
    WHERE client_user_id = u.id
    ORDER BY id DESC
    LIMIT 1
  ) vk ON true
  WHERE u.email = $1
    AND u.is_vendor = true
  LIMIT 1;
`;

export async function identifyParticipants(payload = {}) {
  const customerEmail = payload.customerEmail ?? payload.customerIdentifier;
  const merchantEmail = payload.merchantEmail ?? payload.merchantIdentifier;
  console.log('identifyParticipants payload:', payload);
  ensureValue(customerEmail, 'customerIdentifier (email) es requerido');
  ensureValue(merchantEmail, 'merchantIdentifier (email) es requerido');

  const [customerRecord, merchantRecord] = await Promise.all([
    findCustomerByEmail(customerEmail),
    findCustomerByEmail(merchantEmail)
  ]);
  console.log('Customer Record:', customerRecord);
  console.log('Merchant Record:', merchantRecord);
  if (!customerRecord) {
    throw buildNotFoundError('cliente', customerEmail);
  }
  if (!merchantRecord) {
    throw buildNotFoundError('comercio', merchantEmail);
  }

  return {
    authorization: {
      status: 'authorized',
      code: 'CAN_SEND_AMOUNT',
      issuedAt: new Date().toISOString(),
      expiresAt: buildExpiration()
    },
    customer: mapCustomerRecord(customerRecord),
    merchant: mapCustomerRecord(merchantRecord)
  };
}

async function findCustomerByEmail(email) {
  const { rows } = await pool.query(CUSTOMER_LOOKUP_SQL, [email]);
  return rows[0] ?? null;
}

async function findMerchantByEmail(email) {
  const { rows } = await pool.query(MERCHANT_LOOKUP_SQL, [email]);
  return rows[0] ?? null;
}

function mapCustomerRecord(record) {
  const fullName = [record.nombre, record.apellido].filter(Boolean).join(' ').trim();
  return {
    id: record.id,
    role: 'customer',
    email: record.email,
    walletUrl: record.customer_wallet_url ?? null,
    nip: record.nip,
    profile: {
      firstName: record.nombre,
      lastName: record.apellido,
      fullName: fullName || null,
      city: record.ciudad,
      country: record.pais
    },
    activeKey: record.customer_key_id
      ? {
          keyId: record.customer_key_id,
          url: record.customer_wallet_url,
          privateKey: record.customer_private_key
        }
      : null
  };
}

function mapMerchantRecord(record) {
  return {
    id: record.id,
    role: 'merchant',
    email: record.email,
    walletUrl: record.merchant_wallet_url ?? null,
    nip: record.nip,
    profile: {
      brand: record.marca,
      address: record.direccion,
      description: record.descripcion
    },
    activeKey: record.merchant_key_id
      ? {
          keyId: record.merchant_key_id,
          url: record.merchant_wallet_url,
          privateKey: record.merchant_private_key
        }
      : null
  };
}

function ensureValue(value, message) {
  if (value === undefined || value === null || value === '') {
    throw new Error(message);
  }
}

function buildNotFoundError(entity, identifier) {
  const error = new Error(`No se encontró ${entity} con identificador ${identifier}`);
  error.statusCode = 404;
  return error;
}

function buildExpiration(ttlMinutes = Number(process.env.PAYMENTS_AUTH_TTL_MIN ?? 5)) {
  const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return expires.toISOString();
}

function sanitizeIdentifier(identifier) {
  if (IDENTIFIER_REGEX.test(identifier)) {
    return identifier;
  }
  throw new Error(`Identificador SQL inválido: ${identifier}`);
}
