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
        this.originalHeight = 470;
    }

    initVis() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        this.dynamicWidth = screenWidth;
        this.dynamicHeight = Math.min(screenHeight, 960);

        let scaleFactor;
        if (screenWidth > 1200) {
            scaleFactor = this.dynamicWidth / 6;
        } else if (screenWidth > 900) {
            scaleFactor = this.dynamicWidth / 5.5;
        } else if (screenWidth > 600) {
            scaleFactor = this.dynamicWidth / 4.5;
        } else {
            scaleFactor = this.dynamicWidth / 4; // smaller screens need bigger scale
        }

        this.svg = d3.select(this.containerId)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", `0 0 ${this.dynamicWidth} ${this.dynamicHeight}`)
            .classed("responsive-svg", true)

        this.projection = d3.geoMercator()
            .scale(scaleFactor)
            .translate([this.dynamicWidth / 2, this.dynamicHeight / 1.5]);

    
        this.path = d3.geoPath().projection(this.projection);
        
        // Tooltip, hidden by default
        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgb(194, 167, 236)")
            .style("color", "black")
            .style("font-family", "Georgia")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("font-size", "14px")
            .style("pointer-events", "none");

            d3.select("#metricSelection").on("change", (event) => {
                this.selectedMetric = event.target.value;
                this.updateVis();
            });
    
            this.wrangleData();
    
            window.addEventListener("resize", () => this.handleResize());
    }

    handleResize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
    
        this.dynamicWidth = screenWidth ;
        this.dynamicHeight = Math.min(screenHeight , 960);
    
        this.svg
            .attr("viewBox", `0 0 ${this.dynamicWidth} ${this.dynamicHeight}`);
    
        let scaleFactor;
        if (screenWidth > 1200) {
            scaleFactor = this.dynamicWidth / 6;
        } else if (screenWidth > 900) {
            scaleFactor = this.dynamicWidth / 5.5;
        } else if (screenWidth > 600) {
            scaleFactor = this.dynamicWidth / 4.5;
        } else {
            scaleFactor = this.dynamicWidth / 4;
        }

        this.projection
            .translate([this.dynamicWidth / 2, this.dynamicHeight / 1.5])
            .scale(scaleFactor);

        this.path = d3.geoPath().projection(this.projection);
    
        // Redraw countries with new projection
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
        let legendHeight = 10;
    
        let defs = legendSvg.append("defs");
        let gradient = defs.append("linearGradient")
            .attr("id", "gradientColor")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");
    
        let numTicks = 5;  // Control number of ticks
        let tickValues = d3.range(0, numTicks).map(i => minValue + (i / (numTicks - 1)) * (maxValue - minValue));
        tickValues = [...new Set([minValue, ...tickValues, maxValue])];

        tickValues.forEach((val, i) => {
            gradient.append("stop")
                .attr("offset", `${(i / (tickValues.length - 1)) * 100}%`)
                .attr("stop-color", colorScale(val));
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
            .tickFormat(d => {
                if (vis.selectedMetric === "water_usage") {
                    return (d / 1e6).toFixed(3) + "M";
                }
                return d3.format(".0f")(d);
            });
    
            legendSvg.append("g")
            .attr("transform", `translate(0, ${legendHeight + 15})`)
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "11px")
            .attr("dy", "5px");
    }
    
    

    updateVis() {
        let vis = this;
    
        Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        ]).then(([world]) => {
            // convert TopoJSON to GeoJSON and filter out Antarctica and greenland
            const countries = topojson.feature(world, world.objects.countries).features;
            const filteredCountries = countries.filter(country => {
                return country.properties.name !== "Antarctica" && country.properties.name !== "Greenland";
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
                        let avgWaste = Math.round(stats.waste / stats.count); // No decimals
                        let avgWaterUsage = (stats.water_usage / stats.count / 1e6).toFixed(3); // Convert to million liters (X.YYZ format)
                        let avgCarbonFootprint = Math.round(stats.carbonFootprint / stats.count); // No decimals

                        let tooltipHTML = `<strong style="font-size: 18px;">${countryName}</strong><br>`;
                
                        tooltipHTML += `
                            <strong>🗑️:</strong> <span>${avgWaste.toLocaleString()} KG</span><br>
                            <strong>💧:</strong> <span>${avgWaterUsage} million liters</span><br>
                            <strong>👣:</strong> <span>${avgCarbonFootprint.toLocaleString()} Megatonnes</span>
                        `;

                
                        vis.tooltip.html(tooltipHTML);
                
                        vis.tooltip.style("left", (event.pageX + 10) + "px")
                                   .style("top", (event.pageY - 10) + "px");
                
                    } else {
                        vis.tooltip.html(`<strong style="font-size: 18px;">${countryName}</strong><br>Data Not Collected`);
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
    }
}