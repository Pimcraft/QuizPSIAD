// main.js

let allTasks = [];          // Wszystkie pytania z zadania.json
let selectedTasks = [];     // Wylosowana pula spośród allTasks
let preparedTasks = [];     // Kopie z ewentualnie potasowanymi steps (tylko dla order)
let currentIndex = 0;       // Indeks bieżącego pytania
let totalSeconds = 15 * 60; // 15 minut
let timerInterval = null;
let usedSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
    document.getElementById('next-btn').addEventListener('click', goNextQuestion);
    document.getElementById('prev-btn').addEventListener('click', goPrevQuestion);
    document.getElementById('finish-btn').addEventListener('click', finishQuiz);
    document.getElementById('restart-btn').addEventListener('click', () => {
        location.reload();
    });
});

/**
 * startQuiz():
 *  1) Wczytuje zadania
 *  2) Pozwala userowi wybrać liczbę pytań
 *  3) Losuje, kopiuje do preparedTasks
 */
function startQuiz() {
    fetch('zadania.json')
        .then(r => r.json())
        .then(data => {
            allTasks = data;
            shuffleArray(allTasks);

            // Ile pytań user chce
            const questionCountEl = document.getElementById('question-count');
            let countVal = parseInt(questionCountEl.value, 10) || 10;
            if (countVal > allTasks.length) {
                countVal = allTasks.length;
            }

            // Bierzemy countVal zadań
            selectedTasks = allTasks.slice(0, countVal);

            // Tworzymy preparedTasks (kopie)
            preparedTasks = selectedTasks.map(task => createPreparedTask(task));

            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('quiz-screen').style.display = 'block';

            currentIndex = 0;
            renderQuestion(currentIndex);

            updateCountdown();
            timerInterval = setInterval(updateCountdown, 1000);
        })
        .catch(err => console.error("Błąd wczytywania zadań", err));
}

/**
 * createPreparedTask(task):
 *  Tworzy głęboką kopię obiektu zadania,
 *  a jeśli type=order, tasuje steps w kopii,
 *  by user miał inną kolejność, nie psując correct.
 */
function createPreparedTask(task) {
    // Głęboka kopia (można użyć structuredClone w nowym JS, 
    //  ale tu zrobimy prosto)
    let copy = JSON.parse(JSON.stringify(task));

    // Jeśli order, tasujemy copy.steps, 
    //  correct zostaje oryginalne (kolejność właściwa)
    if (copy.type === 'order' && Array.isArray(copy.steps)) {
        shuffleArray(copy.steps);
    }

    return copy;
}
function simulateMouseFromTouch(e, type) {
    if (e.touches.length > 1) return; // tylko pojedynczy dotyk
    const touch = e.changedTouches[0];
    const simulatedEvent = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    touch.target.dispatchEvent(simulatedEvent);
    e.preventDefault();
}

/**
 * renderQuestion(qIndex):
 *  Wyświetla pytanie z preparedTasks[qIndex].
 */
function renderQuestion(qIndex) {
    const container = document.getElementById('question-container');
    container.innerHTML = '';

    const task = preparedTasks[qIndex]; // UŻYWAMY preparedTasks

    let titleDiv = document.createElement('div');
    titleDiv.classList.add('question-title');
    titleDiv.textContent = `Pytanie ${qIndex + 1}/${preparedTasks.length}: ${task.question}`;
    container.appendChild(titleDiv);

    // Rysujemy w zależności od type
    if (task.type === 'simple_select' || task.type === 'advenced_simple_select'
        || task.type === 'practical_example' || task.type === 'causal_reasoning_select') {
        renderSingleCheckboxGroup(container, task, qIndex);
    }
    else if (task.type === 'multi_select') {
        renderMultiCheckboxGroup(container, task, qIndex);
    }
    else if (task.type === 'definition_typeA' || task.type === 'definition_typeB') {
        renderDefinitionCheckboxGroup(container, task, qIndex);
    }
    else if (task.type === 'order') {
        console.log('[DEBUG] renderOrderDragDrop będzie wywołane', task);
        renderOrderDragDrop(container, task, qIndex);
    }

    // Przyciski
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');

    if (qIndex === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }
    if (qIndex === preparedTasks.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
    }

    nextBtn.disabled = true;
    finishBtn.disabled = true;

    setupAnswerCheck(qIndex);
}

