
let rawData = [];    
let dataset = [];     
let model = null;     

let barChart = null;
let scatterChart = null;
let lineChart = null;


const encodeInsulation = {
    "Low": 1,
    "Medium": 2,
    "High": 3
};


function showError(msg) {
    const box = document.getElementById("errorBox");
    if (!box) return;
    box.textContent = msg;
    box.classList.remove("hidden");
}

function clearError() {
    const box = document.getElementById("errorBox");
    if (!box) return;
    box.classList.add("hidden");
}


const fileInput = document.getElementById("fileInput");
if (fileInput) {
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        clearError();
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                if (!results.data || results.data.length === 0) {
                    showError("The CSV file appears to be empty or invalid.");
                    return;
                }
                console.log("CSV parsed, rows:", results.data.length);
                rawData = results.data;
                createPreviewTable();
                populateColumnDropdowns();
            },
            error: function (err) {
                console.error(err);
                showError("Error parsing CSV: " + err.message);
            }
        });
    });
}


function createPreviewTable() {
    const preview = document.getElementById("previewTable");
    const container = document.getElementById("previewContainer");
    if (!preview || !container) return;

    preview.innerHTML = "";

    const headers = Object.keys(rawData[0]);

    // Header row
    let headerRow = "<tr>";
    headers.forEach(h => headerRow += `<th>${h}</th>`);
    headerRow += "</tr>";
    preview.innerHTML = headerRow;

  
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
        let rowHTML = "<tr>";
        headers.forEach(h => {
            rowHTML += `<td>${rawData[i][h]}</td>`;
        });
        rowHTML += "</tr>";
        preview.innerHTML += rowHTML;
    }

    container.classList.remove("hidden");
}


function populateColumnDropdowns() {
    const mappingSec = document.getElementById("columnMappingSection");
    if (!mappingSec) return;

    mappingSec.classList.remove("hidden");

    const headers = Object.keys(rawData[0]);

    function fillSelect(id) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = "";
        headers.forEach(h => {
            const opt = document.createElement("option");
            opt.value = h;
            opt.textContent = h;
            select.appendChild(opt);
        });
    }

    fillSelect("colSqft");
    fillSelect("colYear");
    fillSelect("colIns");
    fillSelect("colRating");
}


const applyBtn = document.getElementById("applyMapping");
if (applyBtn) {
    applyBtn.addEventListener("click", () => {
        console.log("Apply Mapping clicked");

        if (!rawData || rawData.length === 0) {
            showError("No CSV data loaded yet.");
            return;
        }

        const sqftCol = document.getElementById("colSqft")?.value;
        const yearCol = document.getElementById("colYear")?.value;
        const insCol = document.getElementById("colIns")?.value;
        const rateCol = document.getElementById("colRating")?.value;

        if (!sqftCol || !yearCol || !insCol || !rateCol) {
            showError("Please select all column mappings.");
            return;
        }

        
        dataset = rawData.map(row => {
            const sqft = Number(row[sqftCol]);
            const year = Number(row[yearCol]);
            const insLabel = String(row[insCol]).trim();
            const rating = Number(row[rateCol]);

            const ins = encodeInsulation[insLabel] || 1;

            if (isNaN(sqft) || isNaN(year) || isNaN(rating)) {
                return null; 
            }
            return { sqft, year, ins, rating };
        }).filter(row => row !== null);

        if (dataset.length === 0) {
            showError("No valid numeric rows found after mapping. Check your column choices.");
            return;
        }

        console.log("Mapped dataset rows:", dataset.length);
        clearError();
        renderDashboard();
        alert("Mapping applied and dashboard updated!");
    });
}


function showStats() {
    const statsDiv = document.getElementById("stats");
    if (!statsDiv || dataset.length === 0) return;

    const avg = arr => arr.reduce((a,b)=>a+b,0) / arr.length;

    const sqftArr = dataset.map(d => d.sqft);
    const yearArr = dataset.map(d => d.year);
    const ratingArr = dataset.map(d => d.rating);

    statsDiv.innerHTML = `
        <p><b>Average Square Feet:</b> ${avg(sqftArr).toFixed(1)}</p>
        <p><b>Average Year Built:</b> ${avg(yearArr).toFixed(0)}</p>
        <p><b>Average Energy Rating:</b> ${avg(ratingArr).toFixed(1)}</p>
        <p><b>Number of Homes:</b> ${dataset.length}</p>
    `;
}


