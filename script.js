
const $ = (selector) => document.querySelector(selector);

const teacherPanel = $("#teacherPanel");
const studentPanel = $("#studentPanel");
const gamePanel = $("#gamePanel");

function openPanel(panel) {
  [teacherPanel, studentPanel].forEach((item) => item.classList.add("hidden"));
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
}

$("#showTeacher").addEventListener("click", () => openPanel(teacherPanel));
$("#showStudent").addEventListener("click", () => openPanel(studentPanel));

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".panel").classList.add("hidden");
  });
});

// Acceso docente de demostración.
// No sustituye una autenticación real en el servidor.
$("#teacherForm").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#teacherMessage").textContent =
    "La pantalla funciona. El acceso real requiere conectar el backend.";
});

// Retos de funciones cuadráticas.
const challenges = [
  {
    title: "Encuentra el vértice",
    question: "¿Cuál es el vértice de f(x) = x² - 4x + 3?",
    answers: ["(2, -1)", "(-2, 1)", "(4, 3)", "(2, 3)"],
    correct: 0,
    explanation: "El vértice es (2, -1). La coordenada x se calcula con -b/(2a)."
  },
  {
    title: "Transforma la parábola",
    question: "¿Qué transformación tiene f(x) = (x - 3)² + 2 respecto a y = x²?",
    answers: [
      "3 a la izquierda y 2 abajo",
      "3 a la derecha y 2 arriba",
      "3 a la derecha y 2 abajo",
      "3 a la izquierda y 2 arriba"
    ],
    correct: 1,
    explanation: "El -3 dentro del paréntesis desplaza a la derecha y el +2 la mueve hacia arriba."
  },
  {
    title: "Analiza la apertura",
    question: "En f(x) = -2x² + 5, ¿hacia dónde abre la parábola?",
    answers: [
      "Hacia arriba",
      "Hacia la derecha",
      "Hacia abajo",
      "No tiene parábola"
    ],
    correct: 2,
    explanation: "Como el coeficiente a = -2 es negativo, la parábola abre hacia abajo."
  },
  {
    title: "Calcula las raíces",
    question: "¿Cuáles son las raíces de f(x) = x² - 9?",
    answers: ["x = 9 y x = -9", "x = 3 y x = -3", "x = 0 y x = 9", "x = 3 solamente"],
    correct: 1,
    explanation: "x² - 9 = (x - 3)(x + 3), por eso las raíces son 3 y -3."
  }
];

let currentChallenge = 0;
let score = 0;
let answered = false;
let playerName = "";

$("#studentForm").addEventListener("submit", (event) => {
  event.preventDefault();

  playerName = $("#studentName").value.trim();
  const roomCode = $("#roomCode").value.trim().toUpperCase();

  if (!playerName || !roomCode) return;

  $("#studentMessage").textContent =
    "Modo de demostración: aún no hay conexión con una sala real.";

  // Permite probar el juego sin backend.
  $("#playerGreeting").textContent =
    `¡Vamos, ${playerName}! Completa los retos y demuestra lo que sabes.`;

  currentChallenge = 0;
  score = 0;
  studentPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
  renderChallenge();
  gamePanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

function renderChallenge() {
  const challenge = challenges[currentChallenge];
  answered = false;

  $("#levelPill").textContent =
    `NIVEL ${currentChallenge + 1} / ${challenges.length}`;
  $("#challengeTitle").textContent = challenge.title;
  $("#challengeQuestion").textContent = challenge.question;
  $("#scoreLabel").textContent = `PUNTOS: ${score}`;
  $("#answerMessage").textContent = "";
  $("#nextLevel").disabled = true;
  $("#nextLevel").textContent =
    currentChallenge === challenges.length - 1
      ? "Ver resultado →"
      : "Siguiente reto →";

  const answers = $("#answers");
  answers.replaceChildren();

  challenge.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = answer;
    button.addEventListener("click", () => checkAnswer(index, button));
    answers.appendChild(button);
  });
}

function checkAnswer(index, selectedButton) {
  if (answered) return;
  answered = true;

  const challenge = challenges[currentChallenge];
  const buttons = [...$("#answers").querySelectorAll("button")];

  buttons.forEach((button) => {
    button.disabled = true;
  });

  if (index === challenge.correct) {
    score += 100;
    selectedButton.classList.add("correct");
    $("#answerMessage").textContent = `¡Correcto! ${challenge.explanation}`;
  } else {
    selectedButton.classList.add("incorrect");
    buttons[challenge.correct].classList.add("correct");
    $("#answerMessage").textContent = `Casi. ${challenge.explanation}`;
  }

  $("#scoreLabel").textContent = `PUNTOS: ${score}`;
  $("#nextLevel").disabled = false;
}

$("#nextLevel").addEventListener("click", () => {
  if (currentChallenge < challenges.length - 1) {
    currentChallenge++;
    renderChallenge();
    return;
  }

  $("#challengeTitle").textContent = "¡Reto completado!";
  $("#challengeQuestion").textContent =
    `${playerName}, obtuviste ${score} de 400 puntos. ${
      score === 400
        ? "¡Excelente dominio de las funciones cuadráticas!"
        : "¡Sigue practicando para mejorar tu resultado!"
    }`;

  $("#answers").replaceChildren();
  $("#answerMessage").textContent = "Puedes volver a jugar cuando quieras.";
  $("#nextLevel").textContent = "Jugar de nuevo ↻";
  $("#nextLevel").disabled = false;

  $("#nextLevel").onclick = () => {
    currentChallenge = 0;
    score = 0;
    $("#nextLevel").onclick = null;
    renderChallenge();
  };
});
