import './style.css';
import luigi from '/assets/luigi.png';
import mario from '/assets/mario.png';
import wario from '/assets/wario.png';
import yoshi from '/assets/yoshi.png';


const gameArea = document.getElementById("game-area");
const clicksElement = document.getElementById("clicks");
const timeElement = document.getElementById("time");
const resultElement = document.getElementById("result");
const leaderboardTable = document.getElementById("leaderboard-table");
const submitScoreButton = document.getElementById("submit-score");
const playerNameInput = document.getElementById("player-name");
const errorMessage = document.getElementById("error-message");

let clicks = 0;
let startTime;
let timer;
let timeInterval;

const characters = ["mario", "wario", "yoshi"];
const spriteSpeed = 2; // Speed of movement (px per frame)
const totalSprites = 80; // Increased the number of sprites on screen
const bannedWords = ["badword1", "badword2", "offensive", "idiot"]; // List of banned words
let playerName = "";

// Set up leaderboard data in localStorage if it doesn't exist
if (!localStorage.getItem("leaderboard")) {
  localStorage.setItem("leaderboard", JSON.stringify([]));
}

// Load the leaderboard and check if the player has already submitted today
function loadLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard"));
  
  // Clear previous leaderboard data
  leaderboardTable.innerHTML = `<tr><th>Name</th><th>Time (s)</th><th>Clicks</th></tr>`;
  
  // Sort leaderboard by time and clicks (smaller time and fewer clicks are better)
  leaderboard.sort((a, b) => a.time - b.time || a.clicks - b.clicks);

  // Display the leaderboard
  leaderboard.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${entry.name}</td><td>${entry.time}</td><td>${entry.clicks}</td>`;
    leaderboardTable.appendChild(row);
  });
}

// Save the score to the leaderboard in localStorage
function saveScore() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard"));

  leaderboard.push({
    name: playerName,
    time: parseFloat((Date.now() - startTime) / 1000).toFixed(2),
    clicks: clicks,
  });

  // Sort leaderboard and keep the top 10
  leaderboard.sort((a, b) => a.time - b.time || a.clicks - b.clicks);
  if (leaderboard.length > 10) leaderboard.pop(); // Limit to top 10 scores

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  loadLeaderboard();
}

// Handle leaderboard submission
function submitScore() {
  playerName = playerNameInput.value.trim();

  // Check if player has already submitted today
  const lastSubmittedDate = localStorage.getItem("lastSubmittedDate");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  if (lastSubmittedDate === today) {
    errorMessage.textContent = "You can only submit once per day!";
    return;
  }

  // Check for banned words
  const hasBannedWord = bannedWords.some((word) => playerName.toLowerCase().includes(word));
  if (hasBannedWord) {
    errorMessage.textContent = "Your name contains banned words!";
    return;
  }

  // Save the score and update the last submitted date
  localStorage.setItem("lastSubmittedDate", today);
  saveScore();
  errorMessage.textContent = ""; // Clear error message
  playerNameInput.value = ""; // Clear input field
}

// Setup game logic
// Enable pointer events for sprites on setup
function setupGame() {
  clicks = 0;
  clicksElement.textContent = clicks;
  resultElement.textContent = "";
  startTime = Date.now();

  gameArea.innerHTML = "";

  const luigiIndex = Math.floor(Math.random() * totalSprites);

  for (let i = 0; i < totalSprites; i++) {
    const sprite = document.createElement("div");
    sprite.className = "character";

    if (i === luigiIndex) {
      sprite.style.backgroundImage = "url('assets/luigi.png')";
      sprite.dataset.character = "luigi";
      sprite.classList.add("active"); // Enable clicks for Luigi
    } else {
      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      sprite.style.backgroundImage = `url('assets/${randomCharacter}.png')`;
      sprite.dataset.character = randomCharacter;
    }

    sprite.style.left = `${Math.random() * 500}px`;
    sprite.style.top = `${Math.random() * 500}px`;

    const direction = {
      x: Math.random() > 0.5 ? spriteSpeed : -spriteSpeed,
      y: Math.random() > 0.5 ? spriteSpeed : -spriteSpeed,
    };
    sprite.dataset.direction = JSON.stringify(direction);

    sprite.addEventListener("click", handleClick);
    gameArea.appendChild(sprite);
  }

  timer = setInterval(updateSprites, 16);
  updateTime();
}

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

// Handle sprite clicks
function handleClick(e) {
  const clickedSprite = e.target;

  // Ensure the clicked sprite is valid
  if (!clickedSprite.classList.contains("character")) return;

  const character = clickedSprite.dataset.character;

  // Load the sprite into an offscreen canvas for transparency check
  const img = new Image();
  img.src = clickedSprite.style.backgroundImage.slice(5, -2); // Extract URL from "url()"

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match the sprite
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0);

    // Determine the relative click position within the sprite
    const rect = clickedSprite.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Get the pixel data at the clicked position
    const pixelData = ctx.getImageData(offsetX, offsetY, 1, 1).data;
    const alpha = pixelData[3]; // Alpha channel

    if (alpha > 0) {
      // Non-transparent click: Process the character logic
      clicks++;
      clicksElement.textContent = clicks;

      if (character === "luigi") {
        clearInterval(timer);
        clearInterval(timeInterval);

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        resultElement.textContent = `You found Luigi in ${clicks} clicks and ${elapsedTime}s! 🎉`;

        submitScoreButton.style.display = "block"; // Show submit button
      }
    }
  };
}



// Update timer display
function updateTime() {
  timeInterval = setInterval(() => {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    timeElement.textContent = elapsedTime;
  }, 100);
}

// Start the game
setupGame();
submitScoreButton.style.display = "none"; // Hide submit button initially
submitScoreButton.addEventListener("click", submitScore);

// Load leaderboard and check for daily reset
loadLeaderboard();

// Reload the game at midnight (reset leaderboard)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
    localStorage.removeItem("leaderboard");
    localStorage.removeItem("lastSubmittedDate");
    loadLeaderboard(); // Reset leaderboard display
  }
}, 1000);
