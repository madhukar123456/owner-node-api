"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const algosdk_1 = __importDefault(require("algosdk"));
const readline_1 = __importDefault(require("readline"));
const process_1 = __importDefault(require("process"));
const fs_1 = __importDefault(require("fs"));
const abi = __importStar(require("./contract/contract.json"));
const rl = readline_1.default.createInterface({ input: process_1.default.stdin, output: process_1.default.stdout });
const skipPrompts = process_1.default.argv.includes('--skip-prompts');
function waitForInput() {
    if (skipPrompts === true)
        return new Promise((resolve) => { resolve(true); });
    return new Promise((resolve) => {
        rl.question('Press enter to continue...', resolve);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Account creation
        const account = algosdk_1.default.generateAccount();
        console.log('Mnemonic:', algosdk_1.default.secretKeyToMnemonic(account.sk));
        console.log('Address:', account.addr);
        yield waitForInput();
        // Create connection to network via public algod API
        const algodToken = '';
        const algodServer = 'https://testnet-api.algonode.cloud';
        const algodPort = undefined;
        const algodClient = new algosdk_1.default.Algodv2(algodToken, algodServer, algodPort);
        // get accountInfo
        let accountInfo = yield algodClient.accountInformation(account.addr).do();
        console.log('accountInfo:', accountInfo);
        yield waitForInput();
        console.log('Dispsene ALGO at https://testnet.algoexplorer.io/dispenser. Script will continue once ALGO is received...');
        // Check balance of account via algod
        const waitForBalance = () => __awaiter(this, void 0, void 0, function* () {
            accountInfo = yield algodClient.accountInformation(account.addr).do();
            const balance = accountInfo.amount;
            if (balance === 0) {
                yield waitForBalance();
            }
        });
        yield waitForBalance();
        console.log(`${account.addr} funded!`);
        yield waitForInput();
        // Get basic information needed for every transcation
        const suggestedParams = yield algodClient.getTransactionParams().do();
        console.log('suggestedParams:', suggestedParams);
        yield waitForInput();
        // First transaction: payment
        const dispenserAddress = 'DISPE57MNLYKOMOK3H5IMBAYOYW3YL2CSI6MDOG3RDXSMET35DG4W6SOTI';
        const paymentTxn = algosdk_1.default.makePaymentTxnWithSuggestedParamsFromObject({
            suggestedParams,
            from: account.addr,
            to: dispenserAddress,
            amount: 0.5 * 1e6, // * 1e6 to convert from ALGO to microALGO
        });
        const signedPaymentTxn = paymentTxn.signTxn(account.sk);
        yield algodClient.sendRawTransaction(signedPaymentTxn).do();
        console.log(`Sending payment transaction ${paymentTxn.txID()}...`);
        const roundsToWait = 3;
        yield algosdk_1.default.waitForConfirmation(algodClient, paymentTxn.txID(), roundsToWait);
        console.log(`Payment transaction ${paymentTxn.txID()} confirmed! See it at https://testnet.algoscan.app/tx/${paymentTxn.txID()}`);
        yield waitForInput();
        // create app
        const approvalSource = fs_1.default.readFileSync('./contract/approval.teal', 'utf8');
        const clearSource = fs_1.default.readFileSync('./contract/clear.teal', 'utf8');
        // Compile the TEAL programs
        const approvalCompileResult = yield algodClient.compile(approvalSource).do();
        const clearCompileResult = yield algodClient.compile(clearSource).do();
        // Convert the compilation result to Uint8Array
        const approvalBytes = new Uint8Array(Buffer.from(approvalCompileResult.result, 'base64'));
        const clearBytes = new Uint8Array(Buffer.from(clearCompileResult.result, 'base64'));
        // Read our ABI JSON file to create an ABIContract object
        const contract = new algosdk_1.default.ABIContract(abi);
        const appIndex = 468709015;
        // Call app with ATC
        const atc = new algosdk_1.default.AtomicTransactionComposer();
        const boxKey = new Uint8Array(Buffer.from('123456'));
        const boxpaymentTxn = algosdk_1.default.makePaymentTxnWithSuggestedParamsFromObject({
            from: account.addr,
            to: 'MSGHEAY5V2KC772RPNLS5CFQO7HHUGSONMHTWF2VOCUWVIRT5OM3DCRSR4',
            amount: 0.5 * 1e6,
            suggestedParams,
        });
        // const methodArgs = [
        //   '12345', //propertyNumber
        //   '7K4YLNAOC4IV6XP7VWIXE5EAO4WHFFX6Q2H5YJSJTA4NF2BVOJ674CW6KA', //receiverAddress
        //   1,      //startDate
        //   2,      //endDate
        //   false,  //haveExpectedSalesPrice
        //   1       //expectedSalesPrice         
        // ]
        const methodArgs = ['123456'];
        atc.addMethodCall({
            suggestedParams,
            sender: account.addr,
            // Signer is a function that takes in unsigned txns and returns signed txns
            signer: (unsignedTxns) => __awaiter(this, void 0, void 0, function* () { return unsignedTxns.map((t) => t.signTxn(account.sk)); }),
            boxes: [
                {
                    appIndex: appIndex,
                    name: boxKey,
                },
            ],
            appID: appIndex,
            method: algosdk_1.default.getMethodByName(contract.methods, 'readFundsWithdrawnStatus'),
            // Note how we don't have to manually encode the string
            methodArgs: methodArgs,
        });
        // Add the payment transaction to the transaction composer
        // add the transaction to the ATC with a signer
        // await atc.addTransaction({ txn: boxpaymentTxn, signer:async (unsignedTxns) => unsignedTxns.map((t) => t.signTxn(account.sk)), });
        const executeResponse = yield atc.execute(algodClient, roundsToWait);
        console.log(`Box executed! See the app at https://testnet.algoscan.app/app/${appIndex}`, executeResponse.methodResults[0].returnValue);
    });
}
main().then(() => rl.close());