/** Rysowanie single (bez tasowania opcji), checkboxy */
function renderSingleCheckboxGroup(container, task, qIndex) {
    let fieldset = document.createElement('div');
    let optionsKeys = Object.keys(task.options);
    optionsKeys.forEach(key => {
        let textVal = task.options[key];

        let label = document.createElement('label');
        label.style.display = 'block';

        let cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.name = `single-${qIndex}`;
        cb.value = key;
        cb.dataset.fullText = textVal;

        // Emulacja radio
        cb.addEventListener('change', () => {
            if (cb.checked) {
                let siblings = fieldset.querySelectorAll(`input[name="single-${qIndex}"]`);
                siblings.forEach(s => {
                    if (s !== cb) s.checked = false;
                });
            }
        });

        label.appendChild(cb);
        label.append(` ${key}) ${textVal}`);
        fieldset.appendChild(label);
    });
    container.appendChild(fieldset);
}

/** multi_select */
function renderMultiCheckboxGroup(container, task, qIndex) {
    let fieldset = document.createElement('div');
    let optionsKeys = Object.keys(task.options);
    optionsKeys.forEach(key => {
        let textVal = task.options[key];

        let label = document.createElement('label');
        label.style.display = 'block';

        let cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.name = `multi-${qIndex}[]`;
        cb.value = key;
        cb.dataset.fullText = textVal;

        label.appendChild(cb);
        label.append(` ${key}) ${textVal}`);
        fieldset.appendChild(label);
    });
    container.appendChild(fieldset);
}

/** definition -> single (bez tasowania definicji) */
function renderDefinitionCheckboxGroup(container, task, qIndex) {
    let fieldset = document.createElement('div');
    let defKeys = Object.keys(task.definitions);
    defKeys.forEach(key => {
        let textVal = task.definitions[key];
        let label = document.createElement('label');
        label.style.display = 'block';

        let cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.name = `single-${qIndex}`;
        cb.value = key;
        cb.dataset.fullText = textVal;

        cb.addEventListener('change', () => {
            if (cb.checked) {
                let siblings = fieldset.querySelectorAll(`input[name="single-${qIndex}"]`);
                siblings.forEach(s => {
                    if (s !== cb) s.checked = false;
                });
            }
        });

        label.appendChild(cb);
        label.append(` ${key}) ${textVal}`);
        fieldset.appendChild(label);
    });
    container.appendChild(fieldset);
}

/** order -> drag&drop (steps już potasowane w createPreparedTask) */
function renderOrderDragDrop(container, task, qIndex) {
    if (!task.steps || !Array.isArray(task.steps)) {
        console.warn('Brak steps lub steps nie są tablicą w pytaniu:', task);
        return;
    }

    let ul = document.createElement('ul');
    ul.className = 'dd-list';

    task.steps.forEach(step => {
        let li = document.createElement('li');
        li.className = 'dd-item';
        li.addEventListener('touchstart', e => simulateMouseFromTouch(e, 'mousedown'), { passive: false });
        li.addEventListener('touchmove', e => simulateMouseFromTouch(e, 'mousemove'), { passive: false });
        li.addEventListener('touchend', e => simulateMouseFromTouch(e, 'mouseup'), { passive: false });

        li.setAttribute('draggable', 'true');

        // Ikonka do złapania (lepsza obsługa mobilna)
        let grip = document.createElement('span');
        grip.className = 'grip-icon material-icons';
        grip.textContent = 'drag_handle';
        grip.style.cursor = 'grab';

        // Tekst
        let text = document.createElement('span');
        text.textContent = step;
        text.style.flex = '1';

        li.appendChild(grip);
        li.appendChild(text);
        ul.appendChild(li);
    });

    // Drag events
    ul.addEventListener('dragstart', e => {
        if (e.target.classList.contains('dd-item')) {
            e.target.classList.add('dragging');
        }
    });

    ul.addEventListener('dragend', e => {
        e.target.classList.remove('dragging');
    });

    ul.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = ul.querySelector('.dragging');
        if (!dragging) return;
        const afterElement = getDragAfterElement(ul, e.clientY);
        if (afterElement == null) {
            ul.appendChild(dragging);
        } else {
            ul.insertBefore(dragging, afterElement);
        }
    });

    container.appendChild(ul);
}


function getDragAfterElement(ul, y) {
    const items = [...ul.querySelectorAll('.dd-item:not(.dragging)')];
    let closest = null;
    let closestOffset = Number.NEGATIVE_INFINITY;
    items.forEach(item => {
        let box = item.getBoundingClientRect();
        let offset = y - box.top - (box.height / 2);
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closest = item;
        }
    });
    return closest;
}

