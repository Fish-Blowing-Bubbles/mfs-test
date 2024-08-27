let questionAnswers = {}
let resultEnabled = false;

let currentScreen = ["top_spacer", "start", "footer"];

const numOfQuestions = 15;
const likardQuestions = [3];

onload = (event) => {
    loadSession();
}

function loadSession() {
    // clear any potential settings - without deleting the stored session
    restartQuestionnaire(false);

    // load question answers - highlight the currently selected answers
    let i = 0;
    while(document.getElementById("q" + i)) {
        const savedAnswer = sessionStorage.getItem("q" + i);

        if(savedAnswer) {
            // handle freeform answers and multiple-choice answers
            if(document.getElementById(`q${i}_a`)) {
                // freeform answer

                // answer type multi
                if (document.getElementById(`q${i}_a0`)) {
                    // case A - only a multiple choice answer exists so far
                    if (document.getElementById(`q${i}_${savedAnswer}`)) {
                        document.getElementById(`q${i}_${savedAnswer}`).classList.add("question-answer-highlighted");
                    }
                    // case B - only a text answer exists so far
                    else if (!savedAnswer.includes(':::')) {
                        document.getElementById(`q${i}_a`).value = savedAnswer;
                    }
                    // case C - both answers exist
                    else {
                        document.getElementById(`q${i}_${savedAnswer.split(':::')[0]}`).classList.add("question-answer-highlighted");
                        document.getElementById(`q${i}_a`).value = savedAnswer.replace(savedAnswer.split(':::')[0] + ':::', '');
                    }
                }

                if (savedAnswer.includes(':::')) {
                    document.getElementById(`q${i}_a`).value = savedAnswer.replace(savedAnswer.split(':::')[0] + ':::', '');
                } else {
                    document.getElementById(`q${i}_a`).value = savedAnswer;
                }
            } else if (isLikardQuestion(document.getElementById(`q${i}`))) {
                // likard scale answer
                document.getElementById(`q${i}_${savedAnswer}`).classList.add("likard-bubble-highlighted");
            } else {
                // multiple-choice answer
                document.getElementById(`q${i}_${savedAnswer}`).classList.add("question-answer-highlighted");
            }

            questionAnswers["q" + i] = savedAnswer;
        }

        i += 1;
    }

    // set active question
    const savedQ = sessionStorage["active_question"];

    if (savedQ != 'undefined' && savedQ != undefined) {
        loadScreen(savedQ);
        console.log("Session restored.");
    }
}


/**
 * Save the clicked element as the current answer
 * Apply the "active Answer" styling, remove it from the last active answer
 * @param {HTMLElement} element the answer element that called the function
 */
function selectAnswer(element, type='default') {
    const questionID = element.id.split("_")[0];
    const answerID = element.id.split("_")[1];

    console.log("Selected answer " + answerID + " for question " + questionID);

    if(questionAnswers[questionID] != undefined) {
        let oldAnswerID = questionAnswers[questionID];

        // find the saved answer in the multi case
        if (type == 'multi') {
            oldAnswerID = oldAnswerID.split(':::')[0];
        }

        const oldAnswerElement = document.getElementById(`${questionID}_${oldAnswerID}`);

        if (type == 'default' || type == 'multi') {
            oldAnswerElement.classList.remove("question-answer-highlighted");
        } else if (type == 'likard') {
            oldAnswerElement.classList.remove("likard-bubble-highlighted");
        }
    }

    if (type == 'default' || type == 'multi') {
        element.classList.add("question-answer-highlighted");
    } else if (type == 'likard') {
        element.classList.add("likard-bubble-highlighted");
    }

    // avoid overwriting the text answer in case the question has multiple answer types
    if (questionAnswers[questionID] != undefined && type == 'multi') {
        questionAnswers[questionID] = questionAnswers[questionID].replace(questionAnswers[questionID].split(':::')[0], answerID);
    } else {
        questionAnswers[questionID] = answerID;
    }

    saveAnswers();

    updateNavigationButtons();
}

/**
 * Called whenever a free-text answer is changed
 * saves the current answer and updates the getResult button
 * @param {HTMLElement} element the answer element that called the function
 */
