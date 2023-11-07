from beaker import *
from pyteal import *

from beaker.application import Application
from beaker.client import ApplicationClient
from pyteal import (
    Assert, TealType, Global, Int, Approve, abi, Seq, Cond, InnerTxnBuilder, TxnField, TxnType,
    Txn, Div, Minus, If
)

from beaker.lib.storage import BoxMapping


# Our custom Struct for SenderFundsContract Tuple
class SenderFundsContract(abi.NamedTuple):
    propertyNumber: abi.Field[abi.String]
    Sender: abi.Field[abi.Address]
    Receiver: abi.Field[abi.Address]
    bonusAmount: abi.Field[abi.Uint64]
    startDate: abi.Field[abi.Uint64]
    endDate: abi.Field[abi.Uint64]
    propertySold: abi.Field[abi.Bool]
    haveExpectedSalesPrice: abi.Field[abi.Bool]
    expectedSalesPrice: abi.Field[abi.Uint64]
    meetSalesCondition: abi.Field[abi.Bool]
    fundsWithdrawn: abi.Field[abi.Bool]
    postDeadlineCheck: abi.Field[abi.Bool] # For Sender to withdraw 


class SenderFundsStates:
    sender_funds_item = BoxMapping(abi.String, SenderFundsContract)


app = Application("Sender Funds Contract with Beaker", state=SenderFundsStates())


## Should only be created by Sender ##
### Add SenderFunds with Boxes ###
@app.external
def createFundsInfo(pay: abi.PaymentTransaction, propertyNumber: abi.String, Receiver: abi.Address, startDate: abi.Uint64, endDate: abi.Uint64, haveExpectedSalesPrice: abi.Bool, expectedSalesPrice: abi.Uint64) -> Expr:
    propertySold =  abi.Bool()
    meetSalesCondition  = abi.Bool()
    fundsWithdrawn  = abi.Bool()
    postDeadlineCheck = abi.Bool()
    Sender = abi.Address()
    bonusAmount = abi.Uint64()
    sender_funds_tuple = SenderFundsContract()

    return Seq(
        propertySold.set(Int(0)),
        meetSalesCondition.set(Int(0)),
        fundsWithdrawn.set(Int(0)),
        postDeadlineCheck.set(Int(0)),
        Sender.set(Txn.sender()),
        bonusAmount.set(pay.get().amount()),
        sender_funds_tuple.set(propertyNumber, Sender,Receiver, bonusAmount, startDate, endDate, propertySold, haveExpectedSalesPrice, expectedSalesPrice, meetSalesCondition, fundsWithdrawn, postDeadlineCheck),
        app.state.sender_funds_item[propertyNumber.get()].set(sender_funds_tuple),
    )


## Should only be called by contract owner ##
# Data updates based on API
# 1. Change boolean for sender/receiver can withdraw.
# 2. Sender can only receive after time passes. 
### Update SenderFunds Item ###
@app.external
def updateSenderFundsItem(item_name: abi.String,propertySold: abi.Bool, meetSalesCondition: abi.Bool, postDeadlineCheck: abi.Bool,*, output: SenderFundsContract) -> Expr:
    existing_sender_funds_item = SenderFundsContract()
    propertyNumber = abi.String()
    Sender = abi.Address()
    Receiver = abi.Address()
    bonusAmount = abi.Uint64()
    startDate = abi.Uint64()
    endDate = abi.Uint64()
    haveExpectedSalesPrice = abi.Bool()
    expectedSalesPrice = abi.Uint64()
    fundsWithdrawn = abi.Bool()

    

    return Seq(
        Assert(Global.creator_address()==Txn.sender()), # Only gets called by contract owner
        existing_sender_funds_item.decode(app.state.sender_funds_item[item_name.get()].get()),
        propertyNumber.set(existing_sender_funds_item.propertyNumber),
        Sender.set(existing_sender_funds_item.Sender),
        Receiver.set(existing_sender_funds_item.Receiver),
        bonusAmount.set(existing_sender_funds_item.bonusAmount),
        startDate.set(existing_sender_funds_item.startDate),
        endDate.set(existing_sender_funds_item.endDate),
        haveExpectedSalesPrice.set(existing_sender_funds_item.haveExpectedSalesPrice),
        expectedSalesPrice.set(existing_sender_funds_item.expectedSalesPrice),
        fundsWithdrawn.set(existing_sender_funds_item.fundsWithdrawn),
        existing_sender_funds_item.set(propertyNumber, Sender,Receiver, bonusAmount, startDate, endDate, propertySold, haveExpectedSalesPrice, expectedSalesPrice, meetSalesCondition, fundsWithdrawn, postDeadlineCheck),
        app.state.sender_funds_item[item_name.get()].set(existing_sender_funds_item),
        app.state.sender_funds_item[item_name.get()].store_into(output),
    )