/** Nasłuch, czy user coś zaznaczył lub przesunął w order -> odblokowujemy next/finish */
function setupAnswerCheck(qIndex) {
    const container = document.getElementById('question-container');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');

    let inputs = container.querySelectorAll('input[type="checkbox"], .dd-list');

    inputs.forEach(el => {
        if (el.classList.contains('dd-list')) {
            el.addEventListener('dragend', () => {
                captureUserAnswer(qIndex); // <-- zapis
                if (userHasAnswered(qIndex)) enableNav(qIndex, nextBtn, finishBtn);
            });
        } else {
            el.addEventListener('change', () => {
                captureUserAnswer(qIndex); // <-- zapis
                if (userHasAnswered(qIndex)) enableNav(qIndex, nextBtn, finishBtn);
            });
        }
    });
}


function enableNav(qIndex, nextBtn, finishBtn) {
    if (qIndex < preparedTasks.length - 1) {
        nextBtn.disabled = false;
    } else {
        finishBtn.disabled = false;
    }
}

/** userHasAnswered sprawdza minimalnie, czy user coś zaznaczył w single/multi. */
function userHasAnswered(qIndex) {
    let task = preparedTasks[qIndex];
    if (task.type === 'simple_select' || task.type === 'advenced_simple_select'
        || task.type === 'practical_example' || task.type === 'causal_reasoning_select') {
        let cbs = document.querySelectorAll(`input[name="single-${qIndex}"]`);
        for (let cb of cbs) {
            if (cb.checked) return true;
        }
        return false;
    }
    if (task.type === 'multi_select') {
        let cbs = document.querySelectorAll(`input[name="multi-${qIndex}[]"]:checked`);
        return (cbs.length > 0);
    }
    if (task.type === 'definition_typeA' || task.type === 'definition_typeB') {
        let cbs = document.querySelectorAll(`input[name="single-${qIndex}"]`);
        for (let cb of cbs) {
            if (cb.checked) return true;
        }
        return false;
    }
    if (task.type === 'order') {
        // drag&drop -> true
        return true;
    }
    return false;
}

function goNextQuestion() {
    if (currentIndex < preparedTasks.length - 1) {
        currentIndex++;
        renderQuestion(currentIndex);
    }
}

function goPrevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion(currentIndex);
    }
}

