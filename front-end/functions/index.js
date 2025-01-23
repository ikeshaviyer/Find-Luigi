const express = require('express');

const serverless = require('serverless-http');

const { Firestore } = require('@google-cloud/firestore');

const fs = require('fs');

const os = require('os');

const path = require('path');



const app = express();



const serviceAccount = {

  "type": "service_account",

  "project_id": "carbide-calling-444504-u4",

  "private_key_id": "ecf05a5b1e5d580ecc00512c20947eba73a8fc98",

  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCleOwFmEjmeWrb\naGe7e3MJMnR9nOms2V5KYLcHKkF/Rqu/xVuzlFgzuRNoYnxuebYGsrgRzbeoFzes\nbnJS+BIteN1rhpQb5i8GIi8S3hkuOhTzoqKqAAhs39KLINBQXRdSXf2U5wuvwtX0\nPntd9g/eMpcj4HROPiUY1Or6EihnXte4TOtRnkt5oG8NTDOC9FJmRjIh+SY1zK59\nMDUNzfPfCSIuvzM8xebjwYLsr9F7VFnSeELVHJxzco1LomnUZzAjwq3Af40CK29r\nE/O2l1a2M7OqKRqYomNbKi2oRJk7768/HzYr2wBIwZwDWrsuJxZG+TS0c0qVGCPC\nynDqZXw1AgMBAAECggEAAUljEFrmQL0kSGKKELwQUigr9umEeT+44gG34p7HouHt\nlu/Q2gUnornYvkwwGSNWd9JdhrhvgyS2Hf5mQRxcmEH8746S9Pi1xL6VEDtrKcV/\nhWeBvhlsYRZZBcZBHwcGoQpBmkF9czgV+552oMl3iffIPPif15dYDN8bv7oy1LrX\nK32oaauKSYQfBiRgWrt6wNLb+MApChWVc9k3EQCCat8C9soGQ5hGrhsNQ2HIuiym\nECILvPYqheUZil47Z8XonfBjlwY6kOGvdlq5SkMTGoH6pzTlW+Re4B+9Al0Yq6mB\nJN7HciGKojJESt0pV6GGi/uRxwF3aHUs/rjqX9dpYQKBgQDexKBXRtf18Ivre/bO\nuZpi6ovBxKpwu3txJnVDrLG8vsfTw3OqA0jT9BOH1/KCzN6nNWVmy/N6hi+AhOvt\n5eVbrtR1GSAXmZKHrANQ8SZ8JR7UF+ju85EV/gs49l0s2epq2VI+usWczczwuUuE\npFfx8MkVJp0vrip7tEhrDNjwVQKBgQC+KDUzx50UlqbOJQhqKj4Aegc3eNJWzXdt\ncjiXW/um2IIgrdz2prFcdbsK20tMo2ea8ttCy/s2e1s3onophU1cjq3GJiaWPbuC\ngcQOvGlpy50d7FKX/MQ1eirt2dkv8sfdMu6Uk8ILa8g+UkdUaaXyXUhfkRltDyPs\ngT488OS8YQKBgHmvYIKsQRWoE1ZLvdLIkevMgREUc6Hm15REVLPl5qTadd9YGZtZ\n9fNJlU2UCXWnoUwnH7/aUqKwH8yNTy8BcJr3Ujiww9YAXolbzefuAn637DIg6W11\ngOBJiCnSca0pUCKTmZiIf5+az4MDRJwtBZk0VTMHh79e3Pf7z78iInKNAoGAPjGy\nbPQdyU0Y05XDMc4NJ2TCFX+b9C4RoKdaIQ9BuKlZrkyPV9Dfc6lB+uQMtc1AJqrF\n0gwbZw9jn0eyAwCJc/tqlMOHnV4lhSLiOBuhsquZAN95iCJxHjiN7+tvoMIcYpm0\n9L17GvcusEuC7vX7A9FEyZUQpt3r1v/SlmYHuiECgYBEWsL4A76DFeUnzv8iD3x2\nN8s0Bg+Y78BOy/nHieO851H6hYFW0+PWabX4EK2SqvyHxoIUSuH5igcD9fR3JJU0\nLPAT/CM9yNRgmHN+Qm1KnJufH9iUVv7ZJ2bVNaa1w9cP2u2Ml1LeCzbecDIcxElV\ngxAIkE3gaG3cX8jsR1umng==\n-----END PRIVATE KEY-----\n",

  "client_email": "firebase-adminsdk-wiq4l@carbide-calling-444504-u4.iam.gserviceaccount.com",

  "client_id": "111822769061911286651",

  "auth_uri": "https://accounts.google.com/o/oauth2/auth",

  "token_uri": "https://oauth2.googleapis.com/token",

  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",

  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-wiq4l%40carbide-calling-444504-u4.iam.gserviceaccount.com"

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