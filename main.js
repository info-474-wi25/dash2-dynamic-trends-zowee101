// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_RENAME = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_RENAME = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("aircraft_incidents.csv").then(data => {
    // Relevant columns:
    // - number of incidents (y variable)
    // - year (x variable)
    // - injury severity (color variable)

    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        let dateParts = d.Event_Date.split("/"); // Split MM/DD/YY
        let twoDigitYear = +dateParts[2]; // Convert YY to a number

        // Convert to four-digit year as a number
        d.year = twoDigitYear < 50 ? 2000 + twoDigitYear : 1900 + twoDigitYear;

        if (d.Injury_Severity.includes("Non-Fatal")) {
            d.Injury_Severity = "Non-Fatal";  // Must check this first!
        } else if (d.Injury_Severity.includes("Fatal")) {
            d.Injury_Severity = "Fatal";
        } else {
            d.Injury_Severity = "Incident"; // Default category
        }
    });

    const groupedData = d3.rollup(data,
        v => v.length,  // Count incidents
        d => d.year,    // Group by Year
        d => d.Injury_Severity // Group by normalized Injury Severity
    );

    const yearCounts = Array.from(groupedData.values())
    .map(severityMap => Array.from(severityMap.values()));

    const maxCount = d3.max(yearCounts, severityCounts => d3.max(severityCounts));

    console.log("Grouped Data:", groupedData);
    console.log("Max Count:", maxCount);

    // 3.a: SET SCALES FOR CHART 1


    // 4.a: PLOT DATA FOR CHART 1


    // 5.a: ADD AXES FOR CHART 1


    // 6.a: ADD LABELS FOR CHART 1


    // 7.a: ADD INTERACTIVITY FOR CHART 1
    

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2


});