/** finishQuiz – koniec quizu, zbieramy user_answer, sprawdzamy, wyświetlamy. */
function finishQuiz() {
    clearInterval(timerInterval);
    usedSeconds = 15 * 60 - totalSeconds;

    document.getElementById('quiz-screen').style.display = 'none';

    let points = 0;
    let answersData = [];
    let userAnswersArr = [];

    preparedTasks.forEach((prepTask, i) => {
        let userAnsVal = prepTask.user_answer;
        let userAnsObj = formatAnswerForDisplay(prepTask, userAnsVal);
        let isOk = checkCorrect(prepTask, userAnsObj.valueForCheck);
        if (isOk) points++;

        let userAnswerJson = buildUserAnswerJson(prepTask, userAnsObj.valueForCheck);

        answersData.push({
            prepTask,
            userAnswerDisplay: userAnsObj.display,
            userRaw: userAnsObj.valueForCheck,
            correctDisplay: getCorrectDisplay(prepTask),
            isOk
        });

        userAnswersArr.push(userAnswerJson);
    });

    document.getElementById('results-section').style.display = 'block';
    const scoreBox = document.getElementById('score-info');
    scoreBox.innerHTML = `
        <div class="result-summary primary-summary">
            <strong>Twój wynik:</strong> ${points} / ${preparedTasks.length}<br/>
            <strong>Twój czas:</strong> ${formatSec(usedSeconds)}
        </div>`;


    let answersExplanations = document.getElementById('answers-explanations');
    answersExplanations.innerHTML = '';

    answersData.forEach((obj, idx) => {
        const { prepTask: task, isOk, userAnswerDisplay, correctDisplay, userRaw } = obj;

        const wrapper = document.createElement('div');
        wrapper.classList.add('result-block');
        wrapper.classList.add(isOk ? 'correct-block' : 'wrong-block');

        wrapper.style.marginBottom = '24px';

        const title = document.createElement('div');
        title.innerHTML = `<strong>${idx + 1}) ${task.question}</strong>`;
        wrapper.appendChild(title);

        // Typ order — wizualizacja jako bloczki
        if (task.type === 'order') {
            const labelUser = document.createElement('div');
            labelUser.textContent = 'Twoja odpowiedź:';
            wrapper.appendChild(labelUser);

            const ulUser = document.createElement('ul');
            ulUser.className = 'order-result-list';

            const correct = task.correct;

            userRaw.forEach((step, i) => {
                const li = document.createElement('li');
                li.className = 'order-result-item';
                if (step === correct[i]) {
                    li.classList.add('correct');
                } else {
                    li.classList.add('incorrect');
                }
                li.textContent = `${i + 1}) ${step}`;
                ulUser.appendChild(li);
            });

            wrapper.appendChild(ulUser);

            const labelCor = document.createElement('div');
            labelCor.textContent = 'Poprawna kolejność:';
            wrapper.appendChild(labelCor);

            const ulCorrect = document.createElement('ul');
            ulCorrect.className = 'order-result-list';
            correct.forEach((step, i) => {
                const li = document.createElement('li');
                li.className = 'order-result-item correct';
                li.textContent = `${i + 1}) ${step}`;
                ulCorrect.appendChild(li);
            });

            wrapper.appendChild(ulCorrect);

            if (task.explanation) {
                const expBox = document.createElement('div');
                expBox.className = 'explanation-box';
                expBox.innerHTML = `
                    <span class="explanation-icon material-icons">info</span>
                    <div><em>Wyjaśnienie:</em> ${task.explanation}</div>`;
                wrapper.appendChild(expBox);
            }


        } else {
            // Pozostałe typy
            const userColorClass = isOk ? 'result-correct' : 'result-wrong';

            const userLine = document.createElement('div');
            userLine.className = `result-line ${userColorClass}`;
            userLine.innerHTML = `
                <span class="result-icon material-icons">${isOk ? 'check_circle' : 'cancel'}</span>
                <strong>Twoja odpowiedź:</strong> <span class="${userColorClass}"> ${userAnswerDisplay}</span>`;
            wrapper.appendChild(userLine);

            const correctLine = document.createElement('div');
            correctLine.className = 'result-line result-correct';
            correctLine.innerHTML = `
                <span class="result-icon material-icons">check_circle_outline</span>
                <strong>Poprawna odpowiedź:</strong> <span class="result-correct"> ${correctDisplay}</span>`;
            wrapper.appendChild(correctLine);


            if (task.explanation) {
                const expBox = document.createElement('div');
                expBox.className = 'explanation-box';
                expBox.innerHTML = `
                    <span class="explanation-icon material-icons">info</span>
                    <div><em> ${task.explanation}</em></div>`;
                wrapper.appendChild(expBox);
            }

        }

        answersExplanations.appendChild(wrapper);
    });

    const fd = new FormData();
    fd.append('points', points);
    fd.append('timeSeconds', usedSeconds);
    fetch('save_result.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
            const avInfo = document.getElementById('averages-info');
            avInfo.innerHTML = `
            <div class="result-summary">
                Średni wynik: <strong>${data.averagePoints.toFixed(2)} / ${data.totalQuestions}</strong><br/>
                Średni czas: <strong>${formatSec(Math.round(data.averageTime))}</strong>
            </div>`;

            const bestInfo = document.getElementById('best-info');
            const lacking = Math.max(0, data.bestPoints - points);
            bestInfo.innerHTML = `
            <div class="result-summary">
                Najlepszy wynik: <strong>${data.bestPoints} / ${data.totalQuestions}</strong>,
                w czasie <strong>${formatSec(data.bestTime)}</strong><br/>
                Brakuje Ci: <strong>${lacking} pkt</strong> do wyrównania najlepszego wyniku.
            </div>`;
        })
        .catch(err => console.error('Błąd zapisu wyników:', err));

    console.log("User answers in JSON format:", userAnswersArr);
}


/** Zwraca { valueForCheck, display } na bazie "preparedTask" */
function getUserAnswer(prepTask, idx) {
    if (prepTask.type === 'simple_select' || prepTask.type === 'advenced_simple_select'
        || prepTask.type === 'practical_example' || prepTask.type === 'causal_reasoning_select'
        || prepTask.type === 'definition_typeA' || prepTask.type === 'definition_typeB') {

        let cbs = document.querySelectorAll(`input[name="single-${idx}"]`);
        for (let cb of cbs) {
            if (cb.checked) {
                return {
                    valueForCheck: cb.value,  // np. "A"
                    display: cb.dataset.fullText
                };
            }
        }
        return { valueForCheck: '', display: '(nic)' };
    }
    else if (prepTask.type === 'multi_select') {
        let cbs = document.querySelectorAll(`input[name="multi-${idx}[]"]:checked`);
        if (cbs.length === 0) {
            return { valueForCheck: [], display: '[]' };
        }
        let keys = [];
        let texts = [];
        cbs.forEach(cb => {
            keys.push(cb.value);
            texts.push(cb.dataset.fullText);
        });
        return {
            valueForCheck: keys,
            display: JSON.stringify(texts)
        };
    }
    else if (prepTask.type === 'order') {
        let ul = document.querySelector('.dd-list');
        if (!ul) return { valueForCheck: [], display: '(nic)' };
        let lis = ul.querySelectorAll('li');
        let arrOfSteps = [];
        lis.forEach(li => {
            const spanText = li.querySelector('span:nth-child(2)');
            arrOfSteps.push(spanText?.textContent?.trim() || '');
        });
        // "1) stepA, 2) stepB..."
        let dispArr = arrOfSteps.map((s, i) => ((i + 1) + ") " + s));
        return {
            valueForCheck: arrOfSteps,
            display: "[" + dispArr.join(", ") + "]"
        };
    }
    return { valueForCheck: '', display: '(unknown type)' };
}

