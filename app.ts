/* eslint-disable no-console */

// Import required modules
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { checkAndUpdate } from './src/checkAndUpdate';

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies


// Define a route for your API
app.post('/update-contract', async (req: Request, res: Response) => {
  try {
    // Extract variables from the request body
    const requestbody = req.body;
    console.log(requestbody)
    const appIndex:number= parseInt(requestbody.appIndex);
    const propertyNumber:string= requestbody.propertyNumber.toString();

    // Check and update using the provided variables
    const { meetSalesCondition, postDeadlineCheck } = await checkAndUpdate(appIndex, propertyNumber);

    // Send the response with the required values and status
    res.json({
      meetSalesCondition,
      postDeadlineCheck,
      status: 'Contract Updated',
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

