/**
 * ¿Cuánto conoces Oviedo Rural? - Juego Interactivo
 * Ayuntamiento de Oviedo
 */

// Estado del juego
const gameState = {
  level: 1,
  currentQuestion: 0,
  score: 0,
  lives: 3,
  correctAnswers: 0,
  startTime: null,
  timer: null,
  timerInterval: null,
  parishesData: null
};

// Configuración por nivel
const levelConfig = {
  1: { name: 'Explorador', questionsPerLevel: 20, timeLimit: 0, pointsPerCorrect: 100 },
  2: { name: 'Conocedor', questionsPerLevel: 20, timeLimit: 30, pointsPerCorrect: 200 },
  3: { name: 'Experto', questionsPerLevel: 20, timeLimit: 20, pointsPerCorrect: 300 }
};

// Elementos DOM
const screens = {
  start: document.getElementById('screenStart'),
  game: document.getElementById('screenGame'),
  end: document.getElementById('screenEnd')
};

// Inicialización
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Cargar datos de parroquias
  await loadParishesData();
  
  // Cargar récord
  loadRecord();
  
  // Event listeners
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => startGame(parseInt(btn.dataset.level)));
  });
  
  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    startGame(gameState.level);
  });
  
  document.getElementById('btnChangeLevel').addEventListener('click', showStartScreen);
}

