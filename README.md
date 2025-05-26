# Bonzo Finance Script

A command-line tool for interacting with Bonzo Finance's lending protocol on Hedera. This script supports deposits, withdrawals, borrowing, and repayments for various tokens including WHBAR.

## Features

- 🔄 Support for multiple tokens (WHBAR, USDC, SAUCE, etc.)
- 💰 Native HBAR to WHBAR conversion
- 🔒 Automatic collateral management
- 📊 Detailed balance tracking
- 🌐 Support for both testnet and mainnet

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Hedera account with HBAR
- Private key with sufficient HBAR for gas fees

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Testnet
PRIVATE_KEY_TESTNET=your_private_key
ACCOUNT_ID_TESTNET=your_account_id

# Mainnet
PRIVATE_KEY_MAINNET=your_mainnet_private_key
ACCOUNT_ID_MAINNET=your_mainnet_account_id

# RPC URL
PROVIDER_URL_MAINNET=your_mainnet_provider_url

# Chain Type
CHAIN_TYPE=hedera_testnet
```

## Installation

```bash
npm install
```

## Usage

```bash
node index.js <action> <token> <amount>
```

### Parameters

- `action`: The operation to perform

  - `deposit`: Supply assets to the lending pool
  - `withdraw`: Withdraw supplied assets
  - `borrow`: Borrow assets from the lending pool
  - `repay`: Repay borrowed assets

- `token`: The token symbol to operate with

  - `WHBAR`: Wrapped HBAR
  - `USDC`: USD Coin
  - `SAUCE`: Sauce Token
  - `HBARX`: HBARX Token
  - `KARATE`: Karate Token
  - `GRELF`: Grelf Token
  - `KBL`: KBL Token
  - `BONZO`: Bonzo Token
  - `DOVU`: DOVU Token
  - `HST`: HST Token
  - `PACK`: Pack Token
  - `STEAM`: Steam Token

- `amount`: The amount to deposit/withdraw/borrow/repay (in human-readable format)

### Examples

```bash
# Deposit 1 WHBAR
node index.js deposit WHBAR 1

# Withdraw 100 USDC
node index.js withdraw USDC 100

# Borrow 50 SAUCE
node index.js borrow SAUCE 50

# Repay 25 WHBAR
node index.js repay WHBAR 25
```

## WHBAR Operations

For WHBAR operations, the script automatically:

1. Checks WHBAR balance
2. Converts native HBAR to WHBAR if needed
3. Approves WHBAR tokens to both the lending pool and WHBAR contract
4. Executes the requested operation
5. Enables the asset as collateral (for deposits)

## Balance Tracking

The script provides detailed balance information:

- Initial token and aToken balances
- Final token and aToken balances
- Amount of tokens spent/received
- Confirmation of aToken minting

## Error Handling

The script includes comprehensive error handling for:

- Insufficient balances
- Failed transactions
- Invalid parameters
- Network issues

## Network Support

- Testnet: `https://testnet.hashio.io/api`
- Mainnet: Custom provider URL (specified in .env)

## Token Decimals

The script automatically handles token decimals:

- WHBAR: 8 decimals
- USDC: 6 decimals
- SAUCE: 6 decimals
- HBARX: 8 decimals
- KARATE: 8 decimals
- GRELF: 8 decimals
- KBL: 8 decimals
- BONZO: 8 decimals
- DOVU: 8 decimals
- HST: 8 decimals
- PACK: 6 decimals
- STEAM: 2 decimals

## Security Notes

- Never commit your `.env` file
- Keep your private keys secure
- Use testnet for testing
- Verify transaction details before confirming
