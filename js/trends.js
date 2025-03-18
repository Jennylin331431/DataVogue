class Trends {
  // constructor method to initialize LineChart object
  constructor(parentElement, data) {
    this.parentElement = parentElement;
    this.data = data;
    this.displayData = [];
    this.filteredData = [];

    this.selectedPattern = "None"; // could be '2019', '2020', etc. for filtering by year
    this.selectedColor = "None"; // could be 'Male', 'Female', or 'all'
  }

  /*
   * Method that initializes the visualization (static content, e.g. SVG area or axes)
   */
  initVis() {
    let vis = this;

    vis.margin = { top: 0, right: 40, bottom: 60, left: 70 };

    vis.width =
      document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    vis.height =
      document.getElementById(vis.parentElement).getBoundingClientRect()
        .height -
      vis.margin.top -
      vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3
      .select("#" + vis.parentElement)
      .append("svg")
      .attr("width", vis.width + vis.margin.left + vis.margin.right)
      .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + vis.margin.left + "," + vis.margin.top + ")"
      );

    vis.svg
      .append("rect")
      .attr("width", vis.width + vis.margin.left + vis.margin.right)
      .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .style("opacity", 0)
      .on("touchmouse mousemove", function (event) {
        const mousePos = d3.pointer(event, this);
        console.log(mousePos);
        const date = vis.x.invert(mousePos[0]);
        const index = d3.bisect(vis.displayDataMale, date); // highlight-line

        // Custom Bisector - left, center, right <= bisector options
        vis.xAccessor = (d) => d.time;
        vis.yAccessor = (d) => d.sales_count;

        const dateBisector = d3.bisector(vis.xAccessor).left;
        const bisectionIndex = dateBisector(vis.displayDataMale, date);
        const hoveredIndexMaleData = vis.displayDataMale[bisectionIndex - 1];
        const hoveredIndexFemaleData =
          vis.displayDataFemale[bisectionIndex - 1];

        let xPosition = vis.x(hoveredIndexMaleData.time);
        let yPosition = vis.y(hoveredIndexMaleData.sales_count);

        let femaleData = hoveredIndexFemaleData.sales_count;
        let maleData = hoveredIndexMaleData.sales_count;

        // Calculate the relative difference as absolute difference or percentage
        let absoluteDifference = maleData - femaleData;
        let percentageDifference = (absoluteDifference / femaleData) * 100;

        vis.tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 30}px`);

        vis.tooltip.select(".tooltip-sales").html(`
      <strong>Male Sales:</strong> ${maleData}<br>
      <strong>Female Sales:</strong> ${femaleData}<br>
      <strong>Abs Diff (M-F): </strong> ${
        absoluteDifference >= 0 ? "+" : "-"
      }${Math.abs(absoluteDifference)} <br>
       <strong>Rel Diff: </strong> 
      (${
        absoluteDifference >= 0 ? "+" : "-"
      }${Math.abs(percentageDifference).toFixed(2)}%)
    
    `);

        const dateFormatter = d3.timeFormat("%Y");

        vis.tooltip
          .select(".tooltip-date")
          .html(
            `<strong>Year: </strong> ${dateFormatter(
              hoveredIndexMaleData.time
            )}`
          );

        // Update tooltip line position
        vis.tooltipLine
          .attr("x1", xPosition) // x position of the first end of the line
          .attr("y1", 0) // y position of the first end of the line
          .attr("x2", xPosition) // x position of the second end of the line
          .attr("y2", vis.height)
          .style("opacity", 1);
      })
      .on("mouseout", function (event) {
        vis.tooltipLine.style("opacity", 0);
        vis.tooltip.style("display", "none");
      });

    // scales
    vis.x = d3.scaleTime().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    // axis
    vis.xAxis = d3.axisBottom(vis.x);
    vis.yAxis = d3.axisLeft(vis.y);

    vis.svg
      .append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0," + vis.height + ")");
    vis.svg.append("g").attr("class", "y-axis axis");

    // line generator
    vis.line = d3
      .line()
      .curve(d3.curveLinear)
      .x((d) => vis.x(d.time))
      .y((d) => vis.y(d.sales_count));

    // tooltip line
    vis.tooltip = d3.select("#tooltip-line-chart");
    vis.tooltipLine = vis.svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("stroke", "#fc8781")
      .attr("stroke-width", 2)
      .style("opacity", 1);

    // axis labels
    vis.svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", vis.width / 2)
      .attr("y", vis.height + vis.margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Date");

    vis.svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -vis.height / 2)
      .attr("y", -vis.margin.left + 20)
      .attr("text-anchor", "middle")
      .text("Sales Count");

    vis.createLegend();
    vis.wrangleData();
  }

  /*
   * Data wrangling
   */
  wrangleData() {
    let vis = this;

    vis.filteredData = vis.data;

    if (vis.selectedPattern !== "None") {
      // If a specific pattern is selected, filter data accordingly
      vis.filteredData = vis.filteredData.filter(
        (d) => d.pattern === vis.selectedPattern
      ); // assuming selectedPattern is a year
    }

    // Filter data based on selectedColor (e.g., Male or Female)
    if (vis.selectedColor !== "None") {
      vis.filteredData = vis.filteredData.filter(
        (d) => d.color === vis.selectedColor
      );
    }

    // Aggregate sales count by time
    let salesByGenderAndTime = d3.group(
      vis.filteredData,
      (d) => d.time,
      (d) => d.gender
    );

    // Prepare the data for each gender (male, female)
    let maleData = [];
    let femaleData = [];

    // Loop through the time groups and separate by gender
    salesByGenderAndTime.forEach((genderGroup, time) => {
      let maleSales = genderGroup.get("Male") || []; // Get male sales for this time, default to empty array
      let femaleSales = genderGroup.get("Female") || []; // Get female sales for this time, default to empty array

      // Sum sales for male and female
      maleData.push({
        time: time,
        sales_count: d3.sum(maleSales, (d) => d.sales_count),
      });

      femaleData.push({
        time: time,
        sales_count: d3.sum(femaleSales, (d) => d.sales_count),
      });
    });

    vis.displayDataMale = maleData;
    vis.displayDataFemale = femaleData;

    // Update the visualization
    vis.updateVis();
  }

  // Method to create legend for Male and Female
  createLegend() {
    let vis = this;

    // Define legend items
    let legendData = [
      { label: "Male", color: "#1f78b4" },
      { label: "Female", color: "red" },
    ];

    // Select the legend container and append an SVG
    let legendSvg = d3
      .select("#trends-legends")
      .append("svg")
      .attr("width", 150)
      .attr("height", 60);

    // Add each legend item
    let legendItem = legendSvg
      .selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 30})`); // Position each item vertically

    // Add color boxes
    legendItem
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", (d) => d.color);

    // Add labels
    legendItem
      .append("text")
      .attr("x", 30)
      .attr("y", 15)
      .style("font-size", "14px")
      .text((d) => d.label);
  }

  updateVis() {
    let vis = this;

    // Update domains
    vis.y.domain([
      0,
      d3.max(
        [...vis.displayDataMale, ...vis.displayDataFemale], // Combine both male and female data to calculate max y-value
        function (d) {
          return d.sales_count;
        }
      ) * 1.1,
    ]);
    vis.x.domain(
      d3.extent(
        [...vis.displayDataMale, ...vis.displayDataFemale],
        (d) => d.time
      )
    );

    // Draw line for Male
    let maleLine = vis.svg.selectAll(".male-line").data([vis.displayDataMale]);
    maleLine
      .enter()
      .append("path")
      .attr("class", "male-line")
      .merge(maleLine)
      .style("fill", "none")
      .style("stroke", "#1f78b4") // Color for male line (blue)
      .style("stroke-width", 2)
      .transition()
      .duration(1000)
      .attr("d", vis.line);

    maleLine.exit().remove();

    // Add circles for Male data points
    let maleCircles = vis.svg
      .selectAll(".male-circle")
      .data(vis.displayDataMale);

    maleCircles
      .enter()
      .append("circle")
      .attr("class", "male-circle")
      .merge(maleCircles)
      .transition() // Adding transition for path drawing
      .duration(1000)
      .attr("cx", (d) => vis.x(d.time)) // X position of the circle
      .attr("cy", (d) => vis.y(d.sales_count)) // Never go below 3px from top
      .attr("r", 4) // Radius of the circle
      .style("fill", "#1f78b4"); // Circle color for male

    maleCircles.exit().remove();

    // Draw line for Female
    let femaleLine = vis.svg
      .selectAll(".female-line")
      .data([vis.displayDataFemale]);
    femaleLine
      .enter()
      .append("path")
      .attr("class", "female-line")
      .merge(femaleLine)
      .style("fill", "none")
      .style("stroke", "red") // Color for female line (pink)
      .style("stroke-width", 2)
      .transition() // Adding transition for path drawing
      .duration(1000)
      .attr("d", vis.line);

    femaleLine.exit().remove();

    // Add circles for Female data points
    let femaleCircles = vis.svg
      .selectAll(".female-circle")
      .data(vis.displayDataFemale);
    femaleCircles
      .enter()
      .append("circle")
      .attr("class", "female-circle")
      .merge(femaleCircles)
      .transition() // Adding transition for path drawing
      .duration(1000)
      .attr("cx", (d) => vis.x(d.time)) // X position of the circle
      .attr("cy", (d) => vis.y(d.sales_count))
      .attr("r", 4) // Radius of the circle
      .style("fill", "red"); // Circle color for female

    femaleCircles.exit().remove();

    vis.xAxis.ticks(5).tickFormat((d) => d.getFullYear()); // Format ticks to display only the year

    // Update axes
    vis.svg
      .select(".x-axis")
      .transition() // Adding transition for path drawing
      .duration(1000)
      .call(vis.xAxis);
    vis.svg
      .select(".y-axis")
      .transition() // Adding transition for path drawing
      .duration(1000)
      .call(vis.yAxis);

    // Rotate x-axis labels
    vis.svg
      .select(".x-axis")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  }
}