async function loadParishesData() {
  try {
    const [parishesResponse, waypointsResponse] = await Promise.all([
      fetch('assets/data/parroquias.json'),
      fetch('assets/data/waypoints.json')
    ]);
    
    gameState.parishesData = await parishesResponse.json();
    const waypointsData = await waypointsResponse.json();
    
    // Extraer waypoints de todas las parroquias
    gameState.waypointsData = [];
    waypointsData.forEach(parishGroup => {
      if (parishGroup.waypoints && parishGroup.waypoints.length > 0) {
        parishGroup.waypoints.forEach(wp => {
          gameState.waypointsData.push({
            title: wp.title,
            desc: wp.desc,
            images: wp.images,
            parish: parishGroup.parish
          });
        });
      }
    });
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

function loadRecord() {
  const record = localStorage.getItem('oviedoRuralRecord') || 0;
  document.getElementById('recordScore').textContent = record;
}

function saveRecord(score) {
  const currentRecord = parseInt(localStorage.getItem('oviedoRuralRecord') || 0);
  if (score > currentRecord) {
    localStorage.setItem('oviedoRuralRecord', score);
    return true;
  }
  return false;
}

// Pantallas
function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function showStartScreen() {
  showScreen('start');
  loadRecord();
}

function startGame(level) {
  gameState.level = level;
  gameState.currentQuestion = 0;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.correctAnswers = 0;
  gameState.startTime = Date.now();
  gameState.usedQuestions = [];
  
  // Resetear vidas
  document.querySelectorAll('.heart').forEach(h => h.classList.remove('lost'));
  
  // Actualizar UI
  document.getElementById('currentLevel').textContent = level;
  document.getElementById('currentScore').textContent = 0;
  
  // Mostrar/ocultar timer según nivel
  const timerEl = document.getElementById('timer');
  if (levelConfig[level].timeLimit > 0) {
    timerEl.style.display = 'flex';
  } else {
    timerEl.style.display = 'none';
  }
  
  showScreen('game');
  nextQuestion();
}

function nextQuestion() {
  if (gameState.currentQuestion >= levelConfig[gameState.level].questionsPerLevel) {
    endGame();
    return;
  }
  
  if (gameState.lives <= 0) {
    endGame();
    return;
  }
  
  gameState.currentQuestion++;
  document.getElementById('currentQuestion').textContent = gameState.currentQuestion;
  
  // Generar pregunta según tipo
  const question = generateQuestion(gameState.level);
  renderQuestion(question);
  
  // Iniciar timer si corresponde
  if (levelConfig[gameState.level].timeLimit > 0) {
    startTimer();
  }
}

// Banco de preguntas Nivel 1
const level1Questions = [
  {
    question: "¿En qué parroquia se ubica el principal complejo termal histórico del concejo de Oviedo?",
    options: ["Trubia", "La Manjoya", "Las Caldas", "San Claudio"],
    correct: "Las Caldas"
  },
  {
    question: "¿Dónde se localiza la histórica Fábrica de Armas vinculada al desarrollo industrial del siglo XIX?",
    options: ["Olloniego", "Trubia", "Tudela Veguín", "Colloto"],
    correct: "Trubia"
  },
  {
    question: "¿En qué parroquia se sitúa una de las principales industrias cementeras del concejo?",
    options: ["San Claudio", "Tudela Veguín", "Olloniego", "Bendones"],
    correct: "Tudela Veguín"
  },
  {
    question: "¿Qué parroquia del este del concejo mantiene continuidad urbana con el municipio de Siero?",
    options: ["Las Caldas", "La Manjoya", "Colloto", "Trubia"],
    correct: "Colloto"
  },
  {
    question: "¿Qué parroquia se desarrolló históricamente en torno a un importante eje fluvial del concejo?",
    options: ["Trubia", "La Manjoya", "San Claudio", "Bendones"],
    correct: "Trubia"
  },
  {
    question: "¿En qué parroquia se conserva una iglesia prerrománica declarada Bien de Interés Cultural?",
    options: ["Bendones", "La Manjoya", "Olloniego", "Trubia"],
    correct: "Bendones"
  },
  {
    question: "¿Qué parroquia tuvo especial relevancia por su actividad minera e industrial como enclave estratégico de paso?",
    options: ["Olloniego", "Las Caldas", "Bendones", "Colloto"],
    correct: "Olloniego"
  },
  {
    question: "¿Dónde se desarrolló una importante tradición cerámica vinculada a la fabricación de loza?",
    options: ["San Claudio", "Las Caldas", "Colloto", "La Manjoya"],
    correct: "San Claudio"
  },
  {
    question: "¿Qué parroquia del sur del concejo combina entorno natural con proximidad inmediata a la ciudad de Oviedo?",
    options: ["La Manjoya", "Trubia", "Olloniego", "Tudela Veguín"],
    correct: "La Manjoya"
  },
  {
    question: "¿En qué parroquia se encuentra un destacado conjunto arquitectónico vinculado al termalismo y al patrimonio histórico?",
    options: ["Las Caldas", "Olloniego", "San Claudio", "Colloto"],
    correct: "Las Caldas"
  },
  {
    question: "¿Qué parroquia se sitúa en el acceso suroeste del concejo por carretera nacional histórica?",
    options: ["Colloto", "Olloniego", "Bendones", "La Manjoya"],
    correct: "Olloniego"
  },
  {
    question: "¿En qué parroquia se inicia una de las sendas verdes más conocidas del centro de Asturias hacia el occidente?",
    options: ["Trubia", "Las Caldas", "San Claudio", "Tudela Veguín"],
    correct: "Trubia"
  },
  {
    question: "¿Qué parroquia destaca por su patrimonio industrial del siglo XIX vinculado a la metalurgia?",
    options: ["Trubia", "Bendones", "La Manjoya", "Las Caldas"],
    correct: "Trubia"
  },
  {
    question: "¿En qué parroquia se conserva patrimonio religioso de origen altomedieval en entorno rural?",
    options: ["Bendones", "Colloto", "San Claudio", "Tudela Veguín"],
    correct: "Bendones"
  },
  {
    question: "¿Qué parroquia combina tradición industrial y proximidad a importantes infraestructuras de comunicación?",
    options: ["San Claudio", "Las Caldas", "Bendones", "La Manjoya"],
    correct: "San Claudio"
  },
  {
    question: "¿En qué parroquia se ubica una histórica zona de paso estratégico hacia el occidente asturiano?",
    options: ["Olloniego", "Colloto", "Bendones", "La Manjoya"],
    correct: "Olloniego"
  },
  {
    question: "¿Qué parroquia está vinculada al desarrollo ferroviario hacia el occidente del Principado?",
    options: ["Trubia", "Las Caldas", "Tudela Veguín", "Bendones"],
    correct: "Trubia"
  },
  {
    question: "¿En qué parroquia se sitúa un importante enclave industrial relacionado con la producción de materiales de construcción?",
    options: ["Tudela Veguín", "San Claudio", "Olloniego", "Colloto"],
    correct: "Tudela Veguín"
  },
  {
    question: "¿Qué parroquia destaca por su entorno rural tradicional y cercanía inmediata al casco urbano de Oviedo?",
    options: ["La Manjoya", "Trubia", "Olloniego", "Bendones"],
    correct: "La Manjoya"
  },
  {
    question: "¿En qué parroquia se encuentra uno de los principales enclaves termales históricos del centro de Asturias?",
    options: ["Las Caldas", "Colloto", "San Claudio", "Olloniego"],
    correct: "Las Caldas"
  }
];

function generateQuestion(level) {
  if (level === 1) {
    // Nivel 1: usar preguntas fijas
    const availableQuestions = level1Questions.filter((q, index) => {
      return !gameState.usedQuestions || !gameState.usedQuestions.includes(index);
    });
    
    if (availableQuestions.length === 0) {
      gameState.usedQuestions = [];
      return generateQuestion(level);
    }
    
    const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const originalIndex = level1Questions.indexOf(questionData);
    
    if (!gameState.usedQuestions) gameState.usedQuestions = [];
    gameState.usedQuestions.push(originalIndex);
    
    return {
      type: 'trivial',
      question: questionData.question,
      options: questionData.options,
      correct: questionData.correct
    };
  } else {
    // Niveles 2 y 3: generar preguntas variadas
    const parishes = gameState.parishesData;
    const types = getQuestionTypesForLevel(level);
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch(type) {
      case 'trivial':
        return generateTrivialQuestion(parishes, level);
      case 'image':
        return generateImageQuestion(parishes, level);
      case 'clues':
        return generateCluesQuestion(parishes, level);
      default:
        return generateTrivialQuestion(parishes, level);
    }
  }
}

function getQuestionTypesForLevel(level) {
  switch(level) {
    case 1:
      return ['trivial', 'image', 'clues'];
    case 2:
      return ['trivial', 'image', 'clues'];
    case 3:
      return ['trivial', 'image', 'clues'];
    default:
      return ['trivial'];
  }
}

// Generar pregunta tipo trivial
function generateTrivialQuestion(parishes, level) {
  const parish = parishes[Math.floor(Math.random() * parishes.length)];
  const questions = extractTrivialFromParish(parish);
  const question = questions[Math.floor(Math.random() * questions.length)];
  
  // Generar opciones incorrectas
  const incorrectOptions = [];
  while (incorrectOptions.length < (level === 3 ? 1 : level === 2 ? 2 : 3)) {
    const randomParish = parishes[Math.floor(Math.random() * parishes.length)];
    if (randomParish.name !== parish.name && !incorrectOptions.includes(randomParish.name)) {
      incorrectOptions.push(randomParish.name);
    }
  }
  
  const options = [parish.name, ...incorrectOptions].sort(() => Math.random() - 0.5);
  
  return {
    type: 'trivial',
    question: question.text,
    options: options,
    correct: parish.name
  };
}

function extractTrivialFromParish(parish) {
  const questions = [];
  const desc = parish.desc_md;
  
  // Extraer festividades específicas
  const festivitiesMatch = desc.match(/(\d+)\s+de\s+(\w+)\s+se\s+celebra[n]?\s+([^.]+)/gi);
  if (festivitiesMatch && festivitiesMatch.length > 0) {
    const festivity = festivitiesMatch[0];
    const monthMatch = festivity.match(/de\s+(\w+)/);
    if (monthMatch) {
      questions.push({
        text: `¿En qué parroquia se celebran festividades en el mes de ${monthMatch[1]}?`,
        answer: parish.name
      });
    }
  }
  
  // Extraer datos históricos específicos con siglo
  const centuryMatch = desc.match(/siglo\s+(X{1,3}V?I{0,3})/gi);
  if (centuryMatch && centuryMatch.length > 0) {
    questions.push({
      text: `¿Qué parroquia tiene patrimonio histórico del ${centuryMatch[0]}?`,
      answer: parish.name
    });
  }
  
  // Extraer ubicación con cuadrante específico
  if (desc.includes('cuadrante noroccidental')) {
    questions.push({
      text: `¿Qué parroquia se encuentra en el cuadrante noroccidental del concejo?`,
      answer: parish.name
    });
  } else if (desc.includes('cuadrante nororiental')) {
    questions.push({
      text: `¿Qué parroquia se encuentra en el cuadrante nororiental del concejo?`,
      answer: parish.name
    });
  } else if (desc.includes('cuadrante suroccidental')) {
    questions.push({
      text: `¿Qué parroquia se encuentra en el cuadrante suroccidental del concejo?`,
      answer: parish.name
    });
  } else if (desc.includes('cuadrante suroriental')) {
    questions.push({
      text: `¿Qué parroquia se encuentra en el cuadrante suroriental del concejo?`,
      answer: parish.name
    });
  }
  
  // Extraer puntos de interés específicos con BIC o IPCA
  const bicMatch = desc.match(/<u>([^<]+)<\/u>\s*\(BIC\)/);
  if (bicMatch) {
    const poi = bicMatch[1].trim();
    questions.push({
      text: `¿Dónde se encuentra ${poi} declarado Bien de Interés Cultural?`,
      answer: parish.name
    });
  }
  
  const ipcaMatch = desc.match(/<u>([^<]+)<\/u>\s*\(IPCA\)/);
  if (ipcaMatch) {
    const poi = ipcaMatch[1].trim();
    questions.push({
      text: `¿En qué parroquia está catalogado ${poi}?`,
      answer: parish.name
    });
  }
  
  // Extraer características únicas específicas
  if (desc.includes('Pueblo Ejemplar') || desc.includes('pueblo ejemplar')) {
    const yearMatch = desc.match(/año\s+(\d{4})/);
    if (yearMatch) {
      questions.push({
        text: `¿Qué parroquia fue nombrada Pueblo Ejemplar en el año ${yearMatch[1]}?`,
        answer: parish.name
      });
    }
  }
  
  // Extraer nombres de lugares/entidades
  const entitiesMatch = desc.match(/## Entidades de población\s*\n([^\n#]+)/);
  if (entitiesMatch) {
    const entities = entitiesMatch[1].split(',').map(e => e.trim());
    if (entities.length > 0) {
      const randomEntity = entities[Math.floor(Math.random() * entities.length)];
      questions.push({
        text: `¿A qué parroquia pertenece la localidad de ${randomEntity}?`,
        answer: parish.name
      });
    }
  }
  
  // Preguntas genéricas como fallback
  questions.push({
    text: `¿Cuál de estas es una parroquia rural de Oviedo?`,
    answer: parish.name
  });
  
  questions.push({
    text: `¿Qué parroquia forma parte del rural ovetense?`,
    answer: parish.name
  });
  
  return questions;
}

// Generar pregunta de imagen
function generateImageQuestion(parishes, level) {
  // Niveles 2 y 3: usar waypoints que tienen mejores imágenes y descripciones
  if (level >= 2 && gameState.waypointsData && gameState.waypointsData.length > 0) {
    const waypointsWithImages = gameState.waypointsData.filter(wp => wp.images && wp.images.length > 0);
    const waypoint = waypointsWithImages[Math.floor(Math.random() * waypointsWithImages.length)];
    
    // Cambiar extensión a .jpg
    const imageWithJpg = waypoint.images[0].replace('.png', '.jpg');
    
    // Generar opciones (parroquias cercanas)
    const incorrectOptions = [];
    const allParishes = parishes.map(p => p.name);
    
    while (incorrectOptions.length < (level === 3 ? 1 : 2)) {
      const randomParish = allParishes[Math.floor(Math.random() * allParishes.length)];
      if (randomParish !== waypoint.parish && !incorrectOptions.includes(randomParish)) {
        incorrectOptions.push(randomParish);
      }
    }
    
    const options = [waypoint.parish, ...incorrectOptions].sort(() => Math.random() - 0.5);
    
    return {
      type: 'image',
      question: `¿En qué parroquia se encuentra ${waypoint.title}?`,
      image: imageWithJpg,
      options: options,
      correct: waypoint.parish
    };
  } else {
    // Nivel 1: usar imágenes de parroquias
    const parishesWithImages = parishes.filter(p => p.images && p.images.length > 0);
    const parish = parishesWithImages[Math.floor(Math.random() * parishesWithImages.length)];
    
    // Cambiar extensión a .jpg
    const imageWithJpg = parish.images[Math.floor(Math.random() * parish.images.length)].replace('.png', '.jpg');
    
    // Generar opciones
    const incorrectOptions = [];
    while (incorrectOptions.length < 3) {
      const randomParish = parishes[Math.floor(Math.random() * parishes.length)];
      if (randomParish.name !== parish.name && !incorrectOptions.includes(randomParish.name)) {
        incorrectOptions.push(randomParish.name);
      }
    }
    
    const options = [parish.name, ...incorrectOptions].sort(() => Math.random() - 0.5);
    
    return {
      type: 'image',
      question: '¿A qué parroquia pertenece esta imagen?',
      image: imageWithJpg,
      options: options,
      correct: parish.name
    };
  }
}

// Generar pregunta con pistas
function generateCluesQuestion(parishes, level) {
  const parish = parishes[Math.floor(Math.random() * parishes.length)];
  const clues = extractCluesFromParish(parish);
  
  // Generar opciones
  const incorrectOptions = [];
  while (incorrectOptions.length < (level === 3 ? 1 : level === 2 ? 2 : 3)) {
    const randomParish = parishes[Math.floor(Math.random() * parishes.length)];
    if (randomParish.name !== parish.name && !incorrectOptions.includes(randomParish.name)) {
      incorrectOptions.push(randomParish.name);
    }
  }
  
  const options = [parish.name, ...incorrectOptions].sort(() => Math.random() - 0.5);
  
  return {
    type: 'clues',
    question: '¿De qué parroquia se trata?',
    clues: clues,
    options: options,
    correct: parish.name
  };
}

function extractCluesFromParish(parish) {
  const clues = [];
  const desc = parish.desc_md;
  
  // Pista 1: Ubicación (fácil)
  const locationMatch = desc.match(/## Localización\s*\n([^\n#]+)/);
  if (locationMatch) {
    clues.push(locationMatch[1].trim());
  } else if (desc.includes('cuadrante')) {
    const quadrantMatch = desc.match(/cuadrante\s+([^\n.]+)/i);
    if (quadrantMatch) {
      clues.push(`Se ubica en el ${quadrantMatch[0]}`);
    }
  }
  
  // Pista 2: Características o límites (media)
  const limitsMatch = desc.match(/## Límites\s*\n([^\n#]+)/);
  if (limitsMatch) {
    const limitText = limitsMatch[1].trim();
    const firstLimit = limitText.split(',')[0];
    clues.push(firstLimit);
  } else {
    // Buscar festividades como pista alternativa
    const festivityMatch = desc.match(/se celebra[n]?\s+([^.]+)/i);
    if (festivityMatch) {
      clues.push(`Celebra festividades como ${festivityMatch[1]}`);
    }
  }
  
  // Pista 3: Punto de interés o dato destacado (difícil)
  const poiMatch = desc.match(/<u>([^<]+)<\/u>/);
  if (poiMatch) {
    const poi = poiMatch[1].replace(/\(IPCA\)|\(BIC\)/g, '').trim();
    clues.push(`Tiene entre su patrimonio ${poi}`);
  } else {
    // Usar primer dato destacado
    const dataMatch = desc.match(/## Datos a destacar\s*\n-\s*([^\n]+)/);
    if (dataMatch) {
      clues.push(dataMatch[1].trim());
    }
  }
  
  // Asegurar que siempre haya 3 pistas
  while (clues.length < 3) {
    if (clues.length === 0) {
      clues.push('Es una parroquia rural del concejo de Oviedo');
    } else if (clues.length === 1) {
      const surfaceMatch = desc.match(/##\s*Superficie\s*\n([\d,]+)\s*km/);
      if (surfaceMatch) {
        clues.push(`Tiene una superficie de ${surfaceMatch[1]} km²`);
      } else {
        clues.push('Forma parte del territorio rural histórico');
      }
    } else {
      clues.push('Conserva patrimonio y tradición rural asturiana');
    }
  }
  
  return clues.slice(0, 3);
}

// Renderizar pregunta
function renderQuestion(question) {
  const container = document.getElementById('questionContainer');
  
  switch(question.type) {
    case 'trivial':
      container.innerHTML = renderTrivialQuestion(question);
      break;
    case 'image':
      container.innerHTML = renderImageQuestion(question);
      break;
    case 'clues':
      container.innerHTML = renderCluesQuestion(question);
      initCluesQuestion(question);
      break;
  }
  
  // Event listeners para opciones
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => checkAnswer(btn.textContent.trim(), question.correct));
  });
}

function renderTrivialQuestion(question) {
  return `
    <div class="question-type">💭 Pregunta</div>
    <h3 class="question-text">${question.question}</h3>
    <div class="options">
      ${question.options.map(opt => `
        <button class="option-btn">${opt}</button>
      `).join('')}
    </div>
  `;
}

function renderImageQuestion(question) {
  return `
    <div class="question-type">🖼️ Identifica la imagen</div>
    <h3 class="question-text">${question.question}</h3>
    <img src="${question.image}" alt="Imagen de parroquia" class="question-image">
    <div class="options">
      ${question.options.map(opt => `
        <button class="option-btn">${opt}</button>
      `).join('')}
    </div>
  `;
}

function renderCluesQuestion(question) {
  return `
    <div class="question-type">🔍 Adivina con pistas</div>
    <h3 class="question-text">${question.question}</h3>
    <div class="clues-container" id="cluesContainer">
      <!-- Las pistas se mostrarán progresivamente -->
    </div>
    <div class="options">
      ${question.options.map(opt => `
        <button class="option-btn">${opt}</button>
      `).join('')}
    </div>
  `;
}


function initCluesQuestion(question) {
  const container = document.getElementById('cluesContainer');
  let clueIndex = 0;
  
  // Mostrar primera pista inmediatamente
  showClue(container, question.clues[0], clueIndex);
  clueIndex++;
  
  // Mostrar pistas progresivamente cada 5 segundos
  const clueInterval = setInterval(() => {
    if (clueIndex < question.clues.length) {
      showClue(container, question.clues[clueIndex], clueIndex);
      clueIndex++;
    } else {
      clearInterval(clueInterval);
    }
  }, 5000);
  
  // Limpiar intervalo al cambiar de pregunta
  gameState.clueInterval = clueInterval;
}

function showClue(container, clueText, index) {
  const clueEl = document.createElement('div');
  clueEl.className = 'clue';
  clueEl.innerHTML = `
    <div class="clue-label">Pista ${index + 1}</div>
    <div class="clue-text">${clueText}</div>
  `;
  container.appendChild(clueEl);
}

// Timer
function startTimer() {
  const timeLimit = levelConfig[gameState.level].timeLimit;
  gameState.timer = timeLimit;
  
  const timerValue = document.getElementById('timerValue');
  timerValue.textContent = timeLimit;
  timerValue.classList.remove('warning');
  
  gameState.timerInterval = setInterval(() => {
    gameState.timer--;
    timerValue.textContent = gameState.timer;
    
    if (gameState.timer <= 5) {
      timerValue.classList.add('warning');
    }
    
    if (gameState.timer <= 0) {
      clearInterval(gameState.timerInterval);
      timeOut();
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
  }
  if (gameState.clueInterval) {
    clearInterval(gameState.clueInterval);
  }
}

function timeOut() {
  loseLife();
  setTimeout(() => {
    if (gameState.lives > 0) {
      nextQuestion();
    }
  }, 1500);
}

// Verificar respuesta
function checkAnswer(answer, correct) {
  stopTimer();
  
  const isCorrect = answer === correct;
  
  // Desactivar botones
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    
    if (btn.textContent.trim() === correct) {
      btn.classList.add('correct');
    } else if (btn.textContent.trim() === answer && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });
  
  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    handleIncorrectAnswer();
  }
  
  // Siguiente pregunta después de feedback
  setTimeout(() => {
    nextQuestion();
  }, 2000);
}

function handleCorrectAnswer() {
  gameState.correctAnswers++;
  const points = levelConfig[gameState.level].pointsPerCorrect;
  gameState.score += points;
  
  document.getElementById('currentScore').textContent = gameState.score;
  
  // Feedback visual
  showFeedback('¡Correcto! +' + points, 'success');
}

function handleIncorrectAnswer() {
  loseLife();
  showFeedback('Incorrecto', 'error');
}

function loseLife() {
  gameState.lives--;
  const hearts = document.querySelectorAll('.heart');
  hearts[gameState.lives].classList.add('lost');
}

function showFeedback(message, type) {
  // Feedback visual simple
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 40px;
    background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
    color: white;
    border-radius: 12px;
    font-size: 1.5rem;
    font-weight: 700;
    z-index: 1000;
    animation: feedbackPop 0.6s ease;
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// Finalizar juego
function endGame() {
  stopTimer();
  
  const totalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  
  // Actualizar pantalla final
  document.getElementById('finalScore').textContent = gameState.score;
  document.getElementById('finalCorrect').textContent = gameState.correctAnswers;
  document.getElementById('finalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Verificar si es nuevo récord
  const isNewRecord = saveRecord(gameState.score);
  const badgeEl = document.getElementById('endBadge');
  
  if (isNewRecord) {
    badgeEl.style.display = 'flex';
  } else {
    badgeEl.style.display = 'none';
  }
  
  // Personalizar mensaje según resultado
  const config = levelConfig[gameState.level];
  const percentage = (gameState.correctAnswers / config.questionsPerLevel) * 100;
  
  const endIcon = document.getElementById('endIcon');
  const endTitle = document.getElementById('endTitle');
  const endMessage = document.getElementById('endMessage');
  
  if (percentage === 100) {
    endIcon.textContent = '🏆';
    endTitle.textContent = '¡Perfecto!';
    endMessage.textContent = `Has completado el nivel ${config.name} sin fallos`;
  } else if (percentage >= 70) {
    endIcon.textContent = '🎉';
    endTitle.textContent = '¡Muy bien!';
    endMessage.textContent = `Has superado el nivel ${config.name}`;
  } else if (percentage >= 50) {
    endIcon.textContent = '👍';
    endTitle.textContent = '¡Buen intento!';
    endMessage.textContent = `Has completado el nivel ${config.name}`;
  } else {
    endIcon.textContent = '💪';
    endTitle.textContent = '¡Sigue intentando!';
    endMessage.textContent = 'Puedes mejorar tu puntuación';
  }
  
  showScreen('end');
}
