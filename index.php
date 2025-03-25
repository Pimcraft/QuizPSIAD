<?php
// index.php
?>
<!DOCTYPE html>
<html lang="pl">

<head>
    <meta charset="UTF-8">
    <title>Quiz – ile pytań chcesz?</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="manifest" href="manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Quiz" />
    <link rel="apple-touch-icon" href="icon-192.png" />
</head>

<body>

    <div class="window-like-frame">
        <div class="window-header">
            <span>Quiz – pytania</span>
        </div>

        <div class="window-content">

            <!-- Ekran powitalny -->
            <div id="welcome-screen">
                <h2>Witaj w quizie!</h2>
                <p>W tym quizie masz 15 minut na odpowiedzenie na wybraną liczbę pytań.</p>

                <label for="question-count">Ile pytań chcesz rozwiązać?</label>
                <input type="number" id="question-count" value="10" min="1" max="200" style="width:60px;">
                <br><br>

                <button id="start-quiz-btn" class="btn-action">Rozpocznij quiz</button>
            </div>

            <!-- Ekran quizu -->
            <div id="quiz-screen" style="display: none;">
                <div id="countdown-container" class="countdown-bar">
                    Pozostały czas: <span id="countdown">15:00</span>
                </div>

                <div id="question-container">
                    <!-- tu dynamicznie wstawiamy pytanie -->
                </div>

                <div id="quiz-buttons">
                    <button id="prev-btn" class="btn-action" style="display:none;">Poprzednie</button>
                    <button id="next-btn" class="btn-action" style="display:none;">Następne</button>
                    <button id="finish-btn" class="btn-finish" style="display:none;">Zakończ</button>
                </div>
            </div>

            <!-- Ekran wyników -->
            <div id="results-section" style="display: none;">
                <div class="score-header">
                    <h2>Wyniki</h2>
                    <p id="score-info"></p>
                    <p id="averages-info"></p>
                    <p id="best-info"></p>
                </div>
                <h3>Poprawne odpowiedzi z wyjaśnieniami:</h3>
                <div id="answers-explanations"></div>
            </div>

        </div>
    </div>

    <script src="main.js"></script>
</body>

</html>