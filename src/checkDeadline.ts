
// Get the current date as a JavaScript Date object
const currentDateObj = new Date();

// Format the current date as YYYYMMDD
const currentDateIntegerUnixTimeInSeconds: number = Math.floor(currentDateObj.getTime() / 1000);

export async function checkDeadline(endDate: number){
    console.log("Checking Deadline ...","Current Date", currentDateObj,currentDateIntegerUnixTimeInSeconds, "End date:", endDate)
    return currentDateIntegerUnixTimeInSeconds > endDate;
}