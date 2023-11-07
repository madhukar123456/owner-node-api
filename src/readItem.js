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
exports.readItem = void 0;
const algosdk_1 = __importDefault(require("algosdk"));
const process_1 = __importDefault(require("process"));
const abi = __importStar(require("../contract/contract.json"));
function readItem(appIndex, propertyNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Reading data from the contract ...");
        // Import Wallet
        const mnemonic = process_1.default.env.OWNER_WALLET_MNEMONIC;
        const account = algosdk_1.default.mnemonicToSecretKey(mnemonic);
        console.log('Wallet import successful ...');
        // Create connection to network via public algod API
        const algodToken = '';
        const algodServer = 'https://testnet-api.algonode.cloud';
        const algodPort = undefined;
        const algodClient = new algosdk_1.default.Algodv2(algodToken, algodServer, algodPort);
        console.log('algodClient connect successful ...');
        // Get basic information needed for every transcation
        const suggestedParams = yield algodClient.getTransactionParams().do();
        // Read our ABI JSON file to create an ABIContract object
        const contract = new algosdk_1.default.ABIContract(abi);
        console.log('ABI import successful ...');
        // Call app with ATC
        const atc = new algosdk_1.default.AtomicTransactionComposer();
        const boxKey = new Uint8Array(Buffer.from(propertyNumber));
        const signerFunc = (unsignedTxns) => __awaiter(this, void 0, void 0, function* () {
            return unsignedTxns.map((t) => {
                const note = algosdk_1.default.encodeObj({ nonce: Math.random() });
                t.note = note;
                return t.signTxn(account.sk);
            });
        });
        //For update
        const methodArgs = [
            propertyNumber
        ];
        atc.addMethodCall({
            suggestedParams,
            sender: account.addr,
            // Signer is a function that takes in unsigned txns and returns signed txns
            boxes: [
                {
                    appIndex: appIndex,
                    name: boxKey,
                },
            ],
            appID: appIndex,
            method: algosdk_1.default.getMethodByName(contract.methods, 'readItem'),
            // Note how we don't have to manually encode the string
            methodArgs: methodArgs,
            signer: signerFunc,
        });
        const executeResponse = yield atc.execute(algodClient, 3);
        const myArray = Array.isArray(executeResponse.methodResults[0].returnValue) ? executeResponse.methodResults[0].returnValue : [];
        return myArray;
    });
}
exports.readItem = readItem;
