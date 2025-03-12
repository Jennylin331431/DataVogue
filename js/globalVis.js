// Average Global Environmental Impact Line Chart

class GlobalLineChart{
    // constructor method to initialize object
   constructor(parentElement, data){
       this.data = data;
       this.parentElement = parentElement;
       this.displayData = data;
       this.selectedYears = [2018, 2019, 2020, 2021, 2022]; 
       this.selectedMetrics = ["averageGreenhouseGasEmissions", 
                               "averagePollutantsEmitted", 
                               "averageWasteGeneration", 
                               "averageWaterConsumption"]; // going to change to be a filer option 
   }

   /* Initialize visualization */
   initVis() {
       let vis = this;

       vis.chartMargin = { top: 40, right: 160, bottom: 50, left: 60 };
       vis.chartWidth = 900 - vis.chartMargin.left - vis.chartMargin.right;
       vis.chartHeight = 450 - vis.chartMargin.top - vis.chartMargin.bottom;

       // SVG container
       vis.chartsvg = d3.select("#global-line-chart")
       .attr("width", vis.chartWidth + vis.chartMargin.left + vis.chartMargin.right)
       .attr("height", vis.chartHeight + vis.chartMargin.top + vis.chartMargin.bottom)
       .append("g") 
       .attr("transform", `translate(${vis.chartMargin.left},${vis.chartMargin.top})`);

       // Define scales
       vis.xScale = d3.scalePoint()
            .domain(vis.selectedYears)
            .range([0, vis.chartWidth])
            .padding(0.5); 
           
       vis.yScale = d3.scaleLinear()
       .domain([0, d3.max(vis.data, d => Math.max(
           d.averageGreenhouseGasEmissions,
           d.averagePollutantsEmitted,
           d.averageWasteGeneration,
           d.averageWaterConsumption
       ))])
       .range([vis.chartHeight, 0]);

       // Define line generator
       vis.lineGenerator = metric => d3.line()
           .x(d => vis.xScale(d.Production_Year))
           .y(d => vis.yScale(d[metric]));

       // Metrics to plot
       vis.metrics = [
           { key: "averageGreenhouseGasEmissions", color: "steelblue" },
           { key: "averagePollutantsEmitted", color: "red" },
           { key: "averageWasteGeneration", color: "green" },
           { key: "averageWaterConsumption", color: "purple" }
       ];
       
       // Add axes
       vis.chartsvg.append("g")
           .attr("transform", `translate(0,${vis.chartHeight})`)
           .call(d3.axisBottom(vis.xScale));

       vis.chartsvg.append("g")
           .call(d3.axisLeft(vis.yScale));

       // Axes abels
       vis.chartsvg.append("text")
           .attr("x", vis.chartWidth / 2)
           .attr("y", vis.chartHeight + vis.chartMargin.bottom - 10)
           .attr("text-anchor", "middle")
           .style("font-size", "14px")
           .text("Production Year");

       vis.chartsvg.append("text")
           .attr("x", -vis.chartHeight / 2)
           .attr("y", -vis.chartMargin.left + 15)
           .attr("text-anchor", "middle")
           .attr("transform", "rotate(-90)")
           .style("font-size", "14px")
           .text("Average Environmental Impact Metrics");

       // Chart title
       vis.chartsvg.append("text")
           .attr("x", vis.chartWidth / 2)
           .attr("y", -10)
           .attr("text-anchor", "middle")
           .style("font-size", "16px")
           .text("Average Environmental Impacts Over Time"); 

       vis.wrangleData();
   }

   /* Data wrangling */
   wrangleData() {
    let vis = this;

    // Filter data based on selected years (include in next protoype)
    // vis.displayData = vis.data.filter(d => vis.selectedYears.includes(d.year)); 

    // Update based on category selected
    if (selectedCategory == 'gasData') {
        vis.selectedMetrics = ["averageGreenhouseGasEmissions"];
    }
    else if (selectedCategory == 'pollutantsData'){
        vis.selectedMetrics = ["averagePollutantsEmitted"];
    }
    else if (selectedCategory == 'wasteData'){
        vis.selectedMetrics = ["averageWasteGeneration"];
    }
    else if (selectedCategory == 'waterData'){
        vis.selectedMetrics = ["averageWaterConsumption"];
    }
    else {
        vis.selectedMetrics = ["averageGreenhouseGasEmissions", "averagePollutantsEmitted", "averageWasteGeneration", "averageWaterConsumption"];
    }

    console.log(vis.selectedMetrics)

    // Update scales
    vis.xScale.domain(vis.selectedYears);
    vis.yScale.domain([0, d3.max(vis.displayData, d => d3.max(vis.selectedMetrics.map(metric => d[metric])))]);

    vis.updateVis();
}

   /*
   * Update visualization
   */
   updateVis() {
       let vis = this;

       // Clear previous paths
       vis.chartsvg.selectAll("path.metric-line").remove();

       // Draw lines for selected metrics
       console.log(vis.displayData)
       console.log(vis.selectedMetrics)
       vis.selectedMetrics.forEach(metric => {
           vis.chartsvg.append("path")
               .datum(vis.displayData)
               .attr("class", "metric-line")
               .attr("fill", "none")
               .attr("stroke", vis.metrics.find(m => m.key === metric)?.color || "black")
               .attr("stroke-width", 2)
               .attr("d", vis.lineGenerator(metric));
       });

       // Update axes
       vis.chartsvg.selectAll(".x-axis").remove();
       vis.chartsvg.append("g")
           .attr("class", "x-axis")
           .attr("transform", `translate(0,${vis.chartHeight})`)
           .call(d3.axisBottom(vis.xScale));

       vis.chartsvg.selectAll(".y-axis").remove();
       vis.chartsvg.append("g")
           .attr("class", "y-axis")
           .call(d3.axisLeft(vis.yScale));

       // Add legend
       vis.chartsvg.selectAll(".legend").remove();
       let legend = vis.chartsvg.append("g").attr("class", "legend").attr("transform", `translate(${vis.chartWidth + 10}, 10)`);
       vis.selectedMetrics.forEach((metric, i) => {
           legend.append("rect")
               .attr("x", 0)
               .attr("y", i * 20)
               .attr("width", 12)
               .attr("height", 12)
               .attr("fill", vis.metrics.find(m => m.key === metric)?.color || "black");
           legend.append("text")
               .attr("x", 20)
               .attr("y", i * 20 + 10)
               .text(metric.replace("average", "").replace(/([A-Z])/g, " $1").trim());
       });
   }
   }

