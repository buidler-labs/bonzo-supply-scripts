const { ethers } = require("ethers");

// Minimal contract ABIs
const CONTRACT_ABIS = {
  LendingPool: [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external payable",
    "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
    "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external",
    "function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external payable returns (uint256)",
    "function getReservesList() external view returns (address[] memory)",
    "function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))",
    "function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external",
    "function getDecimals(address asset) external view returns (uint256)",
  ],
  ERC20Wrapper: [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
  ],
  AToken: [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function UNDERLYING_ASSET_ADDRESS() external view returns (address)",
  ],
  VariableDebtToken: ["function balanceOf(address account) external view returns (uint256)", "function UNDERLYING_ASSET_ADDRESS() external view returns (address)"],
  StableDebtToken: ["function balanceOf(address account) external view returns (uint256)", "function UNDERLYING_ASSET_ADDRESS() external view returns (address)"],
  WHBARContract: [
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
  ],
  AaveProtocolDataProvider: [
    "function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)",
  ],
};

/**
 * Setup a contract instance with the provided ABI and address
 * @param {string} artifactName - The contract type name
 * @param {string} contractAddress - The contract address
 * @param {ethers.Wallet} signer - The wallet to use for signing transactions
 * @returns {ethers.Contract} The contract instance
 */
async function setupContract(artifactName, contractAddress, signer) {
  try {
    const abi = CONTRACT_ABIS[artifactName];
    if (!abi) {
      throw new Error(`ABI not found for contract type: ${artifactName}`);
    }
    return new ethers.Contract(contractAddress, abi, signer);
  } catch (error) {
    throw new Error(`Failed to setup contract ${artifactName}: ${error.message}`);
  }
}

/**
 * Check the balance of a token for a specific address
 */
async function checkBalance(contract, address, label) {
  const balance = await contract.balanceOf(address);
  console.log(`💰 ${label}: ${balance.toString()}`);
  return balance;
}

/**
 * Approve token for spending
 */
async function approveToken(tokenContract, ownerAddress, spenderAddress, amount, label = "") {
  console.log(`\n🔍 APPROVAL CHECK: ${label}`);
  const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
  console.log(`📊 Current allowance: ${allowance.toString()}`);

  if (allowance.lt(amount)) {
    console.log("✅ Approving...");
    const approveTx = await tokenContract.approve(spenderAddress, amount, { gasLimit: 800000 });
    await approveTx.wait();
    console.log(`✨ Approved: ${approveTx.hash} | New allowance: ${(await tokenContract.allowance(ownerAddress, spenderAddress)).toString()}`);
  }
}

/**
 * Check WHBAR balance and deposit native HBAR if needed
 */
async function ensureWHBARBalance(whbarContract, erc20Contract, owner, requiredAmount) {
  console.log("\n🔍 WHBAR BALANCE CHECK");
  const whbarBalance = await erc20Contract.balanceOf(owner.address);
  console.log(`💰 Current: ${whbarBalance.toString()} | Required: ${requiredAmount.toString()}`);

  if (whbarBalance.lt(requiredAmount)) {
    const shortfall = requiredAmount.sub(whbarBalance);
    console.log(`\n⚠️  Insufficient WHBAR balance! Converting ${shortfall.toString()} WHBAR units to native HBAR...`);

    const shortfallInWei = shortfall.mul(ethers.BigNumber.from("10000000000"));
    console.log(`📊 Shortfall in wei: ${shortfallInWei.toString()}`);

    const depositTx = await whbarContract.deposit({
      value: shortfallInWei,
      gasLimit: 300000,
    });
    await depositTx.wait();
    console.log(`✅ HBAR to WHBAR conversion completed: ${depositTx.hash} | New balance: ${(await erc20Contract.balanceOf(owner.address)).toString()}`);
  } else {
    console.log("✅ Sufficient WHBAR balance available");
  }
}

/**
 * Perform deposit operation
 */
