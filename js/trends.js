class Trends {
  // constructor method to initialize LineChart object
  constructor(parentElement, data) {
    this.parentElement = parentElement;
    this.data = data;
    this.displayData = [];

    // Set colors (for multiple categories if needed)
    let colors = [
      "#a6cee3",
      "#1f78b4",
      "#b2df8a",
      "#33a02c",
      "#fb9a99",
      "#e31a1c",
      "#fdbf6f",
      "#ff7f00",
      "#cab2d6",
      "#6a3d9a",
    ];

    // Set the color scale for different categories, if you plan to use categories
    this.colorScale = d3.scaleOrdinal().range(colors);
  }

  /*
   * Method that initializes the visualization (static content, e.g. SVG area or axes)
   */
  initVis() {
    let vis = this;

    vis.margin = { top: 40, right: 40, bottom: 60, left: 70 };

    vis.width =
      800 -
      //   document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    vis.height =
      500 -
      //   document.getElementById(vis.parentElement).getBoundingClientRect()
      // .height -
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

    // TO-DO (Activity II): Line generator
    vis.line = d3
      .line()
      .curve(d3.curveLinear) // Adjust curve as necessary
      .x((d) => vis.x(d.time))
      .y((d) => vis.y(d.sales_count));

    // TO-DO (Activity IV): Add Tooltip placeholder
    vis.tooltip = vis.svg
      .append("text")
      .attr("x", 5)
      .attr("y", 5)
      .attr("class", "tooltip-custom");

    // TO-DO: (Filter, aggregate, modify data)
    vis.wrangleData();
  }

  /*
   * Data wrangling
   */
  wrangleData() {
    let vis = this;

    // Aggregate sales count by time
    let salesByTime = d3.group(vis.data, (d) => d.time);

    // Sum sales count for each time
    vis.displayData = Array.from(salesByTime, ([time, sales]) => {
      console.log("#time", time);
      return {
        time: time,
        sales_count: d3.sum(sales, (d) => d.sales_count), // Sum the sales_count for each year
      };
    });
    console.log("#dis", vis.displayData);
    // Update the visualization
    vis.updateVis();
  }

  /*
   * The drawing function - should use the D3 update sequence (enter, update, exit)
   * Function parameters only needed if different kinds of updates are needed
   */
  updateVis() {
    console.log("#updateVis");
    let vis = this;

    // Update domain
    vis.y.domain([
      0,
      d3.max(vis.displayData, function (d) {
        return d.sales_count;
      }),
    ]);

    vis.x.domain(d3.extent(vis.displayData, (d) => d.time));

    // Draw the line
    // let line = vis.svg.selectAll(".line").data(vis.displayData);
    // Bind data as a single array and update line
    const lines = vis.svg.selectAll(".line").data([vis.displayData]); // Data as array of arrays

    lines
      .enter()
      .append("path")
      .attr("class", "line")
      .merge(lines)
      .style("fill", "none")
      .style("stroke", "#33a02c")
      .style("stroke-width", 2)
      .attr("d", vis.line);

    lines.exit().remove();

    // Update axes
    vis.svg.select(".x-axis").call(vis.xAxis); // Rotate the text 45 degrees counterclockwise
    vis.svg.select(".y-axis").call(vis.yAxis);

    vis.xAxis.tickFormat(d3.timeFormat("%b %Y")); // Format as "Month Day, Year"


    // Rotate X tick labels
    vis.svg.select(".x-axis")
      .selectAll("text")  // Select all the text elements of the x-axis
      .attr("transform", "rotate(-45)")  // Rotate the text 45 degrees counterclockwise
      .style("text-anchor", "end");  // Align the text to the end (bottom-right for readability)


      // Add mouseover and mouseout events for tooltip
    vis.svg
      .selectAll(".line")
      .on("mouseover", function (event, d) {
        console.log("#d on mouse", d)
        // Make the tooltip visible
        vis.tooltip
          .style("visibility", "visible")
          .text(
            `Time: ${d.time.getMonth() + 1}/${d.time.getFullYear()} - Sales: ${d.sales_count}`
          );
      })
      .on("mousemove", function (event, d) {
        // Position the tooltip near the mouse
        vis.tooltip
          .attr("x", event.pageX + 10)
          .attr("y", event.pageY - 10);
      })
      .on("mouseout", function (event, d) {
        // Hide the tooltip
        vis.tooltip.style("visibility", "hidden");
      });
 

}
}
