#!/bin/bash

# Bonzo Finance Lending Pool Operations Examples
# Make sure to set your environment variables in .env file

echo "🔧 Bonzo Finance Lending Pool Operations Examples"
echo "================================================="
echo ""

# Set environment for testnet (change to hedera_mainnet for mainnet)
export CHAIN_TYPE=hedera_testnet

echo "📋 Available operations:"
echo "1. Deposit tokens to earn interest"
echo "2. Withdraw your deposited tokens"  
echo "3. Borrow tokens using collateral"
echo "4. Repay borrowed tokens"
echo ""

echo "🏦 Testnet Examples:"
echo "==================="

echo ""
echo "💰 Deposit 100 SAUCE tokens:"
echo "CHAIN_TYPE=hedera_testnet node index.js deposit SAUCE 100"
echo ""

echo "📤 Withdraw 50 SAUCE tokens:"
echo "CHAIN_TYPE=hedera_testnet node index.js withdraw SAUCE 50"
echo ""

echo "💳 Borrow 25 USDC tokens:"
echo "CHAIN_TYPE=hedera_testnet node index.js borrow USDC 25"
echo ""

echo "💸 Repay 25 USDC tokens:"
echo "CHAIN_TYPE=hedera_testnet node index.js repay USDC 25"
echo ""

echo "🌐 Mainnet Examples:"
echo "==================="

echo ""
echo "💰 Deposit 1000 HBARX tokens:"
echo "CHAIN_TYPE=hedera_mainnet node index.js deposit HBARX 1000"
echo ""

echo "📤 Withdraw 500 HBARX tokens:"
echo "CHAIN_TYPE=hedera_mainnet node index.js withdraw HBARX 500"
echo ""

echo "💳 Borrow 100 BONZO tokens:"
echo "CHAIN_TYPE=hedera_mainnet node index.js borrow BONZO 100"
echo ""

echo "💸 Repay 100 BONZO tokens:"
echo "CHAIN_TYPE=hedera_mainnet node index.js repay BONZO 100"
echo ""

echo "🔥 Special WHBAR Examples (native HBAR support):"
echo "================================================"

echo ""
echo "💰 Deposit 1000 WHBAR (includes native HBAR):"
echo "CHAIN_TYPE=hedera_mainnet node index.js deposit WHBAR 1000"
echo ""

echo "📤 Withdraw 500 WHBAR (converts to native HBAR):"
echo "CHAIN_TYPE=hedera_mainnet node index.js withdraw WHBAR 500"
echo ""

echo "💳 Borrow 100 WHBAR:"
echo "CHAIN_TYPE=hedera_mainnet node index.js borrow WHBAR 100"
echo ""

echo "💸 Repay 100 WHBAR (includes native HBAR):"
echo "CHAIN_TYPE=hedera_mainnet node index.js repay WHBAR 100"
echo ""

echo "📚 More Examples:"
echo "================"

echo ""
echo "🔄 Multiple operations example:"
echo "# First deposit collateral"
echo "CHAIN_TYPE=hedera_mainnet node index.js deposit SAUCE 1000"
echo ""
echo "# Then borrow against it"
echo "CHAIN_TYPE=hedera_mainnet node index.js borrow USDC 100"
echo ""
echo "# Later repay the loan"
echo "CHAIN_TYPE=hedera_mainnet node index.js repay USDC 100"
echo ""
echo "# Finally withdraw your collateral"
echo "CHAIN_TYPE=hedera_mainnet node index.js withdraw SAUCE 1000"
echo ""

echo "⚙️  Environment Setup:"
echo "====================="
echo "Make sure your .env file contains:"
echo ""
echo "# For Testnet:"
echo "CHAIN_TYPE=hedera_testnet"
echo "PRIVATE_KEY2=your_testnet_private_key"
echo "ACCOUNT_ID=your_testnet_account_id"
echo ""
echo "# For Mainnet:"
echo "CHAIN_TYPE=hedera_mainnet"
echo "PRIVATE_KEY_LIQUIDATIONS=your_mainnet_private_key"
echo "PRIVATE_KEY_MAINNET=your_mainnet_private_key"
echo "MAINNET_ACCOUNT_ID=your_mainnet_account_id"
echo "PROVIDER_URL_MAINNET=your_mainnet_rpc_url"
echo ""

echo "⚠️  Important Notes:"
echo "==================="
echo "1. Make sure you have sufficient token balances before operations"
echo "2. Keep some HBAR for transaction fees"
echo "3. Borrowing requires sufficient collateral deposited first"
echo "4. Interest accrues on borrowed amounts over time"
echo "5. WHBAR operations include special native HBAR handling"
echo ""

echo "🎯 Quick Test (uncomment to run):"
echo "================================="
echo "# Uncomment the lines below to run a quick test"
echo ""
echo "# echo 'Testing deposit operation...'"
echo "# CHAIN_TYPE=hedera_testnet node index.js deposit SAUCE 1"
echo ""
echo "# echo 'Testing withdraw operation...'"
echo "# CHAIN_TYPE=hedera_testnet node index.js withdraw SAUCE 0.5" 