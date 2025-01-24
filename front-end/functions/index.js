const express = require('express');

const serverless = require('serverless-http');

const { Firestore } = require('@google-cloud/firestore');

const fs = require('fs');

const os = require('os');

const path = require('path');



const app = express();



const serviceAccount = {

  "YOUR GOOGLE API KEY"

};



// Initialize Firestore with the hardcoded credentials

const firestore = new Firestore({

  credentials: serviceAccount,

  projectId: serviceAccount.project_id,

});



app.use(express.json());





// API endpoint to get the leaderboard

app.get('/api/leaderboard', async (req, res) => {

  const { page = 1, limit = 10 } = req.query;



  // Convert page and limit to numbers and provide default values

  const pageNumber = parseInt(page, 10) || 1;

  const limitNumber = parseInt(limit, 10) || 10;



  // Validate that pageNumber and limitNumber are valid integers

  if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {

    console.error('Invalid pagination parameters:', page, limit);

    return res.status(400).json({ error: 'Invalid page or limit parameters' });

  }



  const offset = (pageNumber - 1) * limitNumber;



  try {

    const leaderboardRef = firestore.collection('leaderboard');

    const snapshot = await leaderboardRef

      .orderBy('time', 'asc')

      .orderBy('clicks', 'asc')

      .offset(offset)

      .limit(Number(limit))

      .get();



    const leaderboard = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(leaderboard);

  } catch (error) {

    console.error('Error fetching leaderboard:', error);

    res.status(500).json({ error: 'Failed to fetch leaderboard' });

  }

});



app.post('/api/submit', async (req, res) => {

  try {

    const { name, time, clicks } = req.body;

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const today = new Date().toISOString().split('T')[0];

    const submissionInfo = JSON.stringify({ ipAddress, date: today });



    // Basic input validation

    if (!name || typeof time !== 'number' || typeof clicks !== 'number') {

      return res.status(400).json({ error: 'Invalid input: Missing or incorrect fields' });

    }



    // Banned words check

    if (containsBannedWords(name)) {

      return res.status(400).json({ error: "Your name contains banned words!" });

    }



    // Check if the user has already submitted today

    const hasSubmitted = await hasAlreadySubmitted(submissionInfo);

    if (hasSubmitted) {

      return res.status(400).json({ error: 'You can only submit once per day!' });

    }



    // Insert the new score into Firestore

    const leaderboardRef = firestore.collection('leaderboard');

    const newRecord = await leaderboardRef.add({ name, time, clicks, submission_info: submissionInfo });



    res.status(200).json({ message: 'Score submitted successfully', id: newRecord.id });

  } catch (error) {

    console.error('Error submitting score:', error);

    res.status(500).json({ error: 'Internal server error. Please try again later.' });

  }

});





// Check if the name contains any banned words

function containsBannedWords(name) {

  const bannedWords = ["badword1", "badword2", "offensive", "idiot"];

  return bannedWords.some(word => name.toLowerCase().includes(word));

}



// Check if the user has already submitted today (based on submission info)

async function hasAlreadySubmitted(submissionInfo) {

  const leaderboardRef = firestore.collection('leaderboard');

  const querySnapshot = await leaderboardRef.where('submission_info', '==', submissionInfo).get();

  return !querySnapshot.empty;

}



// Function to clear the leaderboard collection

async function clearLeaderboard() {

  try {

    const leaderboardRef = firestore.collection('leaderboard');

    const snapshot = await leaderboardRef.get();



    const batch = firestore.batch();

    snapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();



    console.log('Leaderboard collection cleared!');

  } catch (error) {

    console.error('Error clearing leaderboard:', error);

  }

}



// Schedule the function to run every day at 6:00 AM UTC (12:00 AM CST)

const { setTimeout } = require('timers');

// Helper function to calculate the milliseconds until the next 6:00 AM UTC
function getTimeUntilNextRun() {
  const now = new Date();
  const nextRun = new Date();
  
  nextRun.setUTCHours(6, 0, 0, 0); // Set to 6:00 AM UTC
  
  // If the current time is past 6:00 AM UTC today, schedule for tomorrow
  if (now >= nextRun) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  return nextRun - now; // Milliseconds until the next run
}

// Function to schedule `clearLeaderboard` daily
function scheduleLeaderboardClear() {
  const timeUntilNextRun = getTimeUntilNextRun();

  console.log(`Scheduled leaderboard clear in ${timeUntilNextRun / 1000 / 60} minutes.`);
  
  setTimeout(async function run() {
    console.log('Running scheduled leaderboard clear...');
    try {
      await clearLeaderboard();
      console.log('Leaderboard cleared successfully!');
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
    }
    
    // Schedule the next run for the same time tomorrow
    setTimeout(run, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntilNextRun);
}

// Start the scheduler
scheduleLeaderboardClear();




// Export the handler for Netlify Functions

export const handler = serverless(app);
