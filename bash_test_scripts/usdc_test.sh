#!/bin/bash

# Test complete lending cycle: deposit 6 USDC, borrow 2 USDC, repay 2 USDC, withdraw 5.9 USDC

set -e  # Exit on error

export CHAIN_TYPE=hedera_testnet

echo "Starting deposit..."
node index.js deposit USDC 6
echo "Deposit completed, starting borrow..."

node index.js borrow USDC 2
echo "Borrow completed, starting repay..."

node index.js repay USDC 2
echo "Repay completed, starting withdraw..."

node index.js withdraw USDC 5.9
echo "All operations completed!"
