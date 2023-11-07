"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSalesConditions = void 0;
const getPropertyInfo_1 = require("./getPropertyInfo");
function checkSalesConditions(stringArray) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Checking Sales Conditions ...");
        // Store sales details from agreement
        const expectedSalesPrice = parseInt(stringArray[8], 10);
        const startDate = parseInt(stringArray[4]);
        const endDate = parseInt(stringArray[5]);
        // Get sales data from API
        const { lastSaleDate, lastSalePrice } = yield (0, getPropertyInfo_1.getPropertyInfo)(stringArray[0]);
        // 1. Check if property is sold
        if (lastSaleDate && lastSalePrice) {
            // 2. Check if property is sold within start and end time.
            const dateObject = new Date(lastSaleDate);
            const timestamp = Math.floor(dateObject.getTime() / 1000);
            console.log("start date, timestamp, end date", startDate, timestamp, endDate);
            if (startDate < timestamp && timestamp <= endDate) {
                // 3. Check if agreement has expectedSalesPrice
                const hasExpectedSalesPrice = stringArray[7] === "true" ? true : false;
                if (hasExpectedSalesPrice) {
                    // 4. Check if sales price has been met
                    console.log("Last sales price, Expected sales price", lastSalePrice, expectedSalesPrice);
                    if (lastSalePrice >= expectedSalesPrice) {
                        // Meets sales price
                        return { condition: true, reason: "Meets sales price, deadline and all criterias" };
                    }
                    else {
                        // Doesn't meet sales price
                        return { condition: false, reason: "Doesn't meet sales price" };
                    }
                }
                else {
                    // Meets condition without expected sales price
                    return { condition: true, reason: "Meets condition without expected sales price" };
                }
            }
            else {
                // Didn't perform sales within timeframe
                return { condition: false, reason: "Didn't perform sales within timeframe" };
            }
        }
        else {
            // No latest sales data available
            return { condition: false, reason: "No latest sales data available" };
        }
        // Check Sales time within agreement's start or end date
    });
}
exports.checkSalesConditions = checkSalesConditions;
