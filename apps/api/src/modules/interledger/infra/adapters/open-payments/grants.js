export async function getWallet(client, walletAddressUrl) {
  return client.walletAddress.get({ url: walletAddressUrl });
}

// Helper genérico para pedir grants (GNAP)
export async function requestGrant({ client, walletAddressUrl, access, interact }) {
  const wallet = await getWallet(client, walletAddressUrl);

  const grant = await client.grant.request(
    { url: wallet.authServer },
    {
      ...(interact ? { interact } : {}),
      access_token: {
        access: access.map(a => ({
          identifier: a.identifier ?? wallet.id,
          type: a.type,
          actions: a.actions,
          ...(a.limits ? { limits: a.limits } : {})
        }))
      }
    }
  );
  return { grant, wallet };
}

// Atajo: grant para INCOMING (normalmente no interactivo)
export async function requestIncomingGrant(client, walletAddressUrl) {
  const { grant } = await requestGrant({
    client,
    walletAddressUrl,
    access: [{ type: 'incoming-payment', actions: ['create', 'read', 'list'] }]
  });
  return grant;
}

// Atajo: grant para QUOTE (normalmente no interactivo)
export async function requestQuoteGrant(client, walletAddressUrl) {
  const { grant } = await requestGrant({
    client,
    walletAddressUrl,
    access: [{ type: 'quote', actions: ['create', 'read'] }]
  });
  return grant;
}

// Atajo: grant para OUTGOING (suele ser interactivo con redirect)
export async function requestOutgoingGrantInteractive(client, walletAddressUrl, debitLimit) {
  const { grant } = await requestGrant({
    client,
    walletAddressUrl,
    interact: { start: ['redirect'] },
    access: [
      {
        type: 'outgoing-payment',
        actions: ['create', 'read', 'list'],
        ...(debitLimit ? { limits: { debitAmount: debitLimit } } : {})
      }
    ]
  });
  return grant;
}
