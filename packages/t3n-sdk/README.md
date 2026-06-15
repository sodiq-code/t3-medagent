# T3n TypeScript SDK

A minimal TypeScript SDK that mirrors the server's RPC handler approach, keeping all state machine logic hidden in WASM and providing a clean, agnostic wrapper that doesn't expose authentication methods or internal states.

## Features

- **Simple API**: Clean, minimal interface that's easy to use
- **Method Agnostic**: Supports multiple authentication methods (Ethereum, OIDC) without exposing implementation details
- **WASM-Powered**: All cryptographic complexity and state machine logic isolated in WASM components
- **Type Safe**: Full TypeScript support with comprehensive type definitions
- **Secure**: Encrypted communication with T3n nodes

## Installation

```bash
pnpm add @terminal3/t3n-sdk
```

## Quick Start

### Basic Usage

```typescript
import {
  T3nClient,
  loadWasmComponent,
  createEthAuthInput,
  eth_get_address,
  metamask_sign,
} from "@terminal3/t3n-sdk";

const wasmComponent = await loadWasmComponent();
const privateKey = process.env.T3N_DEMO_KEY!;
const address = eth_get_address(privateKey);

const client = new T3nClient({
  baseUrl: "https://t3n-node.example.com",
  wasmComponent,
  handlers: {
    EthSign: metamask_sign(address, undefined, privateKey),
  },
});

await client.handshake();

const did = await client.authenticate(
  createEthAuthInput(eth_get_address(privateKey))
);
```

### Ethereum Authentication

```typescript
import {
  T3nClient,
  loadWasmComponent,
  createEthAuthInput,
  eth_get_address,
  metamask_sign,
} from "@terminal3/t3n-sdk";

const privateKey = "0x...";
const address = eth_get_address(privateKey);

const client = new T3nClient({
  wasmComponent: await loadWasmComponent(),
  handlers: {
    EthSign: metamask_sign(address, undefined, privateKey),
  },
});

await client.handshake();
const did = await client.authenticate(
  createEthAuthInput(eth_get_address(privateKey))
);
```

### OIDC Authentication

```typescript
import { createOidcAuthInput } from "@terminal3/t3n-sdk";

// `client` is an already-handshaked T3nClient (see Quick Start above).
const did = await client.authenticate(
  createOidcAuthInput({
    provider: "google",
    // The T3n node mints a session-binding nonce. Pass it to your provider's
    // authorization request and return the resulting id_token JWT.
    getIdToken: async (nonce) => getGoogleIdToken({ nonce }),
  })
);
```

## Environments

The SDK targets the public T3n networks.

- `testnet` — the public test network, for integration and pre-production use.
- `production` — the public mainnet network.

Select the network with `setEnvironment("testnet" | "production")` — this sets the
default node used by clients created afterwards. To target a specific node, pass an
explicit `baseUrl` to `new T3nClient({ baseUrl, … })`; `baseUrl` takes precedence over
the environment default.

## OTP-backed user flows

`@terminal3/t3n-sdk` ships typed helpers for the explicit OTP roundtrip and the
slim Level-1 user-input ingest:

- `client.otpRequest` — request and dispatch an OTP code to an email or SMS
  channel.
- `client.otpVerify` — redeem an OTP and bind the verified contact.
- `client.submitUserInput` — Level-1 user-input ingest. Rejects callers without
  a verified email with the typed `UserUpsertError({ kind: "EmailNotVerified" })`.

```typescript
import { T3nClient, UserUpsertError } from "@terminal3/t3n-sdk";

// 1) Bind the user's email via OTP.
const requested = await client.otpRequest({
  emailChannel: { emailAddress: "alice@example.com" },
});
const code = await prompt(`Code sent to ${requested.contact}: `);
await client.otpVerify({
  otpCode: code,
  request: { emailChannel: { emailAddress: "alice@example.com" } },
});

// 2) Slim user-upsert: Level-1 user-input ingest.
try {
  const result = await client.submitUserInput({
    profile: {
      first_name: "Alice",
      last_name: "Smith",
      country_of_residence: "US",
    },
  });
  console.log("tx:", result.txHash);
} catch (err) {
  if (err instanceof UserUpsertError && err.kind === "EmailNotVerified") {
    // run otpRequest + otpVerify, then retry.
  }
  throw err;
}
```

For tests that "just want it to work", `runOtpThenUserInput` chains the three
calls behind a single `getOtpCode` callback.

## License

MIT
