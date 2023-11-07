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
exports.checkDeadline = void 0;
// Get the current date as a JavaScript Date object
const currentDateObj = new Date();
// Format the current date as YYYYMMDD
const currentDateIntegerUnixTimeInSeconds = Math.floor(currentDateObj.getTime() / 1000);
function checkDeadline(endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Checking Deadline ...", "Current Date", currentDateObj, currentDateIntegerUnixTimeInSeconds, "End date:", endDate);
        return currentDateIntegerUnixTimeInSeconds > endDate;
    });
}
exports.checkDeadline = checkDeadline;
