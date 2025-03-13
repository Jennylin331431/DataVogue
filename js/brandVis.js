class BrandLineChart {
  constructor(parentElement, data) {
    this.data = data;
    this.parentElement = parentElement;
    this.years = [2018, 2019, 2020, 2021, 2022];
    this.displayData = data;

  }

  /* Initialize visualization */
  initVis() {
    let vis = this;

    // Set margins and calculate the width and height of the plot
    vis.brandMargin = { top: 40, right: 40, bottom: 50, left: 60 };
    vis.brandWidth =
      document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.brandMargin.left -
      vis.brandMargin.right;
    vis.brandHeight =
      document.getElementById(vis.parentElement).getBoundingClientRect()
        .height -
      vis.brandMargin.top -
      vis.brandMargin.bottom;

    // SVG container
    vis.svg = d3
      .select("#" + vis.parentElement)
      .attr(
        "width",
        vis.brandWidth + vis.brandMargin.left + vis.brandMargin.right
      )
      .attr(
        "height",
        vis.brandHeight + vis.brandMargin.top + vis.brandMargin.bottom
      )
      .append("g")
      .attr(
        "transform",
        `translate(${vis.brandMargin.left},${vis.brandMargin.top})`
      ); // Adjust group position to account for margins

       // Create a new group container for the lines
    // vis.linesGroup = vis.svg.append("g").attr("class", "lines-group");
      
    // Define scales
    vis.xScale = d3
      .scalePoint()
      .domain(vis.years)
      .range([0, vis.brandWidth])
      .padding(0.5);

    vis.yScale = d3
      .scaleLinear()
      .domain([0, d3.max(vis.data, (d) => d.Waste_Generation)])
      .range([vis.brandHeight, 0]);

    // Define line generator
    vis.lineGenerator = d3
      .line()
      .x((d) => vis.xScale(d.Year))
      .y((d) => vis.yScale(d.Waste_Generation))
      .curve(d3.curveLinear);

    // Add axes
    vis.svg
      .append("g")
      .attr("transform", `translate(0,${vis.brandHeight})`)
      .call(d3.axisBottom(vis.xScale))
      .attr("color", "black");

    vis.svg.append("g").call(d3.axisLeft(vis.yScale)).attr("color", "black");

    // Axes labels
    vis.svg
      .append("text")
      .attr("x", vis.brandWidth / 2)
      .attr("y", vis.brandHeight + vis.brandMargin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Year");

    vis.svg
      .append("text")
      .attr("x", -vis.brandHeight / 2)
      .attr("y", -vis.brandMargin.left + 15)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .style("font-size", "14px")
      .text("Waste Generation");

    // Chart title
    vis.svg
      .append("text")
      .attr("x", vis.brandWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Waste Generation over Time by Brands");

    vis.wrangleData();
  }

  /* Data wrangling */
  wrangleData() {
    let vis = this;

    // Selected brands
    vis.selectedBrands = [
      "Nike",
      "Adidas",
      "Urban Outfitters",
      "Zara",
      "Forever 21",
    ];

    // Filter by product type AND selected brands
    vis.selectedBrandsData = vis.displayData.filter(
      (d) =>
        d.Product_Type === selectedProductType &&
        vis.selectedBrands.includes(d.Company) // Add this line
    );

    // Rest of the code remains the same
    // Aggregate waste generation by year and brand
    let aggregatedData = d3.rollups(
      vis.selectedBrandsData,
      (v) => d3.sum(v, (d) => d.Waste_Generation),
      (d) => d.Company,
      (d) => d.Production_Year
    );

    // Convert to a flat structure
    vis.selectedBrandsData = aggregatedData.flatMap(([company, years]) =>
      years.map(([year, totalWaste]) => ({
        Company: company,
        Production_Year: year,
        Waste_Generation: totalWaste,
      }))
    );

    // Ensure chronological order
    vis.selectedBrandsData.sort((a, b) =>
      d3.ascending(a.Production_Year, b.Production_Year)
    );

    // Update scales
    vis.yScale.domain([
      0,
      d3.max(vis.selectedBrandsData, (d) => d.Waste_Generation),
    ]);

    vis.updateVis();
  }
  /* Update visualization */
  updateVis() {
    let vis = this;

     // Group data by brand
  let brands = d3.group(vis.selectedBrandsData, (d) => d.Company);
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  console.log(brands);

  // Bind data to the existing path elements (lines)
  let lines = vis.svg
    .selectAll("path.line")
    .data(Array.from(brands), (d) => d[0]);

  // Exit phase: Remove lines that are no longer in the data
  lines.exit().remove();

  // Update phase: Update existing lines with new data
  lines
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .transition() // Optional: Add transition for smooth updates
    .duration(500)
    .attr("d", (d) => {
      const brandData = d[1].map((data) => ({
        Year: data.Production_Year,
        Waste_Generation: data.Waste_Generation,
      }));
      brandData.sort((a, b) => d3.ascending(a.Year, b.Year)); // Ensure chronological order
      return vis.lineGenerator(brandData);
    });

  // Enter phase: Append new lines for new brands
  lines
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", (d) => colorScale(d[0])) // Color based on brand
    .attr("stroke-width", 2)
    .attr("d", (d) => {
      const brandData = d[1].map((data) => ({
        Year: data.Production_Year,
        Waste_Generation: data.Waste_Generation,
      }));
      brandData.sort((a, b) => d3.ascending(a.Year, b.Year)); // Ensure chronological order
      return vis.lineGenerator(brandData);
    })
    .transition()
    .duration(500); // Optional: Add transition for smooth line appearance

    // add legend 
    vis.svg.selectAll(".legend").remove();
    let legend = vis.svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${vis.brandWidth + vis.brandMargin.right - 30}, 10)`
      ); // Adjust to place right of the chart

    // Position legend items vertically
    vis.selectedBrands.forEach((brand, i) => {
      legend
        .append("rect")
        .attr("x", -90)
        .attr("y", i * 20 + 220) 
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", colorScale(brand));

      legend
        .append("text")
        .attr("x", -70) 
        .attr("y", i * 20 + 232)
        .text(brand)
        .style("font-size", "12px"); 
    });
  }
}