### Read SenderFunds Item ###
@app.external
def readItem(item_name: abi.String, *, output: SenderFundsContract) -> Expr:
    return Seq(
        app.state.sender_funds_item[item_name.get()].store_into(output),  
    )

### Read Funds Withdrawl status ###
@app.external
def readFundsWithdrawnStatus(item_name: abi.String, *, output: abi.Bool) -> Expr:
    existing_sender_funds_item = SenderFundsContract()
    return Seq(
        existing_sender_funds_item.decode(app.state.sender_funds_item[item_name.get()].get()),
        output.set(existing_sender_funds_item.fundsWithdrawn) 
    )

### Withdraw Funds For Receiver###
# Add funds received boolean
@app.external
def WithdrawFundsForReceiver(item_name: abi.String, *, output: SenderFundsContract) -> Expr:
    # Declare all variables
    # Assert variables
    existing_sender_funds_item = SenderFundsContract()
    bonusAmount = abi.Uint64()
    Receiver = abi.Address()
    false_bool_fundsWithdrawn =  abi.Bool()
    false_bool_propertySold =  abi.Bool()
    false_bool_meetSalesCondition =  abi.Bool()
    # Other variables
    propertyNumber = abi.String()
    Sender = abi.Address()
    startDate = abi.Uint64()
    endDate = abi.Uint64()
    haveExpectedSalesPrice = abi.Bool()
    expectedSalesPrice = abi.Uint64()
    fundsWithdrawn = abi.Bool()
    propertySold= abi.Bool()
    meetSalesCondition= abi.Bool()
    postDeadlineCheck= abi.Bool()

    return Seq(
        ## Conditions to call this function 
        # Get all values from the box
        existing_sender_funds_item.decode(app.state.sender_funds_item[item_name.get()].get()),
        # 1. Only Receiver can call this function
        Receiver.set(existing_sender_funds_item.Receiver), 
        Assert(Receiver.get() == Txn.sender()),
        # 2. Set total bonus amount to receive
        bonusAmount.set(existing_sender_funds_item.bonusAmount),
        # 3. Funds shouldn't be withdrawn already
        false_bool_fundsWithdrawn.set(existing_sender_funds_item.fundsWithdrawn),
        Assert(false_bool_fundsWithdrawn.get() == Int(0)),
        # 4. Check if property is sold  
        false_bool_propertySold.set(existing_sender_funds_item.propertySold),
        Assert(false_bool_propertySold.get() != Int(0)),
        # 5. Check if expected sales price is met
        false_bool_meetSalesCondition.set(existing_sender_funds_item.meetSalesCondition),
        Assert(false_bool_meetSalesCondition.get() != Int(0)),

        
        ## Actions on this function
        # 1. Payment is to be received only by the Receiver
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: Txn.sender(),
                TxnField.amount: bonusAmount.get()
            }
        ),
        # 2. Update variables in the box
        propertyNumber.set(existing_sender_funds_item.propertyNumber),
        Sender.set(existing_sender_funds_item.Sender),
        startDate.set(existing_sender_funds_item.startDate),
        endDate.set(existing_sender_funds_item.endDate),
        haveExpectedSalesPrice.set(existing_sender_funds_item.haveExpectedSalesPrice),
        expectedSalesPrice.set(existing_sender_funds_item.expectedSalesPrice),
        fundsWithdrawn.set(Int(1)), # To set funds withdraw status
        propertySold.set(existing_sender_funds_item.propertySold),
        meetSalesCondition.set(existing_sender_funds_item.meetSalesCondition),
        postDeadlineCheck.set(existing_sender_funds_item.postDeadlineCheck),
        existing_sender_funds_item.set(propertyNumber, Sender,Receiver, bonusAmount, startDate, endDate, propertySold, haveExpectedSalesPrice, expectedSalesPrice, meetSalesCondition, fundsWithdrawn, postDeadlineCheck),
        
        # 3. Show the whole Bonus Info Box as output
        app.state.sender_funds_item[item_name.get()].set(existing_sender_funds_item),
        app.state.sender_funds_item[item_name.get()].store_into(output),  
    )

