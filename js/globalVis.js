const chartMargin = { top: 40, right: 100, bottom: 50, left: 60 };
const chartWidth = 900 - chartMargin.left - chartMargin.right;
const chartHeight = 450 - chartMargin.top - chartMargin.bottom;

// SVG container
const chartsvg = d3.select("#global-line-chart")
    .attr("width", chartWidth + chartMargin.left + chartMargin.right)
    .attr("height", chartHeight + chartMargin.top + chartMargin.bottom)
    .append("g") 
    .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

d3.csv("data/plasticTextilesData.csv").then(data => {
    // Parse and prepare the data
    data.forEach(d => {
        d.Production_Year = +d.Production_Year;  
        d.Greenhouse_Gas_Emissions = +d.Greenhouse_Gas_Emissions;
        d.Pollutants_Emitted = +d.Pollutants_Emitted;
        d.Waste_Generation = +d.Waste_Generation;
        d.Water_Consumption = +d.Water_Consumption;
    });

    const aggregatedData = Array.from(d3.group(data, d => d.Production_Year), ([year, values]) => ({
        Production_Year: year,
        averageGreenhouseGasEmissions: d3.mean(values, v => v.Greenhouse_Gas_Emissions),
        averagePollutantsEmitted: d3.mean(values, v => v.Pollutants_Emitted),
        averageWasteGeneration: d3.mean(values, v => v.Waste_Generation),
        averageWaterConsumption: d3.mean(values, v => v.Water_Consumption)
    }));

    // Log the aggregated data to verify
    console.log(aggregatedData);

    // Define scales
    const xScale = d3.scaleBand()
        .domain([2018, 2019, 2020, 2021, 2022])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => Math.max(
            d.averageGreenhouseGasEmissions,
            d.averagePollutantsEmitted,
            d.averageWasteGeneration,
            d.averageWaterConsumption
        ))])
        .range([chartHeight, 0]);

    // Define line generators for each metric
    const lineGenerator = metric => d3.line()
            .x(d => xScale(d.Production_Year)) 
            .y(d => yScale(d[metric]));

    // Metrics to plot
    const metrics = [
        { key: "averageGreenhouseGasEmissions", color: "steelblue" },
        { key: "averagePollutantsEmitted", color: "red" },
        { key: "averageWasteGeneration", color: "green" },
        { key: "averageWaterConsumption", color: "purple" }
    ];

    // Draw lines for each metric
    metrics.forEach(metric => {
        chartsvg.append("path")
            .datum(aggregatedData)  
            .attr("fill", "none")
            .attr("stroke", metric.color)
            .attr("stroke-width", 2)
            .attr("d", lineGenerator(metric.key));
    });

    // Add axes
    chartsvg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale));

    chartsvg.append("g")
        .call(d3.axisLeft(yScale));

    // Axes abels
    chartsvg.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + chartMargin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Production Year");

    chartsvg.append("text")
        .attr("x", -chartHeight / 2)
        .attr("y", -chartMargin.left + 15)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-size", "14px")
        .text("Average Environmental Impact Metrics");

    // Add legend
    const legendContainer = d3.select(".legend-container")
        .style("display", "flex")
        .style("gap", "15px")
        .style("flex-wrap", "wrap")
        .style("margin-top", "10px");

    metrics.forEach((metric) => {
        const legendItem = legendContainer.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "5px");

        legendItem.append("div")
            .style("width", "12px")
            .style("height", "12px")
            .style("background-color", metric.color);

        legendItem.append("span")
            .text(metric.key.replace(/average/g, "").replace(/_/g, " ").trim())
            .style("font-size", "12px");
    });

    // Chart title
    chartsvg.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Average Environmental Impacts Over Time"); 
});