function trainModel() {
    if (dataset.length === 0) return;

    let w0 = 0, w1 = 0, w2 = 0, w3 = 0;
    const lr = 0.0000000015; 
    const epochs = 2000;
    const n = dataset.length;

    for (let epoch = 0; epoch < epochs; epoch++) {
        let g0 = 0, g1 = 0, g2 = 0, g3 = 0;

        for (const d of dataset) {
            const pred = w0 + w1*d.sqft + w2*d.year + w3*d.ins;
            const err = pred - d.rating;
            g0 += err;
            g1 += err * d.sqft;
            g2 += err * d.year;
            g3 += err * d.ins;
        }

        g0 /= n;
        g1 /= n;
        g2 /= n;
        g3 /= n;

        w0 -= lr * g0;
        w1 -= lr * g1;
        w2 -= lr * g2;
        w3 -= lr * g3;
    }

    model = { w0, w1, w2, w3 };
    console.log("Trained model:", model);
    computeAccuracy();
}

function computeAccuracy() {
    const accEl = document.getElementById("accuracyOutput");
    if (!accEl || !model || dataset.length === 0) return;

    const y = dataset.map(d => d.rating);
    const yPred = dataset.map(d =>
        model.w0 + model.w1*d.sqft + model.w2*d.year + model.w3*d.ins
    );
    const mean = y.reduce((a,b)=>a+b,0) / y.length;

    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < y.length; i++) {
        ssTot += (y[i] - mean) ** 2;
        ssRes += (y[i] - yPred[i]) ** 2;
    }

    const r2 = 1 - ssRes / ssTot;
    accEl.innerHTML = `Model Accuracy (R²): <b>${(r2*100).toFixed(2)}%</b>`;
}


function makePrediction() {
    if (!model) {
        alert("Please upload data, apply mapping, and let the model train first.");
        return;
    }

    const sqftInput = document.getElementById("sqftInput");
    const yearInput = document.getElementById("yearInput");
    const insInput = document.getElementById("insInput");
    const outEl = document.getElementById("predictionOutput");

    const sqft = Number(sqftInput.value);
    const year = Number(yearInput.value);
    const insLabel = insInput.value;
    const ins = encodeInsulation[insLabel] || 1;

    const pred = model.w0 + model.w1*sqft + model.w2*year + model.w3*ins;
    outEl.innerHTML = `Predicted Energy Rating: <b>${pred.toFixed(1)}</b>`;
}


window.makePrediction = makePrediction;


function buildCharts() {
    const barCtx = document.getElementById("barChart");
    const scatterCtx = document.getElementById("scatterChart");
    const lineCtx = document.getElementById("lineChart");

    if (!barCtx || !scatterCtx || !lineCtx || dataset.length === 0) return;

   
    if (barChart) barChart.destroy();
    if (scatterChart) scatterChart.destroy();
    if (lineChart) lineChart.destroy();

    barChart = new Chart(barCtx, {
        type: "bar",
        data: {
            labels: dataset.map((d, i) => "Home " + (i+1)),
            datasets: [{
                label: "Energy Rating",
                data: dataset.map(d => d.rating)
            }]
        }
    });

    scatterChart = new Chart(scatterCtx, {
        type: "scatter",
        data: {
            datasets: [{
                label: "Sqft vs Rating",
                data: dataset.map(d => ({ x: d.sqft, y: d.rating }))
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Square Feet" } },
                y: { title: { display: true, text: "Energy Rating" } }
            }
        }
    });

    lineChart = new Chart(lineCtx, {
        type: "line",
        data: {
            labels: dataset.map(d => d.year),
            datasets: [{
                label: "Rating by Year Built",
                data: dataset.map(d => d.rating)
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Year Built" } },
                y: { title: { display: true, text: "Energy Rating" } }
            }
        }
    });
}


function renderDashboard() {
    showStats();
    trainModel();
    buildCharts();
}
