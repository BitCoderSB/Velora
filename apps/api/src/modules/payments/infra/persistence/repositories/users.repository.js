import { pool } from '../db.js';

const DEFAULT_TABLE = process.env.PaymentsUsersTable ?? process.env.PAYMENTS_USERS_TABLE ?? 'users';
const DEFAULT_CUSTOMER_FIELD =
  process.env.PAYMENTS_CUSTOMER_IDENTIFIER_FIELD ?? process.env.PAYMENTS_IDENTIFIER_FIELD ?? 'id';
const DEFAULT_MERCHANT_FIELD =
  process.env.PAYMENTS_MERCHANT_IDENTIFIER_FIELD ?? process.env.PAYMENTS_IDENTIFIER_FIELD ?? 'id';

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export class PaymentsUsersRepository {
  constructor({
    db = pool,
    tableName = sanitizeIdentifier(DEFAULT_TABLE, 'users'),
    customerField = sanitizeIdentifier(DEFAULT_CUSTOMER_FIELD, 'id'),
    merchantField = sanitizeIdentifier(DEFAULT_MERCHANT_FIELD, 'id')
  } = {}) {
    this.db = db;
    this.tableName = tableName;
    this.customerField = customerField;
    this.merchantField = merchantField;
  }

  async findCustomer(identifier) {
    return this.findByField(this.customerField, identifier);
  }

  async findMerchant(identifier) {
    return this.findByField(this.merchantField, identifier);
  }

  async findByField(field, value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const query = `SELECT * FROM ${this.tableName} WHERE ${field} = $1 LIMIT 1`;
    const { rows } = await this.db.query(query, [value]);
    return rows[0] ?? null;
  }
}

function sanitizeIdentifier(identifier, fallback = 'id') {
  if (identifier && IDENTIFIER_REGEX.test(identifier)) {
    return identifier;
  }
  return fallback;
}
