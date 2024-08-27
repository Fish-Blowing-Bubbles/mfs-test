let questionAnswers = {}
let resultEnabled = false;

/**
 * Save the clicked element as the current answer
 * Apply the "active Answer" styling, remove it from the last active answer
 * @param {HTMLElement} element the answer element that called the function
 */
function selectAnswer(element) {
    const questionID = Number(element.id.split("_")[0].replace("q", ""));
    const answerID = Number(element.id.split("_")[1].replace("a", ""));

    console.log("Selected answer " + answerID + " for question " + questionID);

    if(questionAnswers[questionID] != undefined) {
        const oldAnswerID = questionAnswers[questionID];
        const oldAnswerElement = document.getElementById(`q${questionID}_a${oldAnswerID}`);
        oldAnswerElement.classList.remove("question-answer-highlighted");
    }

    element.classList.add("question-answer-highlighted");

    questionAnswers[questionID] = answerID;

    allQuestionsAnswered() ? enableResultButton() : disableResultButton();
}

/**
 * Called whenever a free-text answer is changed
 * saves the current answer and updates the getResult button
 * @param {HTMLElement} element the answer element that called the function
 */
function updateTextBox(element) {
    const questionID = Number(element.id.split("_")[0].replace("q", ""));
    questionAnswers[questionID] = element.value;

    allQuestionsAnswered() ? enableResultButton() : disableResultButton();
}

/**
 * Check if all questions have been answered
 * @returns {boolean} true if all questions have been answered, false otherwise
 */
function allQuestionsAnswered() {
    const questionIDs = [];
    let currentQ;
    let id = 0;
    let result = true;

    // find all questions on the page
    do {
        currentQ = document.getElementById(`q${id}_a0`);
        if(currentQ) questionIDs.push(id);
        id++;
    } while(currentQ);

    // check if there is an answer for each question
    questionIDs.forEach(id => {
        if(questionAnswers[id] == undefined || questionAnswers[id] == '') {
            result = false; // abort as soon as one answer is missing
            console.log(`Question ${id} missing`)
        }
    });

    return result;
}

/**
 * Enable the result button - make it visually appear clickable and enable the getResult function
 */
function enableResultButton() {
    const button = document.getElementById("result_button");
    button.classList.add("button-enabled");

    resultEnabled = true;
}

/**
 * Disable the result button - make it visually appear non-clickable and disable the getResult function
 */
function disableResultButton() {
    const button = document.getElementById("result_button");
    button.classList.remove("button-enabled");

    resultEnabled = false;
}

/**
 * Calculate the result based on the question results and display it on the page
 * @param {HTMLElement} element the element, the function was called by
 */
function getResult(element) {
    if(!resultEnabled) return;

    const resultType = calculateQuestionnaireResult(questionAnswers);
    console.log(resultType)

    // show result box
    const resultContent = document.getElementById("result_content");
    resultContent.style.removeProperty("display");

    // clear the result box
    Array.from(resultContent.children).forEach(child => {
        // delete all elements that aren't templates
        if(child.tagName != "TEMPLATE") {
            child.remove();
        }
    });

    // add the correct content element to the result box
    const contentTemplate = document.getElementById(resultTypes[resultType]);
    const contentElement = contentTemplate.content.cloneNode(true);
    resultContent.appendChild(contentElement);

    // hide button
    element.style.display = "none";

    // show recalculate button
    document.getElementById("recalc_result_button").style.removeProperty("display");

    // scroll result into center of view
    // elemPosition - 1/2 * (screenHeight - elemHeight)
    const scrollPosition = (scrollY + resultContent.getBoundingClientRect().y) - 0.5 * (window.innerHeight - resultContent.getBoundingClientRect().height);
    scrollTo({
        top: scrollPosition,
        left: 0,
        behavior: "smooth",
    });
}


// EDIT THESE WHEN CHANGING THE RESULTS IN THE HTML
// id on html template element needs to match the id referenced in this dictionary
const resultTypes = {
    "type_a": "result_content_type_a",
    "type_b": "result_content_type_b",
    "type_c": "result_content_type_c",
}

/**
 * Calculate which result type of the resultTypes dictionary matches the given question answers
 * @param {object} answers dictionary holding the answer for each question as ID
 * @returns {string} the result type as key of the resultTypes dictionary
 */
function calculateQuestionnaireResult(answers) {
    const rndSelection = Math.floor(Math.random() * 3)

    return Object.keys(resultTypes)[rndSelection];
}
