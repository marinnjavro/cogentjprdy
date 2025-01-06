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
    obj["Value"] = parseInt(obj["Value"], 10);
    obj["Answer"] = parseInt(obj["Answer"], 10);

    result.push(obj);
  }

  // Convert the array of objects to your desired JSON structure
  const groupedData = {};
  result.forEach((row) => {
    if (!groupedData[row.Category]) {
      groupedData[row.Category] = {
        name: row.Category,
        questions: [],
      };
    }
    groupedData[row.Category].questions.push({
      value: row.Value,
      question: row.Question,
      options: [row["Option A"], row["Option B"], row["Option C"], row["Option D"]],
      answer: row.Answer,
    });
  });

  return Object.values(groupedData);
}

function loadQuestionsFromCSV(file) {
  return fetch(file)
    .then((response) => response.text())
    .then((text) => csvToJSON(text))
    .catch((error) => {
      console.error("Error loading or parsing CSV:", error);
      return []; // Return an empty array in case of error
    });
}

// Global variables
let questions = [];
let score = 0;
let timeLeft = 0; // Add a variable for the timer
let timerInterval; // Variable to hold the timer interval
let currentCategory = null; // Currently selected category
let selectedQuestions = []; // Array to track selected questions

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
  const categoryRow = document.getElementById("category-row");
  const questionsGrid = document.getElementById("questions-grid");
  questionsGrid.innerHTML = ""; // Clear any existing tiles

  questions.forEach((category) => {
    // Create category tile
    const categoryTile = document.createElement("div");
    categoryTile.classList.add("category-tile");
    categoryTile.textContent = category.name;
    categoryTile.addEventListener("click", () =>
      showQuestions(category.name)
    );
    categoryRow.appendChild(categoryTile);
  });
}

function showQuestions(categoryName) {
  currentCategory = categoryName; // Set the current category
  const questionsGrid = document.getElementById("questions-grid");
  questionsGrid.innerHTML = ""; // Clear existing tiles

  const category = questions.find((cat) => cat.name === categoryName);

  if (category) {
    category.questions.forEach((question, questionIndex) => {
      // Check if this question has already been selected
      const isSelected = selectedQuestions.some(
        (q) => q.category === categoryName && q.index === questionIndex
      );

      const questionTile = document.createElement("div");
      questionTile.classList.add("question-tile");
      if (!isSelected) {
        questionTile.textContent = question.value;
        questionTile.dataset.categoryId = categoryName;
        questionTile.dataset.questionId = questionIndex;
        questionTile.addEventListener("click", handleQuestionClick);
      } else {
        questionTile.classList.add("selected"); // Apply 'selected' class
        questionTile.textContent = ""; // Optionally clear the text
      }

      questionsGrid.appendChild(questionTile);
    });
  }
}

function handleQuestionClick(event) {
  const categoryId = currentCategory;
  const questionId = parseInt(event.target.dataset.questionId, 10);
  const selectedQuestion = questions
    .find((cat) => cat.name === categoryId)
    .questions.find((_, index) => index === questionId);

  // Mark the question as selected
  selectedQuestions.push({ category: categoryId, index: questionId });

  // Update the tile to show it has been selected
  const questionTile = event.target;
  questionTile.classList.add("selected");
  questionTile.textContent = ""; // Clear the points value
  questionTile.removeEventListener("click", handleQuestionClick);

  displayQuestion(selectedQuestion);
  checkIfCategoryComplete(categoryId);
}

function checkIfCategoryComplete(categoryId) {
  const categoryQuestions = questions.find(
    (cat) => cat.name === categoryId
  ).questions;
  const answeredQuestions = selectedQuestions.filter(
    (q) => q.category === categoryId
  );

  if (answeredQuestions.length === categoryQuestions.length) {
    // If all questions in the category are answered, remove the category tile
    const categoryTile = document.querySelector(
      `#category-row .category-tile[data-category-id="${categoryId}"]`
    );
    if (categoryTile) {
      categoryTile.remove();
    }
  }
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
  // Disable answer buttons to prevent multiple clicks
  const answerButtons = document.querySelectorAll("#answer-options button");
  answerButtons.forEach((button) => (button.disabled = true));

  // Create and display feedback
  const feedback = document.createElement("div");
  feedback.style.position = "absolute";
  feedback.style.top = "50%";
  feedback.style.left = "50%";
  feedback.style.transform = "translate(-50%, -50%)";
  feedback.style.fontSize = "24px";
  feedback