async function performDeposit(erc20Contract, lendingPoolContract, tokenAddress, amount, onBehalfOf, isWHBAR, whbarContract = null) {
  try {
    console.log("\n🏦 DEPOSIT OPERATION");

    const userBalance = await checkBalance(erc20Contract, onBehalfOf, "Current token balance");
    if (userBalance.lt(amount)) {
      console.log(`\n❌ INSUFFICIENT BALANCE | Required: ${amount.toString()} | Available: ${userBalance.toString()} | Shortfall: ${amount.sub(userBalance).toString()}`);
      console.log("🚫 Cannot proceed with deposit - insufficient token balance");
      process.exit(1);
    }

    if (isWHBAR && whbarContract) {
      await ensureWHBARBalance(whbarContract, erc20Contract, { address: onBehalfOf }, amount);
      await approveToken(erc20Contract, onBehalfOf, lendingPoolContract.address, amount, "WHBAR to Lending Pool");
      await approveToken(erc20Contract, onBehalfOf, whbarContract.address, amount, "WHBAR to WHBAR Contract");
    } else if (!isWHBAR) {
      await approveToken(erc20Contract, onBehalfOf, lendingPoolContract.address, amount, "ERC20 for deposit");
    }

    console.log("\n💸 Depositing...");
    let depositTx;
    if (isWHBAR) {
      const hbarValue = amount.mul(ethers.BigNumber.from("10000000000"));
      console.log(`💰 HBAR value being sent: ${hbarValue.toString()}`);
      depositTx = await lendingPoolContract.deposit(tokenAddress, amount, onBehalfOf, 0, { value: hbarValue });
    } else {
      depositTx = await lendingPoolContract.deposit(tokenAddress, amount, onBehalfOf, 0);
    }

    await depositTx.wait();
    console.log(`✅ Deposited: ${depositTx.hash}`);
  } catch (error) {
    console.error(`\n❌ DEPOSIT FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Perform withdraw operation
 */
async function performWithdraw(aTokenContract, lendingPoolContract, tokenAddress, amount, to, isWHBAR, whbarContractAddress, owner) {
  try {
    console.log("\n💵 WITHDRAW OPERATION");

    const aTokenBalance = await checkBalance(aTokenContract, to, "aToken before withdrawal");
    if (aTokenBalance.lt(amount)) {
      throw new Error(`❌ Insufficient aToken balance. Have: ${aTokenBalance.toString()}, need: ${amount.toString()}`);
    }

    if (isWHBAR && whbarContractAddress) {
      const whbarContract = await setupContract("WHBARContract", whbarContractAddress, owner);
      const whbarTokenContract = await setupContract("ERC20Wrapper", tokenAddress, owner);
      await approveToken(whbarTokenContract, to, lendingPoolContract.address, amount, "WHBAR to Lending Pool");
      await approveToken(whbarTokenContract, to, whbarContract.address, amount, "WHBAR to WHBAR Contract");
    }

    console.log("\n🔄 Withdrawing...");
    const withdrawTx = await lendingPoolContract.withdraw(tokenAddress, amount, isWHBAR ? whbarContractAddress : to);
    await withdrawTx.wait();
    console.log(`✅ Withdrawn: ${withdrawTx.hash}`);
  } catch (error) {
    console.error(`\n❌ WITHDRAW FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Perform borrow operation
 */
async function performBorrow(lendingPoolContract, tokenAddress, amount, onBehalfOf, isWHBAR, whbarContractAddress, owner) {
  try {
    console.log("\n💳 BORROW OPERATION");

    if (isWHBAR && whbarContractAddress) {
      const whbarContract = await setupContract("WHBARContract", whbarContractAddress, owner);
      const whbarTokenContract = await setupContract("ERC20Wrapper", tokenAddress, owner);
      await approveToken(whbarTokenContract, onBehalfOf, lendingPoolContract.address, amount, "WHBAR to Lending Pool");
      await approveToken(whbarTokenContract, onBehalfOf, whbarContract.address, amount, "WHBAR to WHBAR Contract");
    }

    console.log("\n🔄 Borrowing...");
    const borrowTx = await lendingPoolContract.borrow(tokenAddress, amount, 2, 0, onBehalfOf);
    await borrowTx.wait();
    console.log(`✅ Borrowed: ${borrowTx.hash}`);
  } catch (error) {
    console.error(`\n❌ BORROW FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Perform repay operation
 */
async function performRepay(erc20Contract, lendingPoolContract, tokenAddress, amount, onBehalfOf, isWHBAR, whbarContract = null) {
  try {
    console.log("\n💸 REPAY OPERATION");

    const userBalance = await checkBalance(erc20Contract, onBehalfOf, "Current token balance");
    if (userBalance.lt(amount)) {
      console.log(`\n❌ INSUFFICIENT BALANCE | Required: ${amount.toString()} | Available: ${userBalance.toString()} | Shortfall: ${amount.sub(userBalance).toString()}`);
      console.log("🚫 Cannot proceed with repay - insufficient token balance");
      process.exit(1);
    }

    if (isWHBAR && whbarContract) {
      await ensureWHBARBalance(whbarContract, erc20Contract, { address: onBehalfOf }, amount);
      await approveToken(erc20Contract, onBehalfOf, lendingPoolContract.address, amount, "WHBAR to Lending Pool");
      await approveToken(erc20Contract, onBehalfOf, whbarContract.address, amount, "WHBAR to WHBAR Contract");
    } else if (!isWHBAR) {
      await approveToken(erc20Contract, onBehalfOf, lendingPoolContract.address, amount, "ERC20 for repay");
    }

    console.log("\n🔄 Repaying...");
    let repayTx;
    if (isWHBAR) {
      const hbarValue = amount.mul(ethers.BigNumber.from("10000000000"));
      console.log(`💰 HBAR value being sent: ${hbarValue.toString()}`);
      repayTx = await lendingPoolContract.repay(tokenAddress, amount, 2, onBehalfOf, { value: hbarValue });
    } else {
      repayTx = await lendingPoolContract.repay(tokenAddress, amount, 2, onBehalfOf);
    }

    await repayTx.wait();
    console.log(`✅ Repaid: ${repayTx.hash}`);
  } catch (error) {
    console.error(`\n❌ REPAY FAILED: ${error.message}`);
    throw error;
  }
}

module.exports = {
  CONTRACT_ABIS,
  setupContract,
  checkBalance,
  approveToken,
  ensureWHBARBalance,
  performDeposit,
  performWithdraw,
  performBorrow,
  performRepay,
};