/** Tworzy obiekt identyczny jak w zadania.json + "user_answer" */
function buildUserAnswerJson(prepTask, userVal) {
    let result = {
        type: prepTask.type,
        question: prepTask.question,
        correct: prepTask.correct || null,
        explanation: prepTask.explanation || "",
        auto_id: prepTask.auto_id || 0,
        user_answer: userVal
    };
    if (prepTask.options) {
        result.options = { ...prepTask.options };
    }
    if (prepTask.definitions) {
        result.definitions = { ...prepTask.definitions };
    }
    if (prepTask.steps) {
        // to jest potasowana wersja w preparedTask,
        // ale oryginalne "correct" i "steps" na obiekcie
        // user_answer -> userVal
        // ewentualnie 'displayed_steps': ...
        result.steps = [...prepTask.steps];
    }
    return result;
}

/** Zwraca ładnie sformatowaną poprawną odpowiedź z preparedTask */
function getCorrectDisplay(prepTask) {
    let cor = prepTask.correct;
    if (Array.isArray(cor)) {
        if (prepTask.type === 'multi_select') {
            let arrTexts = cor.map(k => prepTask.options[k]);
            return arrTexts.join(', ');
        }
        if (prepTask.type === 'order') {
            return cor.map((s, i) => `${i + 1}) ${s}`).join(', ');
        }
        return cor.join(', ');
    } else {
        const source = prepTask.options || prepTask.definitions || {};
        return source[cor] || cor;
    }
}


/** Sprawdza poprawność (porównuje userVal z preparedTask.correct). */
function checkCorrect(prepTask, userVal) {
    let cor = prepTask.correct;
    if (Array.isArray(cor)) {
        if (prepTask.type === 'multi_select') {
            if (!Array.isArray(userVal)) return false;
            if (userVal.length !== cor.length) return false;
            for (let x of userVal) {
                if (!cor.includes(x)) return false;
            }
            return true;
        }
        else if (prepTask.type === 'order') {
            if (!Array.isArray(userVal)) return false;
            if (userVal.length !== cor.length) return false;
            for (let i = 0; i < cor.length; i++) {
                if (userVal[i] !== cor[i]) return false;
            }
            return true;
        }
        else {
            return JSON.stringify(userVal) === JSON.stringify(cor);
        }
    } else {
        // single
        return (userVal === cor);
    }
}

/** Tasowanie tablicy (in-place) */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/** Odliczanie */
function updateCountdown() {
    let cdown = document.getElementById('countdown');
    let min = Math.floor(totalSeconds / 60);
    let s = totalSeconds % 60;
    cdown.textContent = `${min}:${s.toString().padStart(2, '0')}`;
    if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        finishQuiz();
    } else {
        totalSeconds--;
    }
}

/** Format sekund na mm:ss */
function formatSec(sec) {
    let m = Math.floor(sec / 60);
    let s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function captureUserAnswer(qIndex) {
    const prepTask = preparedTasks[qIndex];
    const userAnsObj = getUserAnswer(prepTask, qIndex); // reużywamy istniejącego
    prepTask.user_answer = userAnsObj.valueForCheck; // <-- zapisujemy!
}

function formatAnswerForDisplay(task, userVal) {
    if (task.type === 'multi_select') {
        if (!Array.isArray(userVal)) return { display: '(nic)', valueForCheck: [] };
        const texts = userVal.map(k => task.options[k] || k);
        return {
            display: texts.join(', '),
            valueForCheck: userVal
        };
    } else if (task.type === 'order') {
        if (!Array.isArray(userVal)) return { display: '(nic)', valueForCheck: [] };
        const disp = userVal.map((s, i) => `${i + 1}) ${s}`);
        return { display: disp.join(', '), valueForCheck: userVal };
    } else if (typeof userVal === 'string') {
        const source = task.options || task.definitions || {};
        return { display: source[userVal] || userVal, valueForCheck: userVal };
    }
    return { display: '(nic)', valueForCheck: '' };
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}