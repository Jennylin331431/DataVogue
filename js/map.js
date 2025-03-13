const width = 960, height = 600;

class WorldMap {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.countryDataMap = new Map();
        this.tooltip = null;
        this.projection = null;
        this.path = null;
        this.svg = null;
        this.startYear = 2010;
        this.endYear = 2024;
        this.selectedMetric = "waste";
        this.originalWidth = 960;
        this.originalHeight = 600;
    }

    initVis() {
        this.svg = d3.select(this.containerId)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", `0 0 ${this.originalWidth} ${this.originalHeight}`)
            .classed("responsive-svg", true);

        // Tooltip, hidden by default
        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("font-size", "14px")
            .style("pointer-events", "none");

        this.projection = d3.geoMercator()
            .scale(150)
            .translate([this.originalWidth / 1.8, this.originalHeight / 1.5]);

        this.path = d3.geoPath().projection(this.projection);

        d3.select("#metricSelection").on("change", (event) => {
            this.selectedMetric = event.target.value;
            this.updateVis();
        });

        this.wrangleData();

        window.addEventListener("resize", () => this.handleResize());
    }

    handleResize() {
        const containerWidth = this.svg.node().getBoundingClientRect().width;
        const containerHeight = this.svg.node().getBoundingClientRect().height;

        // Reset to original dimensions if screen is large enough
        if (containerWidth >= this.originalWidth && containerHeight >= this.originalHeight) {
            this.projection
                .translate([this.originalWidth / 1.8, this.originalHeight / 1.5])
                .scale(150);
        } else {
            this.projection
                .translate([containerWidth / 1.8, containerHeight / 1.5])
                .scale(Math.min(containerWidth / 6, containerHeight / 3));
        }

        // Update paths
        this.svg.selectAll("path")
            .attr("d", this.path);
    }

    updateYearRange(startYear, endYear) {
        this.startYear = startYear;
        this.endYear = endYear;
        this.wrangleData(); // Re-filter the data based on new year range
    }

    wrangleData() {
        let vis = this;

        // Filter dataset based on year range
        vis.filteredData = vis.data.filter(d => d.Year >= vis.startYear && d.Year <= vis.endYear);

        vis.countryDataMap.clear();

        const countryNameFixes = {
            "USA": "United States of America",
            "UK": "United Kingdom",
            "Russia": "Russian Federation",
            "South Korea": "Korea, Republic of",
            "Iran": "Iran, Islamic Republic of",
            "Venezuela": "Venezuela, Bolivarian Republic of",
            "Vietnam": "Viet Nam"
        };

        vis.filteredData.forEach(d => {
            let countryName = d.Country.trim();
            if (countryNameFixes[countryName]) {
                countryName = countryNameFixes[countryName]; // fix name if necessary
            }

            // Parse numeric values
            let waste = parseFloat(d.Waste_Production_KG) || 0;
            let carbonFootprint = parseFloat(d.Carbon_Footprint_MT) || 0;
            let water_usage = parseFloat(d.Water_Usage_Liters) || 0;

            if (!vis.countryDataMap.has(countryName)) {
                vis.countryDataMap.set(countryName, {
                    waste: 0, carbonFootprint: 0, water_usage: 0, count: 0
                });
            }

            // Accumulate sums and count
            let countryStats = vis.countryDataMap.get(countryName);
            countryStats.waste += waste;
            countryStats.water_usage += water_usage;
            countryStats.carbonFootprint += carbonFootprint;
            countryStats.count += 1;
        });

        // Ensure USA & UK are included
        vis.countryDataMap.set("United States of America", vis.countryDataMap.get("United States of America") || { waste: 0, water_usage: 0, carbonFootprint: 0, count: 0 });
        vis.countryDataMap.set("United Kingdom", vis.countryDataMap.get("United Kingdom") || { waste: 0, water_usage: 0, carbonFootprint: 0, count: 0 });


        vis.updateVis();
        
    }

    updateLegend(colorScale, minValue, maxValue) {
        let vis = this;
    
        let legendSvg = d3.select("#legendSvg");
        legendSvg.selectAll("*").remove();
    
        let legendWidth = 300;
        let legendHeight = 20;
    
        let defs = legendSvg.append("defs");
        let gradient = defs.append("linearGradient")
            .attr("id", "gradientColor")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");
    
        let stops = d3.range(0, 1.1, 0.2);
        stops.forEach((t) => {
            gradient.append("stop")
                .attr("offset", `${t * 100}%`)
                .attr("stop-color", colorScale(minValue + t * (maxValue - minValue)));
        });
    
        legendSvg.append("rect")
            .attr("x", 0)
            .attr("y", 10)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#gradientColor)");
    
        let legendScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([0, legendWidth]);
    
        let legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => d3.format(".2s")(d));
    
        legendSvg.append("g")
            .attr("transform", `translate(0, ${legendHeight + 10})`)
            .call(legendAxis);
    }
    

    updateVis() {
        let vis = this;
    
        Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        ]).then(([world]) => {
            // Convert TopoJSON to GeoJSON and filter out Antarctica
            const countries = topojson.feature(world, world.objects.countries).features;
            const filteredCountries = countries.filter(country => {
                return country.properties.name !== "Antarctica"; // Filter out Antarctica
            });
    
            // Compute min & max values for selected metric
            let minValue = d3.min([...vis.countryDataMap.values()], d => d[vis.selectedMetric] / d.count || 0);
            let maxValue = d3.max([...vis.countryDataMap.values()], d => d[vis.selectedMetric] / d.count || 0);
    
            // Define color scale
            let colorScale = d3.scaleSequential(d3.interpolateReds)
                .domain([minValue, maxValue]);
    
            // Update country colors
            vis.svg.selectAll("path")
                .data(filteredCountries)
                .join("path")
                .attr("d", vis.path)
                .attr("fill", d => {
                    let countryStats = vis.countryDataMap.get(d.properties.name);
                    return countryStats ? colorScale(countryStats[vis.selectedMetric] / countryStats.count || 0) : "#ccc";
                })
                .attr("stroke", "#333")
                .on("mouseover", (event, d) => {
                    let countryName = d.properties.name;
                    let stats = vis.countryDataMap.get(countryName);
    
                    vis.tooltip.transition().duration(200).style("opacity", 1);
    
                    if (stats) {
                        let avgWaste = stats.waste / stats.count;
                        let avgWaterUsage = stats.water_usage / stats.count;
                        let avgCarbonFootprint = stats.carbonFootprint / stats.count;
    
                        let tooltipHTML = `
                            <strong>${countryName}</strong><br>
                            Waste: ${avgWaste.toLocaleString()} KG<br>
                            Water Usage: ${avgWaterUsage.toLocaleString()} Liters<br>
                            Carbon Footprint: ${avgCarbonFootprint.toLocaleString()} Megatonnes
                        `;
    
                        vis.tooltip.html(tooltipHTML);
    
                        vis.tooltip.style("left", (event.pageX + 10) + "px")
                                   .style("top", (event.pageY - 10) + "px");
    
                        // vis.createTooltipBarChart();
                    } else {
                        vis.tooltip.html(`<strong>${countryName}</strong><br>Data Not Collected`);
                    }
    
                    d3.select(event.currentTarget).style("stroke", "black");
                })
                .on("mousemove", (event) => {
                    let tooltipWidth = vis.tooltip.node().offsetWidth;
                    let tooltipHeight = vis.tooltip.node().offsetHeight;
                    
                    let posX = event.pageX + 15;
                    let posY = event.pageY + 15;

                    // prevent tooltip from going outside the right edge
                    if (posX + tooltipWidth > window.innerWidth) {
                        posX = event.pageX - tooltipWidth - 15;
                    }

                    // prevent tooltip from going outside the bottom edge
                    if (posY + tooltipHeight > window.innerHeight) {
                        posY = event.pageY - tooltipHeight - 15;
                    }

                    vis.tooltip.style("left", `${posX}px`)
                            .style("top", `${posY}px`);
                                })
                .on("mouseout", (event) => {
                    vis.tooltip.transition().duration(200).style("opacity", 0);
                    d3.select(event.currentTarget).style("stroke", "#333");
                });
    
            vis.updateLegend(colorScale, minValue, maxValue);
        }).catch(error => {
            console.error("Error loading world data:", error);
        });
        // vis.createBarChart();
    }
    
    // create an embedded bar chart inside the tooltip
    // createBarChart() {
    //     let vis = this;

    //     // Prepare data for the bar chart
    //     let wasteData = [...vis.countryDataMap.entries()]
    //         .map(([country, stats]) => {
    //             let displayName = country;
    //             if (country === "United States of America") displayName = "USA";
    //             if (country === "United Kingdom") displayName = "UK";
    //             return { country: displayName, waste: stats.waste };
    //         })
    //         .sort((a, b) => b.waste - a.waste)

    //     // Select the bar chart container
    //     let svg = d3.select("#bar-chart");
    //     svg.selectAll("*").remove(); // Clear previous chart

    //     // Define dimensions and margins
    //     let width = 800;
    //     let height = 300;
    //     let margin = { top: 20, right: 20, bottom: 40, left: 50 };

    //     // Create scales
    //     let xScale = d3.scaleLinear()
    //         .domain([0, d3.max(wasteData, d => d.waste)])
    //         .range([0, width - margin.left - margin.right]);

    //     let yScale = d3.scaleBand()
    //         .domain(wasteData.map(d => d.country))
    //         .range([0, height - margin.top - margin.bottom])
    //         .padding(0.1);

    //     // Create SVG group for the chart
    //     let chart = svg.append("g")
    //         .attr("transform", `translate(${margin.left},${margin.top})`);

    //     // Add bars
    //     chart.selectAll("rect")
    //         .data(wasteData)
    //         .join("rect")
    //         .attr("y", d => yScale(d.country))
    //         .attr("width", d => xScale(d.waste))
    //         .attr("height", yScale.bandwidth())
    //         .attr("fill", "steelblue"); // Customize bar color

    //     // Add labels
    //     chart.selectAll("text")
    //         .data(wasteData)
    //         .join("text")
    //         .attr("x", d => xScale(d.waste) + 5) // Position text inside bars
    //         .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2)
    //         .attr("dy", ".35em")
    //         .style("fill", "white")
    //         .style("font-size", "12px")
    //         .text(d => d.waste.toLocaleString());

    //     // Add axes
    //     chart.append("g")
    //         .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
    //         .call(d3.axisBottom(xScale));

    //     chart.append("g")
    //         .call(d3.axisLeft(yScale));
    // }
    
}