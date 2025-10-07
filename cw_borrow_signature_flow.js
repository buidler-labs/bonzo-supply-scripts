const { ethers } = require("ethers");
const { PrivateKey, ContractExecuteTransaction, ContractFunctionParameters, Client, AccountAllowanceApproveTransaction,
    TokenId,
    ContractId,
    AccountId
} = require("@hashgraph/sdk");
const {CitadelLink, TransportType} = require("@buidlerlabs/citadel-sdk-js");

require("dotenv").config();

const SAUCE_Amount = '10';
const SAUCE_lendingAmount = ethers.utils.parseUnits(SAUCE_Amount, 6);
const SAUCE_borrowAmount = SAUCE_lendingAmount.div(10);

// Hedera client setup
const cwLink = new CitadelLink(TransportType.WebUsb);
const operatorPrivateKey = process.env.PRIVATE_KEY_TESTNET;
const operatorAccountIdStr = process.env.ACCOUNT_ID_TESTNET;
const operatorPrKey = PrivateKey.fromStringECDSA(operatorPrivateKey);
const operatorPuKey = operatorPrKey.publicKey.toEvmAddress();
const operatorAccountId = AccountId.fromString(operatorAccountIdStr);

const hClient = Client.forTestnet();
const cClient = Client.forTestnet();
const SAUCE_TokenId = TokenId.fromString("0.0.1183558");
const SAUCE_LendingPool_ContractId = ContractId.fromString("0.0.5991622");

hClient.setMaxNodesPerTransaction(1);
hClient.setOperator(operatorAccountId, operatorPrKey);
cClient.setMaxNodesPerTransaction(1);
cClient.setOperatorWith(operatorAccountId, operatorPuKey, cwLink.signWithWalletKey);

async function main() {
    console.log("Depositing SAUCE to lending pool")

    // First deposit to lender
    await new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(SAUCE_TokenId, operatorAccountId, SAUCE_LendingPool_ContractId, SAUCE_lendingAmount.toNumber())
        .execute(hClient);

    await new ContractExecuteTransaction()
        .setContractId(SAUCE_LendingPool_ContractId)
        .setGas(1000000)
        .setFunction("deposit",
            new ContractFunctionParameters()
                .addAddress(SAUCE_TokenId.toSolidityAddress())
                .addUint256(SAUCE_lendingAmount.toNumber())
                .addAddress(operatorPuKey)
                .addUint16(0)
        ).execute(hClient);

    // Then borrow
    console.log("Borrowing SAUCE from lending pool")
    const frozenBorrowTx = new ContractExecuteTransaction()
        .setContractId(SAUCE_LendingPool_ContractId)
        .setGas(1000000)
        .setFunction("borrow",
            new ContractFunctionParameters()
                .addAddress(SAUCE_TokenId.toSolidityAddress())
                .addUint256(SAUCE_borrowAmount.toNumber())
                .addUint256(2)
                .addUint16(0)
                .addAddress(operatorPuKey)
        ).freezeWith(hClient);

    const hederaFrozenBorrowTx = await frozenBorrowTx.signWithOperator(hClient);
    const hederaBorrowSignatures = await hederaFrozenBorrowTx.getSignaturesAsync();
    const hederaSignature = Buffer.from(hederaBorrowSignatures.getFlatSignatureList()[0].values().next().value).toString('hex');

    console.log("Hedera native client signature:", hederaSignature);

    const citadelFrozenBorrowTx = await frozenBorrowTx.signWithOperator(hClient);
    const citadelBorrowSignatures = await citadelFrozenBorrowTx.getSignaturesAsync();
    const citadelSignature = Buffer.from(citadelBorrowSignatures.getFlatSignatureList()[0].values().next().value).toString('hex');

    console.log("Citadel client signature:", citadelSignature);

    if (hederaSignature !== citadelSignature) {
        console.log("Signatures do not match! Aborting ...");
        process.exit(1);
    }

    console.log("Executing via the hedera native client just to see what happens. If it doesn't error, signature is accepted");
    await hederaFrozenBorrowTx.execute(hClient);

    console.log("All good, unrolling assets");

    // Then repay
    // ... first approve allowance
    await new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(SAUCE_TokenId, operatorAccountId, SAUCE_LendingPool_ContractId, SAUCE_lendingAmount.toNumber())
        .execute(hClient);

    // ... then do the actual repaying
    await new ContractExecuteTransaction()
        .setContractId(SAUCE_LendingPool_ContractId)
        .setGas(1000000)
        .setFunction("repay",
            new ContractFunctionParameters()
                .addAddress(SAUCE_TokenId.toSolidityAddress())
                .addUint256(SAUCE_borrowAmount.toNumber())
                .addUint256(2)
                .addAddress(operatorPuKey)
        ).execute(hClient);

    // Then withdraw to be back to square one
    await new ContractExecuteTransaction()
        .setContractId(SAUCE_LendingPool_ContractId)
        .setGas(1000000)
        .setFunction("withdraw",
            new ContractFunctionParameters()
                .addAddress(SAUCE_TokenId.toSolidityAddress())
                .addUint256(SAUCE_lendingAmount.toNumber())
                .addAddress(operatorPuKey)
        ).execute(hClient);

    console.log(`Done`);
    process.exit(0);
}

// Run the main function
if (require.main === module) {
    main().catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    });
}
