export async function resolveWalletDetails(client, walletOrUrl) {
  if (!walletOrUrl) {
    throw new Error('Wallet address information is required');
  }

  if (typeof walletOrUrl === 'string') {
    const wallet = await client.walletAddress.get({ url: walletOrUrl });
    return {
      walletAddress: wallet.id ?? walletOrUrl,
      walletAddressUrl: walletOrUrl,
      resourceServer: wallet.resourceServer
    };
  }

  const walletAddress =
    walletOrUrl.id ?? walletOrUrl.walletAddress ?? walletOrUrl.walletAddressUrl ?? walletOrUrl.url;
  if (!walletAddress) {
    throw new Error('Could not determine wallet address url from the provided wallet object');
  }

  return {
    walletAddress,
    walletAddressUrl: walletOrUrl.walletAddressUrl ?? walletAddress,
    resourceServer: walletOrUrl.resourceServer
  };
}

export function assertAccessToken(accessToken, action, { optional = false } = {}) {
  if (!accessToken && !optional) {
    throw new Error(`Missing access token required to ${action}. Ensure you are passing the grant's access_token.value.`);
  }
}
