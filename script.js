function csvToJSON(csv) {
  const lines = csv.split("\n");
  const result = [];
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i].split(",");

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    // Convert 'Value' and 'Answer' to numbers
    obj['Value'] = parseInt(obj['Value'], 10);
    obj['Answer'] = parseInt(obj['Answer'], 10);

    result.push(obj);
  }

  // Convert the array of objects to your desired JSON structure
  const groupedData = {};
  result.forEach(row => {
    if (!groupedData[row.Category]) {
      groupedData[row.Category] = {
        name: row.Category,
        questions: []
      };
    }
    groupedData[row.Category].questions.push({
      value: row.Value,
      question: row.Question,
      options: [row["Option A"], row["Option B"], row["Option C"], row["Option D"]],
      answer: row.Answer
    });
  });

  return Object.values(groupedData);
}

function loadQuestionsFromCSV(file) {
  return fetch(file)
    .then(response => response.text())
    .then(text => csvToJSON(text))
    .catch(error => {
      console.error("Error loading or parsing CSV:", error);
      return []; // Return an empty array in case of error
    });
}

// Global variables
let questions = [];
let score = 0;
let timeLeft = 0; // Add a variable for the timer
let timerInterval; // Variable to hold the timer interval

// Load questions (adjust the file path if necessary)
loadQuestionsFromCSV("questions.csv")
  .then((jsonData) => {
    if (jsonData.length > 0) {
      questions = jsonData;
      console.log("Questions loaded:", questions);
      setupGameBoard();
    } else {
      console.error("No questions loaded. Check your CSV file.");
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });

// Function to set up the game board
function setupGameBoard() {
  const board = document.getElementById("jeopardy-board");

  questions.forEach((category, catIndex) => {
    // Create category tile
    const categoryTile = document.createElement("div");
    categoryTile.classList.add("category-tile");
    categoryTile.textContent = category.name;
    board.appendChild(categoryTile);

    // Create question tiles for the category
    category.questions.forEach((question, questionIndex) => {
      const questionTile = document.createElement("div");
      questionTile.classList.add("question-tile");
      questionTile.textContent = question.value;
      questionTile.dataset.categoryId = catIndex;
      questionTile.dataset.questionId = questionIndex;
      questionTile.addEventListener("click", handleQuestionClick);
      board.appendChild(questionTile);
    });
  });
}

function handleQuestionClick(event) {
  const categoryId = event.target.dataset.categoryId;
  const questionId = event.target.dataset.questionId;
  const selectedQuestion = questions[categoryId].questions[questionId];

  // Mark the tile as selected
  event.target.classList.add("selected");
  event.target.removeEventListener("click", handleQuestionClick); // Prevent re-selection

  displayQuestion(selectedQuestion);

  // Check if all questions have been answered
  checkIfGameEnded();
}

function displayQuestion(question) {
  const modal = document.getElementById("question-modal");
  const questionText = document.getElementById("question-text");
  const answerOptions = document.getElementById("answer-options");
  const timerDisplay = document.getElementById("timer");

  // Clear previous question and options
  questionText.textContent = "";
  answerOptions.innerHTML = "";

  // Set question text
  questionText.textContent = question.question;

  // Create answer buttons
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => {
      clearInterval(timerInterval); // Stop the timer
      checkAnswer(question, index);
      modal.classList.add("hidden"); // Hide the modal after answering
    });
    answerOptions.appendChild(button);
  });

  // Reset and start the timer
  timeLeft = 15; // 15 seconds for each question
  timerDisplay.textContent = timeLeft;
  clearInterval(timerInterval); // Clear any existing interval
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);

  // Show the modal
  modal.classList.remove("hidden");
}

// Function to handle timeout
function handleTimeout() {
  alert("Time's up!");
  const modal = document.getElementById("question-modal");
  modal.classList.add("hidden"); // Hide the modal
  // You might want to mark the question as answered or deduct points here
}

function checkAnswer(question, selectedOptionIndex) {
  const feedback = document.createElement("div");
  feedback.style.position = "absolute";
  feedback.style.top = "50%";
  feedback.style.left = "50%";
  feedback.style.transform = "translate(-50%, -50%)";
  feedback.style.fontSize = "24px";
  feedback.style.fontWeight = "bold";
  feedback.style.color = "white";
  feedback.style.padding = "20px";
  feedback.style.borderRadius = "10px";
  feedback.style.zIndex = "11"; // Ensure it's above the modal
  document.body.appendChild(feedback);

  if (selectedOptionIndex === question.answer) {
    // Correct answer
    score += question.value;
    feedback.textContent = "Correct!";
    feedback.style.backgroundColor = "green";
  } else {
    // Incorrect answer
    feedback.textContent = "Incorrect";
    feedback.style.backgroundColor = "red";
  }

  // Update score display
  document.getElementById("score-value").textContent = score;

  // Remove feedback after a short delay
  setTimeout(() => {
    document.body.removeChild(feedback);
  }, 1000);
}

// Function to check if all questions have been answered
function checkIfGameEnded() {
    let allQuestionsAnswered = true;
    const questionTiles = document.querySelectorAll(".question-tile");

    questionTiles.forEach(tile => {
        if (!tile.classList.contains("selected")) {
            allQuestionsAnswered = false;
        }
    });

    if (allQuestionsAnswered) {
        endGame();
    }
}

// Function to end the game
function endGame() {
    // Display a game over message or perform other actions
    alert("Game Over! Final Score: " + score);
    // You might want to reset the game or offer an option to play again here
}