function updateTextBox(element, type='default') {
    const questionID = element.id.split("_")[0];

    if (type == 'default') {
        questionAnswers[questionID] = element.value.replace("<script>", "").replace("</script>", "");
    } else if (type == 'multi') {
        // case A - only a multiple choice answer exists so far
        if (document.getElementById(`${questionID}_${questionAnswers[questionID]}`)) {
            // append the text field value to the existing answer with ':::' for separation
            questionAnswers[questionID] = questionAnswers[questionID] + ':::' + element.value.replace("<script>", "").replace("</script>", "");
        } 
        // case B - only a text answer exists so far
        else if (!questionAnswers[questionID].includes(':::')) {
            // overwrite the text answer with the new value
            questionAnswers[questionID] = element.value.replace("<script>", "").replace("</script>", "");
        }
        // case C - multiple answers exist
        else {
            // keep the multiple choice answer and update the free text answer
            questionAnswers[questionID] = questionAnswers[questionID].split(':::')[0] + ':::' + element.value.replace("<script>", "").replace("</script>", "");
        }
    }
    saveAnswers();

    updateNavigationButtons();
}

function saveAnswers() {
    for(let key in questionAnswers) {
        sessionStorage.setItem(key, questionAnswers[key]);
    }
    sessionStorage.setItem("active_question", activeQuestionID);
}


let activeQuestionID;
let prevButtonLocked = true, nextButtonLocked = true;


/**
 * Load a screen by its ID
 * @param {string} screenID 
 */
function loadScreen(screenID, storeScreen = true) {
    // screen ID: one of the question IDs, result or start

    // hide the current screen
    currentScreen.forEach(id => {
        const elem = document.getElementById(id);
        elem.classList.add("hidden");
    });

    // hide all pop-ups (in case they are visible)
    const popUps = document.getElementsByClassName("pop-up");
    Array.from(popUps).forEach(popUp => {
        popUp.classList.add("hidden");
    });
    document.body.classList.remove("background-blur");

    // definition of all screens
    let elements;
    if (screenID == "start") {
        elements = ["top_spacer_start", "start", "footer"];
    } else if (screenID == "result") {
        elements = ["top_spacer_start", "result", "footer"];
    } else if (screenID == "impressum") {
        elements = ["top_spacer_start", "impressum", "footer"];
    } else if (screenID == "sources") {
        elements = ["top_spacer_start", "sources", "footer"];
    } else {
        // question screen
        elements = ["progress_bar", "top_spacer", screenID, "navigation", "footer"];
    }

    // show the new screen
    elements.forEach(id => {
        const elem = document.getElementById(id);
        elem.classList.remove("hidden");
    });

    if (storeScreen) {
        activeQuestionID = screenID;
    }

    updateProgressBar();
    updateNavigationButtons();
    updateScreenStatus();
    formatTextBoxes();
}


/**
 * Starts the questionnaire
 */
function start() {
    saveAnswers();
    loadScreen("q0");
}

/**
 * Load next question
 */
function nextQuestion(calledFromPopUp = false) {
    if(nextButtonLocked) return;

    const currentQindex = Number(activeQuestionID.replace("q", ""));
    const nextQuestionID = "q" + (currentQindex + 1);

    if (document.getElementById(nextQuestionID)) {
        // show pop-up if the current question has one
        if (questionHasPopUp(activeQuestionID) && !calledFromPopUp) {
            const popUp = document.getElementById(activeQuestionID + "_pop_up");
            popUp.classList.remove("hidden");

            // blur the background
            document.body.classList.add("background-blur");
        } else {
            // hide the pop-up if this function was called from a pop-up
            if (calledFromPopUp) {
                const popUp = document.getElementById(activeQuestionID + "_pop_up");
                popUp.classList.add("hidden");

                document.body.classList.remove("background-blur");
            }

            saveAnswers();
            loadScreen(nextQuestionID);
        }
    } else {
        // no next question, show result screen
        saveAnswers();
        loadScreen("result");
    }
}

/**
 * Load previous question
 */
function previousQuestion() {
    if(prevButtonLocked) return;

    const currentQindex = Number(activeQuestionID.replace("q", ""));
    const prevQuestionID = "q" + (currentQindex - 1);

    if (document.getElementById(prevQuestionID)) {
        saveAnswers();
        loadScreen(prevQuestionID);
    }
}

/**
 * Update the progress bar to reflect the current question
 */
function updateProgressBar() {
    const activeQuestionIndex = Number(activeQuestionID.replace("q", ""));

    const progress = activeQuestionIndex / numOfQuestions;

    $('#progress_bar_inside').animate({
        width: Math.max(progress, 0) * 100 + "%"
    }, 200);
}

/**
 * Check if the given questionElement has a text answer
 * @param {HTMLElement} questionElement 
 * @returns {boolean}
 */
function isTextQuestion(questionElement) {
    return Array.from(questionElement.getElementsByClassName("text-answer")).length > 0;
}

