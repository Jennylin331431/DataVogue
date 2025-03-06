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

    vis.svg
      .append("rect")
      .attr("width", vis.width + vis.margin.left + vis.margin.right)
      .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .style("opacity", 0)
      .on("touchmouse mousemove", function (event) {
        const mousePos = d3.pointer(event, this);
        console.log(mousePos);
        const date = vis.x.invert(mousePos[0]);
        const index = d3.bisect(vis.displayData, date); // highlight-line

        // Custom Bisector - left, center, right <= bisector options
        vis.xAccessor = (d) => d.time;
        vis.yAccessor = (d) => d.sales_count;

        const dateBisector = d3.bisector(vis.xAccessor).left;
        const bisectionIndex = dateBisector(vis.displayData, date);
        const hoveredIndexData = vis.displayData[bisectionIndex - 1];

        let xPosition = vis.x(hoveredIndexData.time);
        let yPosition = vis.y(hoveredIndexData.sales_count);

        vis.tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 30}px`);

        vis.tooltip
          .select(".tooltip-sales")
          .text(`$${hoveredIndexData.sales_count}`);

        const dateFormatter = d3.timeFormat("%b, %Y");

        vis.tooltip
          .select(".tooltip-date")
          .text(`${dateFormatter(hoveredIndexData.time)}`);

        // Update tooltip line position
        vis.tooltipLine
          .attr("x1", xPosition) // x position of the first end of the line
          .attr("y1", 0) // y position of the first end of the line
          .attr("x2", xPosition) // x position of the second end of the line
          .attr("y2", vis.height)
          .style("opacity", 1);
      })
      .on("mouseleave", function (event) {
        vis.tooltipLine.style("opacity", 0);
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

    // Update the visualization
    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // Update domains
    vis.y.domain([
      0,
      d3.max(vis.displayData, function (d) {
        return d.sales_count;
      }),
    ]);
    vis.x.domain(d3.extent(vis.displayData, (d) => d.time));

    // draw lines
    let lines = vis.svg.selectAll(".line").data([vis.displayData]);

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
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);

    // Configure axis with explicit tick formatting
    vis.xAxis
      .ticks(d3.timeMonth.every(3))
      .tickFormat(d3.timeFormat("%b\n%Y")); // Add newline between month and year
    // rotate x ticks
    vis.svg
      .select(".x-axis")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  }
}
