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
    const dateParts = d.Event_Date.split("/");
    const twoDigitYear = +dateParts[2];

    // Convert to four-digit year as a number
    d.year = twoDigitYear < 50 ? 2000 + twoDigitYear : 1900 + twoDigitYear;

    // Normalize Injury_Severity
    if (d.Injury_Severity.includes("Non-Fatal")) {
      d.Injury_Severity = "Non-Fatal";
    } else if (d.Injury_Severity.includes("Fatal")) {
      d.Injury_Severity = "Fatal";
    } else {
      d.Injury_Severity = "Incident"; // default category
    }
  });

  // GROUP DATA by severity -> year -> count
  const categories = d3.rollup(
    data,
    arr => d3.rollup(arr, v => v.length, d => d.year),
    d => d.Injury_Severity
  );

  const yearCounts = Array.from(categories.values())
    .map(yearMap => Array.from(yearMap.values()));

  const maxCount = d3.max(yearCounts, countsThisCat => d3.max(countsThisCat));

  // 3.a: SET SCALES FOR CHART 1
  const allYears = Array.from(categories.values())
    .flatMap(yearMap => Array.from(yearMap.keys()));

  const xScale = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, maxCount + 1])
    .range([height, 0])
    .nice();

  const colorScale = d3.scaleOrdinal()
    .domain(Array.from(categories.keys()))
    .range(d3.schemeCategory10);

  // LINE GENERATOR
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.count));

  // 4.a: PLOT DATA FOR CHART 1
  const lineData = Array.from(categories.entries());

  // 5.a: ADD AXES
  svgLine.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  svgLine.append("g")
    .call(d3.axisLeft(yScale));

  // 6.a: ADD LABELS
  svgLine.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Year");

  svgLine.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Number of Incidents");

  // 7.a: ADD INTERACTIVITY
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  function updateChart() {
    const showFatal    = d3.select("#chkFatal").property("checked");
    const showNonFatal = d3.select("#chkNonFatal").property("checked");
    const showIncident = d3.select("#chkIncident").property("checked");

    // 1) Filter lineData
    const filteredData = lineData.filter(([severity]) => {
      if (severity === "Fatal")     return showFatal;
      if (severity === "Non-Fatal") return showNonFatal;
      if (severity === "Incident")  return showIncident;
      return false;
    });

    // 2) Draw lines
    const paths = svgLine.selectAll(".severity-line")
      .data(filteredData, d => d[0]);

    paths.exit().remove();

    paths.enter().append("path")
      .attr("class", "severity-line")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .merge(paths)
      .attr("stroke", d => colorScale(d[0]))
      .transition().duration(500)
      .attr("d", ([severity, yearMap]) => {
        const points = Array.from(yearMap.entries())
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => d3.ascending(a.year, b.year));
        return line(points);
      });

    // 3) Flatten data
    let filteredFlattenedData = [];
    filteredData.forEach(([severity, yearMap]) => {
      const points = Array.from(yearMap.entries()).map(([year, count]) => ({
        severity,
        year,
        count
      }));
      filteredFlattenedData = filteredFlattenedData.concat(points);
    });

    // 4) Circles
    const circles = svgLine.selectAll(".data-point")
      .data(filteredFlattenedData);

    circles.exit().remove();

    circles.enter()
      .append("circle")
      .attr("class", "data-point")
      .merge(circles)
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.count))
      .attr("r", 5)
      .style("fill", d => colorScale(d.severity))
      .style("opacity", 0)
      .on("mouseover", function(event, d) {
        tooltip.style("visibility", "visible")
          .html(`
            <strong>Year:</strong> ${d.year}<br>
            <strong>Severity:</strong> ${d.severity}<br>
            <strong>Incidents:</strong> ${d.count}
          `)
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");

        d3.select(this).style("opacity", 1);

        svgLine.append("circle")
          .attr("class", "hover-circle")
          .attr("cx", xScale(d.year))
          .attr("cy", yScale(d.count))
          .attr("r", 6)
          .style("fill", colorScale(d.severity))
          .style("stroke-width", 2)
          .style("stroke", "#333");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
        svgLine.selectAll(".hover-circle").remove();
        d3.select(this).style("opacity", 0);
      });
  }

  updateChart();

  d3.select("#chkFatal")   .on("change", updateChart);
  d3.select("#chkNonFatal").on("change", updateChart);
  d3.select("#chkIncident").on("change", updateChart);

}); 
