"use strict";
/* eslint-disable no-console */
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
// Import required modules
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const checkAndUpdate_1 = require("./src/checkAndUpdate");
// Load environment variables from .env file
dotenv.config();
// Create Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Enable CORS for all routes
app.use((0, cors_1.default)());
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Define a route for your API
app.post('/update-contract', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract variables from the request body
        const requestbody = req.body;
        console.log(requestbody);
        const appIndex = parseInt(requestbody.appIndex);
        const propertyNumber = requestbody.propertyNumber.toString();
        // Check and update using the provided variables
        const { meetSalesCondition, postDeadlineCheck } = yield (0, checkAndUpdate_1.checkAndUpdate)(appIndex, propertyNumber);
        // Send the response with the required values and status
        res.json({
            meetSalesCondition,
            postDeadlineCheck,
            status: 'Contract Updated',
        });
    }
    catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
