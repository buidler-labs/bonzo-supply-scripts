const { ethers } = require("ethers");
const outputReserveData = require("./bonzo_contracts.json");
const { AccountId, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters, Client, Hbar, HbarUnit, AccountAllowanceApproveTransaction } = require("@hashgraph/sdk");

const { setupContract, checkBalance, performDeposit, performWithdraw, performBorrow, performRepay } = require("./contracts");

require("dotenv").config();

// Token decimals mapping based on the test files
const TOKEN_DECIMALS = {
  USDC: 6,
  HBARX: 8,
  SAUCE: 6,
  XSAUCE: 6,
  KARATE: 8,
  WHBAR: 8,
  GRELF: 8,
  KBL: 8,
  BONZO: 8,
  DOVU: 8,
  HST: 8,
  PACK: 6,
  STEAM: 2,
};

// Command line arguments
const action = process.argv[2]; // deposit, withdraw, borrow, repay
const tokenSymbol = process.argv[3]; // SAUCE, USDC, etc.
const amount = process.argv[4]; // amount in human readable format

const chainType = process.env.CHAIN_TYPE;

// Validate arguments
if (!action || !tokenSymbol || !amount) {
  console.log("❌ Usage: node index.js <action> <token> <amount>");
  console.log("📋 Actions: deposit, withdraw, borrow, repay");
  console.log("💰 Tokens: SAUCE, USDC, HBARX, KARATE, WHBAR, GRELF, KBL, BONZO, DOVU, HST, PACK, STEAM");
  console.log("🔢 Amount: human readable amount (e.g., 100)");
  console.log('🌐 Set CHAIN_TYPE environment variable to "hedera_testnet" or "hedera_mainnet"');
  process.exit(1);
}

// Validate chainType after attempting to read from .env
if (chainType !== "hedera_testnet" && chainType !== "hedera_mainnet") {
  console.error(`\n❌ Invalid CHAIN_TYPE: "${chainType}"`);
  console.error('💡 CHAIN_TYPE must be either "hedera_testnet" or "hedera_mainnet".');
  console.error("👉 Please check your .env file or environment variables.");
  process.exit(1);
}

// Setup provider and wallet based on chain
let provider, owner, whbarContractAddress, whbarContractId, tokenId;
if (chainType === "hedera_testnet") {
  provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
  owner = new ethers.Wallet(process.env.PRIVATE_KEY_TESTNET || "", provider);
  whbarContractAddress = "0x0000000000000000000000000000000000003ad1";
} else if (chainType === "hedera_mainnet") {
  const url = process.env.PROVIDER_URL_MAINNET || "";
  provider = new ethers.providers.JsonRpcProvider(url);
  owner = new ethers.Wallet(process.env.PRIVATE_KEY_MAINNET || "", provider);
  whbarContractAddress = "0x0000000000000000000000000000000000163b59";
  whbarContractId = "0.0.1456985";
  tokenId = "0.0.1456986";
}

// Hedera client setup
const client = chainType === "hedera_testnet" ? Client.forTestnet() : Client.forMainnet();
const operatorPrivateKey = chainType === "hedera_testnet" ? process.env.PRIVATE_KEY_TESTNET : process.env.PRIVATE_KEY_MAINNET;
const operatorAccountIdStr = chainType === "hedera_testnet" ? process.env.ACCOUNT_ID_TESTNET : process.env.ACCOUNT_ID_MAINNET;

if (operatorPrivateKey && operatorAccountIdStr) {
  const operatorPrKey = PrivateKey.fromStringECDSA(operatorPrivateKey);
  const operatorAccountId = AccountId.fromString(operatorAccountIdStr);
  client.setOperator(operatorAccountId, operatorPrKey);
}