### Withdraw Funds For Sender###
# Add funds received boolean
@app.external
def WithdrawFundsForSender(item_name: abi.String, *, output: SenderFundsContract) -> Expr:
    # Declare all variables
    # Assert variables
    existing_sender_funds_item = SenderFundsContract()
    bonusAmount = abi.Uint64()
    Sender = abi.Address()
    false_bool_fundsWithdrawn =  abi.Bool()
    false_bool_postDeadlineCheck =  abi.Bool()
    false_bool_meetSalesCondition =  abi.Bool()


    # Other variables
    propertyNumber = abi.String()
    Receiver = abi.Address()
    startDate = abi.Uint64()
    endDate = abi.Uint64()
    haveExpectedSalesPrice = abi.Bool()
    expectedSalesPrice = abi.Uint64()
    fundsWithdrawn = abi.Bool()
    propertySold= abi.Bool() 
    meetSalesCondition= abi.Bool()
    postDeadlineCheck= abi.Bool()

    return Seq(
        ## Conditions to call this function 
        # Get all values from the box
        existing_sender_funds_item.decode(app.state.sender_funds_item[item_name.get()].get()),
        # 1. Only Sender can call this function
        Sender.set(existing_sender_funds_item.Sender),
        Assert(Sender.get() == Txn.sender()),
        # 2. Set total bonus amount to receive
        bonusAmount.set(existing_sender_funds_item.bonusAmount),
        # 3. Funds shouldn't be withdrawn already
        false_bool_fundsWithdrawn.set(existing_sender_funds_item.fundsWithdrawn),
        Assert(false_bool_fundsWithdrawn.get() == Int(0)),
        # 4. Check if API was checked post sales time to allow withdraw
        false_bool_postDeadlineCheck.set(existing_sender_funds_item.postDeadlineCheck),
        Assert(false_bool_postDeadlineCheck.get() != Int(0)),
        # 5. Check if expected sales condition is not met
        false_bool_meetSalesCondition.set(existing_sender_funds_item.meetSalesCondition),
        Assert(false_bool_meetSalesCondition.get() == Int(0)),



        ## Actions on this function
        # 1. Payment is to be received only by the Sender
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: Txn.sender(),
                TxnField.amount: bonusAmount.get()
            }
        ),
        # 2. Update variables in the box
        propertyNumber.set(existing_sender_funds_item.propertyNumber),
        Receiver.set(existing_sender_funds_item.Receiver),
        startDate.set(existing_sender_funds_item.startDate),
        endDate.set(existing_sender_funds_item.endDate),
        haveExpectedSalesPrice.set(existing_sender_funds_item.haveExpectedSalesPrice),
        expectedSalesPrice.set(existing_sender_funds_item.expectedSalesPrice),
        fundsWithdrawn.set(Int(1)), # To set funds withdraw status
        propertySold.set(existing_sender_funds_item.propertySold),
        meetSalesCondition.set(existing_sender_funds_item.meetSalesCondition),
        postDeadlineCheck.set(existing_sender_funds_item.postDeadlineCheck),
        existing_sender_funds_item.set(propertyNumber, Sender,Receiver, bonusAmount, startDate, endDate, propertySold, haveExpectedSalesPrice, expectedSalesPrice, meetSalesCondition, fundsWithdrawn, postDeadlineCheck),
        # 3. Show the whole Bonus Info Box as output
        app.state.sender_funds_item[item_name.get()].set(existing_sender_funds_item),
        app.state.sender_funds_item[item_name.get()].store_into(output),  
    )
