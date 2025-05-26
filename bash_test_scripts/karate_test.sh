#!/bin/bash

# Test complete lending cycle: deposit 6 USDC, borrow 2 USDC, repay 2 USDC, withdraw 5.9 USDC

set -e  # Exit on error

echo "Starting deposit..."
node index.js deposit KARATE 1
echo "Deposit completed, starting borrow..."

node index.js borrow KARATE 0.1
echo "Borrow completed, starting repay..."

node index.js repay KARATE 0.1
echo "Repay completed, starting withdraw..."

node index.js withdraw KARATE 1
echo "All operations completed!"