function isMultiQuestion(questionElement) {
    return document.getElementById(questionElement.id + "_a") && document.getElementById(questionElement.id + "_a0");
}

function isLikardQuestion(questionElement) {
    const allChildren = questionElement.getElementsByTagName("*");

    for (let i = 0; i < allChildren.length; i++) {
        if (allChildren[i].classList.contains("likard-scale-container")) {
            return true;
        }
    }

    return false;
}

/**
 * Check if the given questionElement has a pop-up
 * @param {HTMLElement} questionElement 
 * @returns {boolean}
 */
function questionHasPopUp(questionElementID) {
    return document.getElementById(questionElementID + "_pop_up") ? true : false;
}

function impressum() {
    loadScreen("impressum", false);
}

function exitImpressum() {
    loadScreen(activeQuestionID);
}

function sources() {
    loadScreen("sources", false);
}


/**
 * Reads which elements are currently visible on screen and saves them in currentScreen
 */
function updateScreenStatus() {
    currentScreen = [];

    const main = document.getElementById("content_section");

    Array.from(main.children).forEach(element => {
        if (!element.classList.contains("hidden")) {
            currentScreen.push(element.id);
        }
    });
}

/**
 * Update the navigation buttons based on the currently active question
 */
function updateNavigationButtons() {
    const prevButton = document.getElementById("prev_button");
    const nextButton = document.getElementById("next_button");

    const activeQuestionIndex = Number(activeQuestionID.replace("q", ""));

    if(activeQuestionIndex == 0) {
        // set prev button to locked
        prevButton.classList.add("button-locked");
        prevButton.classList.remove("button-active");
        prevButtonLocked = true;
    } else {
        // set prev button to active
        prevButton.classList.add("button-active");
        prevButton.classList.remove("button-locked");
        prevButtonLocked = false;
    }

    if(questionIsAnswered(activeQuestionID)) {
        // set next button to active
        nextButton.classList.add("button-active");
        nextButton.classList.remove("button-locked");
        nextButtonLocked = false;
    } else {
        // set next button to locked
        nextButton.classList.add("button-locked");
        nextButton.classList.remove("button-active");
        nextButtonLocked = true;
    }
}

/**
 * Check if the given question has been answered
 * @param {string} questionID 
 * @returns {boolean}
 */
function questionIsAnswered(questionID) {
    return questionAnswers[questionID] != undefined;
}

/**
 * Restart the questionnaire by jumping back to the start page and clearing all saved answers
 * @param {boolean} clearSession optional, when false the sessionStorage object won't be deleted
 */
function restartQuestionnaire(clearSession=true) {
    // reset answers
    questionAnswers = {};
    if(clearSession) sessionStorage.clear();

    // go through all questions and clear the selected responses
    let i = 0;
    while(document.getElementById("q" + i)) {
        const questionElement = document.getElementById("q" + i);

        // check if the question has a freeform answer or regular options
        if (isMultiQuestion(questionElement)) {
            document.getElementById(`q${i}_a`).value = "";
            let j = 0;
            while(document.getElementById(`q${i}_a${j}`)) {
                document.getElementById(`q${i}_a${j}`).classList.remove("question-answer-highlighted");
                j += 1;
            }
        } else if (isTextQuestion(questionElement)) {
            // freeform question: set text field to empty
            document.getElementById(`q${i}_a`).value = "";
        } else {
            // multiple-choice question: go through all answers and reset them
            let j = 0;
            while(document.getElementById(`q${i}_a${j}`)) {
                document.getElementById(`q${i}_a${j}`).classList.remove("question-answer-highlighted");
                document.getElementById(`q${i}_a${j}`).classList.remove("likard-bubble-highlighted");
                j += 1;
            }
        }

        i += 1;
    }

    loadScreen("start");
}


addEventListener("resize", (event) => {
    formatTextBoxes();
});

function formatTextBoxes() {
    for (let i = 0; i < numOfQuestions; i++) {
        if (document.getElementById(`q${i}_a`)) {
            updateTextBoxHeight(`q${i}_a`);
        }
    }
}

function updateTextBoxHeight(id) {
    const element = document.getElementById(id);

    const width = element.getBoundingClientRect().width;

    if (width == 0) {
        return;
    }

    const lettersPerLine = width / 9; // 8 is the average width of a letter with the current font
    const lines = Math.ceil(element.maxLength / lettersPerLine);

    element.style.height = lines * 30 + "px"; // 50 is the line height with the current font
}
