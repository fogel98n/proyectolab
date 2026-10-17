
const API_URL = "https://backend-ibl0.onrender.com";

const $ = (selector) => document.querySelector(selector);

const teacherPanel = $("#teacherPanel");
const studentPanel = $("#studentPanel");
const gamePanel = $("#gamePanel");

let teacherToken = null;
let studentToken = null;
let playerName = "";
let roomCode = "";
let questions = [];
let currentChallenge = 0;
let score = 0;
let answered = false;
let answering = false;
let gameFinished = false;

async function api(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token
      ? { Authorization: `Bearer ${options.token}` }
      : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method || "GET",
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Error del servidor (${response.status})`
    );
  }

  return data;
}

function getList(data, ...keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getOptions(question) {
  let options = question.options_json ?? question.options ?? [];

  if (typeof options === "string") {
    try {
      options = JSON.parse(options);
    } catch {
      options = [];
    }
  }

  return Array.isArray(options) ? options : [];
}

function showMessage(selector, message, isError = false) {
  const element = $(selector);
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff758b" : "";
}

function openPanel(panel) {
  [teacherPanel, studentPanel].forEach((item) => {
    item.classList.add("hidden");
  });

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

// ========================================
// PROFESOR: inicio de sesión y gestión
// ========================================

$("#teacherForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = event.submitter;
  const email = $("#teacherEmail").value.trim();
  const password = $("#teacherPassword").value;

  showMessage("#teacherMessage", "Verificando credenciales...");

  if (submitButton) submitButton.disabled = true;

  try {
    const result = await api("/teacher/login", {
      method: "POST",
      body: { email, password }
    });

    teacherToken = result.token;

    if (!teacherToken) {
      throw new Error("El servidor no devolvió el token de acceso.");
    }

    const teacher = result.teacher || {};

    showMessage(
      "#teacherMessage",
      `¡Bienvenido${teacher.name ? ", " + teacher.name : ""}! Sesión iniciada.`
    );

    showTeacherDashboard();
    await loadTeacherRooms();
  } catch (error) {
    showMessage("#teacherMessage", error.message, true);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

function showTeacherDashboard() {
  let dashboard = $("#teacherDashboard");

  if (!dashboard) {
    dashboard = document.createElement("div");
    dashboard.id = "teacherDashboard";
    dashboard.style.marginTop = "20px";

    const form = $("#teacherForm");
    form.insertAdjacentElement("afterend", dashboard);
  }

  dashboard.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Panel del profesor";

  const description = document.createElement("p");
  description.textContent =
    "Crea una partida y comparte su código con tus estudiantes.";

  const createButton = document.createElement("button");
  createButton.type = "button";
  createButton.className = "button button-primary full-button";
  createButton.textContent = "Crear nueva partida";

  const roomsHeading = document.createElement("h3");
  roomsHeading.textContent = "Mis partidas";

  const roomsList = document.createElement("div");
  roomsList.id = "teacherRooms";

  const message = document.createElement("p");
  message.id = "teacherDashboardMessage";
  message.className = "form-message";
  message.setAttribute("aria-live", "polite");

  createButton.addEventListener("click", async () => {
    createButton.disabled = true;
    showMessage("#teacherDashboardMessage", "Creando partida...");

    try {
      const result = await api("/rooms", {
        method: "POST",
        token: teacherToken,
        body: {}
      });

      const room = result.room || result;
      const code = room.code || result.code;

      if (!code) {
        throw new Error("La partida se creó, pero no recibimos su código.");
      }

      showMessage(
        "#teacherDashboardMessage",
        `Partida creada. Código: ${code}`
      );

      await loadTeacherRooms();
    } catch (error) {
      showMessage("#teacherDashboardMessage", error.message, true);
    } finally {
      createButton.disabled = false;
    }
  });

  dashboard.append(
    heading,
    description,
    createButton,
    roomsHeading,
    roomsList,
    message
  );
}

async function loadTeacherRooms() {
  const container = $("#teacherRooms");
  if (!container || !teacherToken) return;

  container.replaceChildren();

  try {
    const result = await api("/rooms", { token: teacherToken });
    const rooms = getList(result, "rooms", "data");

    if (!rooms.length) {
      container.textContent = "Todavía no tienes partidas.";
      return;
    }

    rooms.forEach((room) => {
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.marginTop = "10px";
      card.style.borderRadius = "10px";
      card.style.background = "rgba(127, 127, 127, 0.10)";

      const code = document.createElement("strong");
      code.textContent = `Código: ${room.code}`;

      const status = document.createElement("p");
      status.textContent =
        `Estado: ${room.status || "activo"} · ` +
        `Participantes: ${room.participant_count ?? room.participants_count ?? 0}`;

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "button button-secondary";
      copyButton.textContent = "Copiar código";

      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(String(room.code));
          copyButton.textContent = "¡Código copiado!";
        } catch {
          showMessage(
            "#teacherDashboardMessage",
            `Comparte este código: ${room.code}`
          );
        }
      });

      card.append(code, status, copyButton);
      container.appendChild(card);
    });
  } catch (error) {
    showMessage("#teacherDashboardMessage", error.message, true);
  }
}

// ========================================
// ESTUDIANTE: unirse a una partida real
// ========================================

$("#studentForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  playerName = $("#studentName").value.trim();
  roomCode = $("#roomCode").value.trim().toUpperCase();

  if (!playerName || !roomCode) return;

  const submitButton = event.submitter;
  if (submitButton) submitButton.disabled = true;

  showMessage("#studentMessage", "Conectando con la partida...");

  try {
    const result = await api(
      `/rooms/${encodeURIComponent(roomCode)}/join`,
      {
        method: "POST",
        body: { name: playerName }
      }
    );

    studentToken = result.token;

    if (!studentToken) {
      throw new Error("El servidor no devolvió el acceso del estudiante.");
    }

    const questionsResult = await api(
      `/rooms/${encodeURIComponent(roomCode)}/questions`,
      { token: studentToken }
    );

    questions = getList(questionsResult, "questions", "data");

    if (!questions.length) {
      throw new Error(
        "La partida no tiene preguntas disponibles. Pide al profesor que revise la configuración."
      );
    }

    questions = questions.map((question) => ({
      ...question,
      id: question.id ?? question.question_id,
      title: question.title || "Reto matemático",
      question: question.question || question.text || "",
      options: getOptions(question)
    }));

    if (questions.some((question) => !question.id || !question.options.length)) {
      throw new Error("Una pregunta no tiene identificador u opciones válidas.");
    }

    currentChallenge = 0;
    score = Number(result.participant?.score || 0);
    answered = false;
    answering = false;
    gameFinished = false;

    $("#playerGreeting").textContent =
      `¡Vamos, ${playerName}! Partida ${roomCode}.`;

    studentPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");

    renderChallenge();

    gamePanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    showMessage("#studentMessage", error.message, true);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// ========================================
// JUEGO: preguntas y respuestas del servidor
// ========================================

function renderChallenge() {
  if (currentChallenge >= questions.length) {
    showFinalResult();
    return;
  }

  const challenge = questions[currentChallenge];

  answered = false;
  answering = false;
  gameFinished = false;

  $("#levelPill").textContent =
    `NIVEL ${currentChallenge + 1} / ${questions.length}`;

  $("#challengeTitle").textContent = challenge.title;
  $("#challengeQuestion").textContent = challenge.question;
  $("#scoreLabel").textContent = `PUNTOS: ${score}`;
  $("#answerMessage").textContent = "";

  const nextButton = $("#nextLevel");
  nextButton.disabled = true;
  nextButton.textContent =
    currentChallenge === questions.length - 1
      ? "Ver resultado →"
      : "Siguiente reto →";

  const answersContainer = $("#answers");
  answersContainer.replaceChildren();

  challenge.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = String(option);
    button.addEventListener("click", () => checkAnswer(index, button));
    answersContainer.appendChild(button);
  });
}

async function checkAnswer(index, selectedButton) {
  if (answered || answering || gameFinished) return;

  answering = true;

  const challenge = questions[currentChallenge];
  const buttons = [...$("#answers").querySelectorAll("button")];

  buttons.forEach((button) => {
    button.disabled = true;
  });

  showMessage("#answerMessage", "Comprobando respuesta...");

  try {
    const result = await api(
      `/rooms/${encodeURIComponent(roomCode)}/answer`,
      {
        method: "POST",
        token: studentToken,
        body: {
          questionId: challenge.id,
          selectedIndex: index
        }
      }
    );

    answered = true;

    const isCorrect = Boolean(result.correct);
    const pointsAwarded = Number(result.pointsAwarded || 0);

    score = Number.isFinite(Number(result.totalScore))
      ? Number(result.totalScore)
      : score + pointsAwarded;

    if (isCorrect) {
      selectedButton.classList.add("correct");
    } else {
      selectedButton.classList.add("incorrect");

      // Si el backend proporciona el índice correcto, lo resaltamos.
      const correctIndex = result.correctIndex ?? result.correct_index;

      if (
        Number.isInteger(Number(correctIndex)) &&
        buttons[Number(correctIndex)]
      ) {
        buttons[Number(correctIndex)].classList.add("correct");
      }
    }

    const explanation = result.explanation || "";

    showMessage(
      "#answerMessage",
      `${isCorrect ? "¡Correcto!" : "Respuesta incorrecta."} ` +
      `${isCorrect ? `+${pointsAwarded} puntos. ` : ""}${explanation}`
    );

    $("#scoreLabel").textContent = `PUNTOS: ${score}`;
    $("#nextLevel").disabled = false;
  } catch (error) {
    buttons.forEach((button) => {
      button.disabled = false;
    });

    showMessage("#answerMessage", error.message, true);
  } finally {
    answering = false;
  }
}

$("#nextLevel").addEventListener("click", () => {
  if (gameFinished) {
    currentChallenge = 0;
    score = 0;
    gameFinished = false;
    renderChallenge();
    return;
  }

  if (!answered) return;

  if (currentChallenge < questions.length - 1) {
    currentChallenge++;
    renderChallenge();
  } else {
    showFinalResult();
  }
});

function showFinalResult() {
  gameFinished = true;

  $("#levelPill").textContent = "COMPLETADO";
  $("#challengeTitle").textContent = "¡Reto completado!";
  $("#challengeQuestion").textContent =
    `${playerName}, terminaste los ${questions.length} retos y obtuviste ${score} puntos.`;

  $("#answers").replaceChildren();

  showMessage(
    "#answerMessage",
    "Tu puntuación se ha registrado en la partida."
  );

  $("#scoreLabel").textContent = `PUNTOS: ${score}`;
  $("#nextLevel").textContent = "Jugar de nuevo ↻";
  $("#nextLevel").disabled = false;
}

// ========================================
// Comprobar disponibilidad de la API
// ========================================

api("/health")
  .then((result) => {
    console.log("PARABOLAB API conectada:", result);
  })
  .catch((error) => {
    console.error("No se pudo comprobar la API:", error.message);
  });
