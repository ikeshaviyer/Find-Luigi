import './style.css';
import luigi from '/assets/luigi.png';
import mario from '/assets/mario.png';
import wario from '/assets/wario.png';
import yoshi from '/assets/yoshi.png';
import seedrandom from 'seedrandom';


const startButton = document.getElementById("Start");
const gameArea = document.getElementById("game-area");
const clicksElement = document.getElementById("clicks");
const timeElement = document.getElementById("time");
const resultElement = document.getElementById("result");
const submitScoreButton = document.getElementById("submit-score");
const playerNameInput = document.getElementById("player-name");
const errorMessage = document.getElementById("error-message");
const apiUrl = import.meta.env.VITE_API_URL;

//leaderboard stuff
const leaderboardUrl = `${apiUrl}/api/leaderboard`;
const leaderboardTable = document.getElementById("leaderboard-table");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");

//sound stuff
const backgroundMusic = new Audio('/assets/BGM.mp3'); // bgm
const findLuigiSound = new Audio('/assets/find_luigi.wav'); // Luigi oh yeah
const applauseSound = new Audio('/assets/Applause.wav'); ///applause
const muteButton = document.getElementById('mute-button');

let currentPage = 1;
const itemsPerPage = 10;

let clicks = 0;
let time;
let startTime;
let timer;
let timeInterval;

const characters = ["mario", "wario", "yoshi"];
const spriteSpeed = 2; // Speed of movement (px per frame)
const totalSprites = 80; // Increased the number of sprites on screen
const bannedWords = ["badword1", "badword2", "offensive", "idiot"]; // List of banned words
let playerName = "";

// Initialize mute state from localStorage
let muted = localStorage.getItem('muted') === 'true';

// Set initial mute state for ALL audio elements
muteButton.dataset.muted = muted; // Set initial data-muted attribute

backgroundMusic.muted = muted;
findLuigiSound.muted = muted;
applauseSound.muted = muted;

// Function to toggle mute state
function toggleMute() {
  muted = !muted;
  localStorage.setItem('muted', muted);

  // Update mute state for ALL audio elements
  muteButton.dataset.muted = muted; // Update data-muted attribute

  backgroundMusic.muted = muted;
  findLuigiSound.muted = muted;
  applauseSound.muted = muted;
}

// Add event listener to the mute button
muteButton.addEventListener('click', toggleMute);


//LEADERBOARD

function loadLeaderboard(page = 1) {
  console.log("THis is API URL:" + apiUrl);
  fetch(`${leaderboardUrl}?page=${page}&limit=${itemsPerPage}`)
    .then(response => response.text())
    .then(text => {
      console.log("Raw response:", text);

      if (text.startsWith("<!DOCTYPE html>")) {
        console.error("Received HTML response, expected JSON. Check the URL or backend.");
        return;
      }

      try {
        const data = JSON.parse(text);
        console.log("Parsed leaderboard:", data);

        // Sort the leaderboard data
        data.sort((a, b) => a.time - b.time || a.clicks - b.clicks);

        leaderboardTable.innerHTML = `<thead><tr><th>Rank</th><th>Name</th><th>Time (s)</th><th>Clicks</th></tr></thead><tbody>`;

        if (data && data.length > 0) {
          // Calculate the starting rank for the current page
          const startRank = (page - 1) * itemsPerPage + 1;

          data.forEach((entry, index) => {
            const rank = startRank + index;
            const row = document.createElement("tr");
            // Add all cells with data, including the rank
            row.innerHTML = `<td>${rank}</td><td>${entry.name}</td><td>${entry.time}</td><td>${entry.clicks}</td>`;
            leaderboardTable.appendChild(row);
          });
        } else {
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="4">No leaderboard data available.</td>`;
          leaderboardTable.appendChild(row);
        }

        leaderboardTable.innerHTML += `</tbody>`;

        currentPage = page;

        // Update button states
        prevPageButton.disabled = (currentPage === 1);
        nextPageButton.disabled = (data.length < itemsPerPage);

      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    })
    .catch(error => {
      console.error('Error fetching leaderboard:', error);
    });
}

// Previous page button click handler
prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    loadLeaderboard(currentPage - 1);
  }
});

// Next page button click handler
nextPageButton.addEventListener("click", () => {
  loadLeaderboard(currentPage + 1);
});



//Submit Score
function submitScore() {
  const firstSeedDone = localStorage.getItem('FirstSeedDone');
  if (firstSeedDone) {
    // If 'FirstSeedDone' exists, show a message and prevent submission
    errorMessage.textContent = "You cannot submit until the next reset.";
    return;
  }

  const playerName = playerNameInput.value.trim();
  clicks = parseInt(clicks, 10);

  // Validate player name
  if (!playerName) {
    errorMessage.textContent = "Name cannot be empty.";
    return;
  }

  fetch(`${apiUrl}/api/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: playerName, time, clicks }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || "Failed to submit score.");
        });
      }
      return response.json();
    })
    .then(() => {
      loadLeaderboard();
      closePopUp();
      playerNameInput.value = "";
      errorMessage.textContent = ""; // Clear previous errors
    })
    .catch(error => {
      console.error('Error submitting score:', error);
      errorMessage.textContent = error.message || "An error occurred while submitting your score.";
    });
}

