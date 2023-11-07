import { updateContract } from "./updateContract";
import { readItem } from "./readItem";
import { checkDeadline } from "./checkDeadline";
import { checkSalesConditions } from "./checkSalesConditions";
export async function checkAndUpdate(appIndex:number, propertyNumber:string){
    try {
        console.log("Running Check and Update ...")
        const myArray = await readItem(appIndex,propertyNumber);
        const stringArray = myArray.map(value => String(value));
        
        // // Check to update propertySold and meetSalesCondition
        const meetSalesCondition = await checkSalesConditions(stringArray);
        console.log("Meet Sales Condition",meetSalesCondition)
        // // Check to update postDeadlineCheck
        const endDate = parseInt(stringArray[4],10);
        const postDeadlineCheck = await checkDeadline(endDate);
    
        // // // Update Final Values
        if(meetSalesCondition.condition){
            await updateContract(appIndex, propertyNumber, true, true, postDeadlineCheck);
        }
        else{
            await updateContract(appIndex, propertyNumber, false, false, postDeadlineCheck);
        }
        return {meetSalesCondition,postDeadlineCheck}
    } catch (error:any) {
        throw new Error('Error fetching property information: ' + error.message);
    }
}