// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create an SVG container inside #lineChart1
const svgLine = d3.select("#lineChart1")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 2.a: LOAD and TRANSFORM DATA
d3.csv("aircraft_incidents.csv").then(data => {

  data.forEach(d => {
    const dateParts = d.Event_Date.split("/"); // Split MM/DD/YY
    const twoDigitYear = +dateParts[2];        // Convert YY to a number

    // Convert to four-digit year as a number
    d.year = twoDigitYear < 50 ? 2000 + twoDigitYear : 1900 + twoDigitYear;

    // Normalize Injury_Severity
    if (d.Injury_Severity.includes("Non-Fatal")) {
      d.Injury_Severity = "Non-Fatal";  // Must check this first!
    } else if (d.Injury_Severity.includes("Fatal")) {
      d.Injury_Severity = "Fatal";
    } else {
      d.Injury_Severity = "Incident"; // Default category
    }
  });

// GROUP DATA by severity -> year -> count
const categories = d3.rollup(data,
    arr => d3.rollup(arr,
      v => v.length,    // aggregator
      d => d.year       // second-level grouping by year
    ),
    d => d.Injury_Severity  // top-level grouping by severity
  );

const yearCounts = Array.from(categories.values())
    .map(yearMap => 
        Array.from(yearMap.values()));

const maxCount = d3.max(yearCounts, countsThisCat => d3.max(countsThisCat));

// 3.a: SET SCALES FOR CHART 1
const allYears = Array.from(categories.values())
    .flatMap(yearMap => Array.from(yearMap.keys()));

// Define xScale
const xScale = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, width]);

// Define yScale
const yScale = d3.scaleLinear()
    .domain([0, maxCount + 1])
    .range([height, 0])
    .nice();

// Define colorScale
const colorScale = d3.scaleOrdinal()
  .domain(Array.from(categories.keys()))   // e.g. ["Fatal", "Non-Fatal", "Incident"]
  .range(d3.schemeCategory10);

// LINE GENERATOR
const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.count));

// 4.a: PLOT DATA FOR CHART 1
const lineData = Array.from(categories.entries());

// CREATE PATHS (one per severity)
svgLine.selectAll("path")
.data(lineData)
.enter()
.append("path")
.attr("fill", "none")
.attr("stroke-width", 2)
.attr("stroke", d => colorScale(d[0])) // d[0] is the severity key
.attr("d", ([severity, yearMap]) => {
    // Convert the yearMap => array of points
    const points = Array.from(yearMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => d3.ascending(a.year, b.year));
    return line(points);
});

// 5.a: ADD AXES FOR CHART 1
// X-AXIS
svgLine.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
        .tickFormat(d3.format("d")));

// Y-AXIS
svgLine.append("g")
    .call(d3.axisLeft(yScale));

// 6.a: ADD LABELS FOR CHART 1
// X-axis label
svgLine.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Year");

// Y-axis label
svgLine.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Number of Incidents");

// 7.a: ADD INTERACTIVITY FOR CHART 1

});
