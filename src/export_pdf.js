// static link to the template pdf file
const pdfTemplate = 'pdf/PDF_result_template.pdf';
const pdfFont = 'pdf/Oswald-VariableFont_wght.ttf';

const pdfAnswerFormat = {
    "q0": {
        "x": 117.2,
        "y": 633.3,
        "page": 0,
        "isLikard": true,
    },
    "q1": {
        "x": 58.9,
        "y": 477.1,
        "maxWidth": 476,
        "page": 0,
    },
    "q2": {
        "isMixed": true,
        "x": 58.9,
        "y": 255.6,
        "x2": 58.9,
        "y2": 208.2,
        "maxWidth": 476,
        "page": 0,
    },
    "q3": {
        "x": 58.9,
        "y": 692.6,
        "maxWidth": 476,
        "page": 1,
    },
    "q4": {
        "x": 117.2,
        "y": 478.3,
        "page": 1,
        "isLikard": true,
    },
    "q5": {
        "x": 58.9,
        "y": 297.8,
        "maxWidth": 476,
        "page": 1,
    },
    "q6": {
        "x": 58.9,
        "y": 692.6,
        "maxWidth": 476,
        "page": 2,
    },
    "q7": {
        "x": 117.2,
        "y": 431.1,
        "page": 2,
        "isLikard": true,
    },
    "q8": {
        "x": 117.2,
        "y": 264.5,
        "page": 2,
        "isLikard": true,
    },
    "q9": {
        "x": 58.9,
        "y": 692.6,
        "maxWidth": 476,
        "page": 3,
    },
    "q10": {
        "x": 58.9,
        "y": 445.4,
        "maxWidth": 476,
        "page": 3,
    },
    "q11": {
        "x": 58.9,
        "y": 193.2,
        "maxWidth": 476,
        "page": 3,
    },
    "q12": {
        "x": 58.9,
        "y": 692.6,
        "maxWidth": 476,
        "page": 4,
    },
    "q13": {
        "x": 58.9,
        "y": 426.8,
        "maxWidth": 476,
        "page": 4,
    },
    "q14": {
        "x": 58.9,
        "y": 196.6,
        "maxWidth": 476,
        "page": 4,
    },
}

const likardGapSize = 121.1;


/**
 * Creates a duplicate of the template pdf with the current answers and downloads it
 */
async function exportPDF(questionAnswers) {
    // open pdf template file, defined in index.html
    const pdfData = await fetch(pdfTemplate).then(file => file.arrayBuffer());
    //const pdfData = await pdfData.arrayBuffer();

    const pdf = await PDFLib.PDFDocument.load(pdfData);
    const pages = pdf.getPages();

    // load the correct font
    pdf.registerFontkit(fontkit);
    const oswaldFontData = await fetch(pdfFont).then(file => file.arrayBuffer());
    const oswaldFont = await pdf.embedFont(oswaldFontData, { subset: true });

    console.log(pages[0].getWidth(), pages[0].getHeight());

    for (const [key, value] of Object.entries(questionAnswers)) {
        if (key == "result") continue;

        if (pdfAnswerFormat[key]["isLikard"]) {
            // create a point at the correct position
            const answerIndex = parseInt(value.replace("a", ""));

            pages[pdfAnswerFormat[key]["page"]].drawCircle({
                x: pdfAnswerFormat[key]["x"] + (likardGapSize * answerIndex),
                y: pdfAnswerFormat[key]["y"],
                size: 15,
                color: PDFLib.rgb(0.9137, 0.2549, 0.5647),
                borderWidth: 1,
                borderColor: PDFLib.rgb(0.1020, 0.1804, 0.2667),
            });
        } else if (pdfAnswerFormat[key]["isMixed"]) {
            // write both the multiple choice and the text answer in their respective positions
            const answerA = value.split(":::")[0];
            const answerB = value.replace(value.split(":::")[0] + ":::", "");

            const textA = getAnswerText(key, answerA);
            const textB = getAnswerText(key, answerB);

            pages[pdfAnswerFormat[key]["page"]].drawText(textA, {
                x: pdfAnswerFormat[key]["x"],
                y: pdfAnswerFormat[key]["y"],
                font: oswaldFont,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
            pages[pdfAnswerFormat[key]["page"]].drawText(textB, {
                x: pdfAnswerFormat[key]["x2"],
                y: pdfAnswerFormat[key]["y2"],
                font: oswaldFont,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
        } else {
            // create a new text field and add it to a page
            const text = getAnswerText(key, value);

            console.log(text)
            console.log(String.raw`${text}`);

            pages[pdfAnswerFormat[key]["page"]].drawText(text, {
                x: pdfAnswerFormat[key]["x"],
                y: pdfAnswerFormat[key]["y"],
                font: oswaldFont,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
        }
    }

    // save the pdf into a new file
    const newPdfData = await pdf.save();

    downloadFile('medienfuererschein_ki_ergebnis.pdf', newPdfData);
}


/**
 * Get the content of the specified answer - it's text
 * @param {string} question the code of the desired question e.g. 'q1'
 * @param {string} answer the code of the desired answer e.g. 'a0'
 */
function getAnswerText(question, answer) {
    const elementID = question + "_" + answer;

    const element = document.getElementById(elementID);

    if (element) {
        for (const child of element.children) {
            if (child.innerText != "") {
                return child.innerText;
            }
        }
    } else {
        return answer;
    }
}


/**
 * Download the given data as new pdf file with the given name
 * @param {string} filename the name of the file that will be downloaded
 * @param {object} data the pdf data as Uint8Array
 */
function downloadFile(filename, data) {
    // make sure the filename has the ".pdf" extension
    if (filename.split(".").at(-1) != "pdf") {
        filename += ".pdf";
    }

    // create dummy element holding the data as URL
    const dummy = document.createElement('a');
    dummy.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
    dummy.download = filename;

    // add the dummy to the document and click it to trigger the download
    document.body.appendChild(dummy);
    dummy.click();
    document.body.removeChild(dummy);
}