async function main() {
  try {
    console.log("\n=== 🔄 OPERATION DETAILS ===");
    console.log(`👤 Owner: ${owner.address} | 🌐 Chain: ${chainType} | 🔄 Action: ${action} | 💰 Token: ${tokenSymbol} | 🔢 Amount: ${amount}`);

    // Get token data
    const tokenData = outputReserveData[tokenSymbol];
    if (!tokenData) {
      throw new Error(`❌ Token ${tokenSymbol} not found in reserve data`);
    }

    const chainData = tokenData[chainType];
    if (!chainData) {
      const otherChain = chainType === "hedera_testnet" ? "hedera_mainnet" : "hedera_testnet";
      if (tokenData[otherChain]) {
        console.log(`❌ ${tokenSymbol} not available on ${chainType}, try CHAIN_TYPE=${otherChain}`);
      } else {
        console.log(`❌ ${tokenSymbol} not found on any chain`);
      }
      process.exit(1);
    }

    // Check if addresses are available
    if (!chainData.token.address) {
      console.log(`❌ ${tokenSymbol} address not available on ${chainType}`);
      process.exit(1);
    }

    // Get decimals and normalize amount
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 8;
    const normalizedAmount = ethers.utils.parseUnits(amount, decimals);
    const isWHBAR = tokenSymbol === "WHBAR";

    console.log(`📊 Normalized amount: ${normalizedAmount.toString()} | 🔑 Token address: ${chainData.token.address}`);

    // Setup contracts
    const lendingPoolContract = await setupContract("LendingPool", outputReserveData.LendingPool[chainType].address, owner);
    const erc20Contract = await setupContract("ERC20Wrapper", chainData.token.address, owner);
    const aTokenContract = await setupContract("AToken", chainData.aToken.address, owner);
    const debtTokenContract = await setupContract("VariableDebtToken", chainData.variableDebt.address, owner);

    // Setup WHBAR contract if needed
    let whbarContract = null;
    if (isWHBAR) {
      whbarContract = await setupContract("WHBARContract", whbarContractAddress, owner);
      console.log(`🌊 WHBAR Contract: ${whbarContract.address}`);
    }

    console.log(`🏦 Lending Pool: ${lendingPoolContract.address} | 💎 aToken: ${aTokenContract.address}`);

    // Perform action
    switch (action.toLowerCase()) {
      case "deposit":
        // Check initial balances
        console.log("\n=== 📊 INITIAL BALANCES ===");
        const initialTokenBalance = await checkBalance(erc20Contract, owner.address, "Token before deposit");
        const initialATokenBalance = await checkBalance(aTokenContract, owner.address, "aToken before deposit");

        await performDeposit(erc20Contract, lendingPoolContract, chainData.token.address, normalizedAmount, owner.address, isWHBAR, whbarContract);

        // Show balances after deposit
        console.log("\n=== 📊 FINAL BALANCES ===");
        const finalTokenBalance = await checkBalance(erc20Contract, owner.address, "Token after deposit");
        const finalATokenBalance = await checkBalance(aTokenContract, owner.address, "aToken after deposit");

        // Calculate the difference
        const tokenDiff = initialTokenBalance.sub(finalTokenBalance);
        const aTokenDiff = finalATokenBalance.sub(initialATokenBalance);
        console.log(`💸 Token spent: ${tokenDiff.toString()} | 💰 aToken received: ${aTokenDiff.toString()}`);

        if (aTokenDiff.gt(0)) {
          console.log("✅ aTokens successfully minted - collateral should be available!");
        } else {
          console.log("⚠️  No aTokens minted - there might be an issue with the deposit!");
        }
        break;

      case "withdraw":
        // Check if user has sufficient aToken balance for withdrawal
        const aTokenBalance = await checkBalance(aTokenContract, owner.address, "Current aToken balance");
        if (aTokenBalance.lt(normalizedAmount)) {
          console.log(
            `\n❌ INSUFFICIENT ATOKEN BALANCE | Required: ${normalizedAmount.toString()} | Available: ${aTokenBalance.toString()} | Shortfall: ${normalizedAmount.sub(aTokenBalance).toString()}`
          );
          console.log("🚫 Cannot proceed with withdrawal - insufficient aToken balance");
          process.exit(1);
        }

        await performWithdraw(aTokenContract, lendingPoolContract, chainData.token.address, normalizedAmount, owner.address, isWHBAR, whbarContractAddress, owner);

        // Show balances after withdrawal
        console.log("\n=== 📊 FINAL BALANCES ===");
        const aTokenBalanceAfter = await checkBalance(aTokenContract, owner.address, "aToken after withdrawal");
        const tokenBalanceAfter = await checkBalance(erc20Contract, owner.address, "Token after withdrawal");
        break;

      case "borrow":
        // Check if user has any aToken balance (collateral) before borrowing
        const collateralBalance = await checkBalance(aTokenContract, owner.address, "Current aToken balance (collateral)");
        if (collateralBalance.eq(0)) {
          console.log("\n❌ NO COLLATERAL AVAILABLE | aToken balance: 0");
          console.log("🚫 Cannot proceed with borrow - no collateral deposited");
          console.log("💡 Please deposit some assets first to use as collateral");
          process.exit(1);
        }

        await performBorrow(lendingPoolContract, chainData.token.address, normalizedAmount, owner.address, isWHBAR, whbarContractAddress, owner);

        // Show debt token balance after borrow
        console.log("\n=== 📊 FINAL BALANCES ===");
        const debtBalance = await checkBalance(debtTokenContract, owner.address, "Debt token after borrow");
        const tokenBalanceAfterBorrow = await checkBalance(erc20Contract, owner.address, "Token after borrow");
        break;

      case "repay":
        await performRepay(erc20Contract, lendingPoolContract, chainData.token.address, normalizedAmount, owner.address, isWHBAR, whbarContract);

        // Show debt token balance after repay
        console.log("\n=== 📊 FINAL BALANCES ===");
        const debtBalanceAfter = await checkBalance(debtTokenContract, owner.address, "Debt token after repay");
        break;

      default:
        throw new Error(`❌ Unknown action: ${action}. Supported actions: deposit, withdraw, borrow, repay`);
    }

    console.log(`\n✨ ${action} operation completed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("\n=== ❌ ERROR ===");
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  main,
  performDeposit,
  performWithdraw,
  performBorrow,
  performRepay,
};