// Setup game logic
// Enable pointer events for sprites on setup
const randomizeButton = document.getElementById("randomize-button");

function setupGame(isRandomized = false) {
  clicks = 0;
  clicksElement.textContent = clicks;
  startTime = Date.now();

  // Get the current date and time in CST
  // const simulatedNewDate = new Date();
  // simulatedNewDate.setDate(simulatedNewDate.getDate() + 1);  // Set the date to tomorrow

  const currentDate = new Date();
  const options = { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' };
  const cstDate = new Intl.DateTimeFormat('en-US', options).format(currentDate);
  // const cstDate = simulatedNewDate.toISOString().slice(0, 10);

  // Get the stored date of the last seed change
  const lastSeedDate = localStorage.getItem('lastSeedDate');

  let seed = cstDate;

  //Music
  backgroundMusic.loop = true; // Make the music loop
  backgroundMusic.play();

  if (isRandomized) {
    // Generate a new random seed if explicitly requested
    seed = Math.random().toString();
    localStorage.setItem('currentSeed', seed);
    localStorage.setItem('lastSeedDate', cstDate); // Update the date since we randomized manually
  } else {
    // If the date hasn't changed, use the same seed
    if (!lastSeedDate || lastSeedDate !== cstDate) {

      if (localStorage.getItem('FirstSeedDone')) {
        localStorage.removeItem('FirstSeedDone');
      }

      // New day, generate a new seed
      seed = cstDate;
      localStorage.setItem('currentSeed', seed); // Store the new seed for the day
      localStorage.setItem('lastSeedDate', cstDate); // Update the date
    } else {
      // If the date is the same, use the stored seed
      seed = cstDate;
    }
  }

  // Use the seed for randomization
  const rng = seedrandom(seed);

  // Generate sprites using the seed
  const luigiIndex = Math.floor(rng() * totalSprites);

  gameArea.innerHTML = ""; // Clear the game area

  for (let i = 0; i < totalSprites; i++) {
    const sprite = document.createElement("div");
    sprite.className = "character";

    if (i === luigiIndex) {
      sprite.style.backgroundImage = "url('assets/luigi.png')";
      sprite.dataset.character = "luigi";
      sprite.classList.add("active");

      // Ensure Luigi is not fully hidden
      const spriteWidth = sprite.offsetWidth; 
      const spriteHeight = sprite.offsetHeight;
      const maxX = gameArea.offsetWidth - spriteWidth;
      const maxY = gameArea.offsetHeight - spriteHeight;

      sprite.style.left = `${rng() * maxX}px`; // Position within gameArea
      sprite.style.top = `${rng() * maxY}px`;  // Position within gameArea
    } else {
      const randomCharacter = characters[Math.floor(rng() * characters.length)];
      sprite.style.backgroundImage = `url('assets/${randomCharacter}.png')`;
      sprite.dataset.character = randomCharacter;
    }

    sprite.style.left = `${rng() * 500}px`;
    sprite.style.top = `${rng() * 500}px`;

    const direction = {
      x: rng() > 0.5 ? spriteSpeed : -spriteSpeed,
      y: rng() > 0.5 ? spriteSpeed : -spriteSpeed,
    };
    sprite.dataset.direction = JSON.stringify(direction);

    sprite.addEventListener("click", handleClick);
    gameArea.appendChild(sprite);
  }

  timer = setInterval(updateSprites, 16);
  updateTime();
}


// Show randomize button after finding Luigi
function handleClick(e) {
  const clickedSprite = e.target;
  if (gameArea.contains(event.target)) {
    clicks += 1; // Increment clicks only if inside the game area
    clicksElement.textContent = clicks; // Update the display with the new click count
  }

  if (clickedSprite.dataset.character === "luigi") {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    time = parseFloat(elapsedTime);
    backgroundMusic.pause();      // Pause the playback
    backgroundMusic.currentTime = 0;
    findLuigiSound.play();
    applauseSound.play();
    clearInterval(timer);
    clearInterval(timeInterval);
    resultElement.textContent = `You found Luigi in ${clicks} clicks and ${elapsedTime}s! 🎉`;
    openPopUp(elapsedTime, clicks); // Open the pop-up to submit score

    submitScoreButton.style.display = "block"; // Show submit button
    randomizeButton.style.display = "block"; // Show randomize button after Luigi is found
  }
}

// Reset game when clicking on the randomize button
randomizeButton.addEventListener("click", () => {
  randomizeButton.style.display = "none"; // Hide randomize button after clicking
  setupGame(true); // Re-randomize the game setup
});


// Update sprite positions
function updateSprites() {
  const sprites = document.querySelectorAll(".character");
  const gameAreaWidth = gameArea.offsetWidth;
  const gameAreaHeight = gameArea.offsetHeight;

  sprites.forEach((sprite) => {
    const direction = JSON.parse(sprite.dataset.direction);
    let x = parseFloat(sprite.style.left);
    let y = parseFloat(sprite.style.top);

    x += direction.x;
    y += direction.y;

    if (x > gameAreaWidth) x = -sprite.offsetWidth;
    if (x < -sprite.offsetWidth) x = gameAreaWidth;
    if (y > gameAreaHeight) y = -sprite.offsetHeight;
    if (y < -sprite.offsetHeight) y = gameAreaHeight;

    sprite.style.left = `${x}px`;
    sprite.style.top = `${y}px`;
  });
}

// Update timer display
function updateTime() {
  timeInterval = setInterval(() => {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    timeElement.textContent = elapsedTime;
  }, 100);
}

startButton.addEventListener("click", () => {
  // Start the game
  setupGame();
  document.getElementById('Instructions-Pop-Up').style.display = 'none'
});
submitScoreButton.style.display = "none"; // Hide submit button initially
submitScoreButton.addEventListener("click", submitScore);

// Load leaderboard and check for daily reset
loadLeaderboard();

//POP UP FOR LEADERBOARD INPUT
// Function to open the pop-up
function openPopUp(time, clicks) {
  // Set the time and clicks in the modal
  document.getElementById('game-time').innerText = `${time}s`;
  document.getElementById('game-clicks').innerText = clicks;

  // Show the modal
  document.getElementById('Post-Game-Pop-Up').style.display = 'flex';
}

// Function to close the pop-up
function closePopUp() {
  document.getElementById('Post-Game-Pop-Up').style.display = 'none';
  // Store 'FirstSeedDone' in local storage after the popup is closed
  localStorage.setItem('FirstSeedDone', 'true');
}

// Event listener for the close button
document.getElementById('close-btn').addEventListener('click', closePopUp);

//Reset Timer

function startResetCountdown() {
  const resetTimerElement = document.getElementById("reset-timer");

  function updateCountdown() {
    const now = new Date();

    // Convert current time to CST
    const nowCST = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));

    // Calculate next reset time (12:00 AM CST)
    const nextReset = new Date(nowCST);
    nextReset.setHours(24, 0, 0, 0); // Set to midnight CST

    const timeRemaining = nextReset - nowCST; // Time difference in milliseconds

    if (timeRemaining <= 0) {
      // If it hits midnight, restart the countdown for the next day
      const nextDayReset = new Date(nextReset);
      nextDayReset.setDate(nextReset.getDate() + 1); // Add one day for the next midnight
      resetTimerElement.textContent = "Resets in: 24:00:00"; // Display max countdown briefly
      setTimeout(updateCountdown, 1000); // Restart logic after a short delay
      return;
    }

    const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
    const seconds = Math.floor((timeRemaining / 1000) % 60);

    // Display time in "Resets in: HH:MM:SS" format
    resetTimerElement.textContent = `Resets in: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Update the timer every second
  setInterval(updateCountdown, 1000);

  // Initial call to avoid delay
  updateCountdown();
}

// Start the countdown on page load
document.addEventListener("DOMContentLoaded", startResetCountdown);



