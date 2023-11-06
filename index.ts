/* eslint-disable no-console */
import algosdk from 'algosdk';
import readline from 'readline';
import process from 'process';
import fs from 'fs';
import * as abi from './contract/contract.json';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const skipPrompts = process.argv.includes('--skip-prompts');

function waitForInput() {
  if (skipPrompts === true) return new Promise((resolve) => { resolve(true); });
  return new Promise((resolve) => {
    rl.question('Press enter to continue...', resolve);
  });
}

async function main() {
  // Account creation
  const account = algosdk.generateAccount();
  console.log('Mnemonic:', algosdk.secretKeyToMnemonic(account.sk));
  console.log('Address:', account.addr);

  await waitForInput();

  // Create connection to network via public algod API
  const algodToken = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const algodPort = undefined;
  const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

  // get accountInfo
  let accountInfo = await algodClient.accountInformation(account.addr).do();

  console.log('accountInfo:', accountInfo);

  await waitForInput();

  console.log('Dispsene ALGO at https://testnet.algoexplorer.io/dispenser. Script will continue once ALGO is received...');

  // Check balance of account via algod
  const waitForBalance = async () => {
    accountInfo = await algodClient.accountInformation(account.addr).do();

    const balance = accountInfo.amount;

    if (balance === 0) {
      await waitForBalance();
    }
  };

  await waitForBalance();

  console.log(`${account.addr} funded!`);

  await waitForInput();

  // Get basic information needed for every transcation
  const suggestedParams = await algodClient.getTransactionParams().do();
  console.log('suggestedParams:', suggestedParams);

  await waitForInput();

  // First transaction: payment
  const dispenserAddress = 'DISPE57MNLYKOMOK3H5IMBAYOYW3YL2CSI6MDOG3RDXSMET35DG4W6SOTI';

  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: account.addr,
    to: dispenserAddress,
    amount: 0.5 * 1e6, // * 1e6 to convert from ALGO to microALGO
  });

  const signedPaymentTxn = paymentTxn.signTxn(account.sk);

  await algodClient.sendRawTransaction(signedPaymentTxn).do();
  console.log(`Sending payment transaction ${paymentTxn.txID()}...`);

  const roundsToWait = 3;
  await algosdk.waitForConfirmation(algodClient, paymentTxn.txID(), roundsToWait);

  console.log(`Payment transaction ${paymentTxn.txID()} confirmed! See it at https://testnet.algoscan.app/tx/${paymentTxn.txID()}`);

  await waitForInput();


  // create app
  const approvalSource = fs.readFileSync('./contract/approval.teal', 'utf8');
  const clearSource = fs.readFileSync('./contract/clear.teal', 'utf8');

  // Compile the TEAL programs
  const approvalCompileResult = await algodClient.compile(approvalSource).do();
  const clearCompileResult = await algodClient.compile(clearSource).do();

  // Convert the compilation result to Uint8Array
  const approvalBytes = new Uint8Array(Buffer.from(approvalCompileResult.result, 'base64'));
  const clearBytes = new Uint8Array(Buffer.from(clearCompileResult.result, 'base64'));

  // Read our ABI JSON file to create an ABIContract object
  const contract = new algosdk.ABIContract(abi);

 
  const appIndex = 468709015;


  // Call app with ATC
  const atc = new algosdk.AtomicTransactionComposer();
  const boxKey = new Uint8Array(Buffer.from('123456'));

  const boxpaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
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
  const methodArgs = ['123456']

  atc.addMethodCall({
    suggestedParams,
    sender: account.addr,
    // Signer is a function that takes in unsigned txns and returns signed txns
    signer: async (unsignedTxns) => unsignedTxns.map((t) => t.signTxn(account.sk)),
    boxes: [
      {
      appIndex: appIndex,
      name: boxKey,
      },
      ],
    appID: appIndex,
    method: algosdk.getMethodByName(contract.methods, 'readFundsWithdrawnStatus'),
    // Note how we don't have to manually encode the string
    methodArgs: methodArgs,
    
  });

  // Add the payment transaction to the transaction composer
  // add the transaction to the ATC with a signer
  // await atc.addTransaction({ txn: boxpaymentTxn, signer:async (unsignedTxns) => unsignedTxns.map((t) => t.signTxn(account.sk)), });

  const executeResponse = await atc.execute(algodClient, roundsToWait);
  console.log(`Box executed! See the app at https://testnet.algoscan.app/app/${appIndex}`, executeResponse.methodResults[0].returnValue);

}

main().then(() => rl.close());