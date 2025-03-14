class BigFootCarbonViz {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.svg = null;
        this.footSizeScale = null;
        this.selectedMaterial = "Vegan Leather";
        this.processedData = new Map();
        this.sortOrder = "random";
        this.initVis();
    }

    initVis() {
        this.svg = d3.select("#bigfoot-svg")
            .attr("width", 1200)
            .attr("height", 400);
    
        d3.select("#materialSelection").on("change", (event) => {
            this.selectedMaterial = event.target.value;
            console.log("Selected Material:", this.selectedMaterial);
            this.wrangleData();
        });

        d3.select("#sortButton").on("click", () => {
            if (this.sortOrder === "random") {
                this.sortOrder = "desc";
            } else if (this.sortOrder === "desc") {
                this.sortOrder = "asc";
            } else {
                this.sortOrder = "random";
            }
            this.updateVis();
        });

        this.wrangleData();
    }    

    wrangleData() {
        let vis = this;
    
        let filteredData = vis.data.filter(d => d.Material_Type === vis.selectedMaterial);
    
        vis.processedData.clear();
        filteredData.forEach(d => {
            let country = d.Country;
            let carbonFootprint = parseFloat(d.Carbon_Footprint_MT) || 0;
            
            if (!vis.processedData.has(country)) {
                vis.processedData.set(country, 0);
            }
            vis.processedData.set(country, vis.processedData.get(country) + carbonFootprint);
        });
    
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
    
        let sortedData = [...vis.processedData.entries()];
    
        // Sort data based on user selection
        if (vis.sortOrder === "asc") {
            sortedData.sort((a, b) => a[1] - b[1]); // Ascending order
        } else if (vis.sortOrder === "desc") {
            sortedData.sort((a, b) => b[1] - a[1]); // Descending order
        } else {
            // Randomize order
            sortedData = sortedData.sort(() => Math.random() - 0.5);
        }
    
        // define scale for foot size with fixed range
        let maxFootprint = d3.max(sortedData, d => d[1]);
        let minFootprint = d3.min(sortedData, d => d[1]);
        vis.footSizeScale = d3.scaleSqrt()
            .domain([minFootprint, maxFootprint])
            .range([60, 100]);

        let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
        let spacing = 1000 / (sortedData.length + 1) + 40; 
    
        let maxFootSize = vis.footSizeScale(maxFootprint);
    
        let countryGroups = vis.svg.selectAll(".country-foot")
            .data(sortedData, d => d[0]);
    
        countryGroups.exit()
            .transition().duration(500)
            .attr("opacity", 0)
            .remove();
    
        let enterGroups = countryGroups.enter().append("g")
            .attr("class", "country-foot")
            .attr("transform", (d, i) => `translate(${spacing * (i + 1)}, 130)`)
            .attr("opacity", 0);
    
        // append footprint emoji
        enterGroups.append("text")
            .attr("class", "footprint")
            .attr("text-anchor", "middle")
            .style("font-size", d => `${vis.footSizeScale(d[1])}px`)
            .style("fill", (d, i) => colorScale(i))
            .text("🦶");
    
        // append carbon footprint value
        enterGroups.append("text")
            .attr("class", "carbon-value")
            .attr("y", d => -vis.footSizeScale(d[1]))
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "14px")
            .text(d => d3.format(".2f")(d[1]) + " MT");
    
        // append country name (below foot)
        enterGroups.append("text")
            .attr("class", "country-label")
            .attr("y", maxFootSize - 50)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "15px")
            .text(d => d[0]);
    
        let updateGroups = countryGroups.merge(enterGroups)
            .transition().duration(800)
            .attr("opacity", 1)
            .attr("transform", (d, i) => `translate(${spacing * (i + 1)}, 130)`);
    
        updateGroups.select(".footprint")
            .style("font-size", d => `${vis.footSizeScale(d[1])}px`)
            .style("fill", (d, i) => colorScale(i));
    
        updateGroups.select(".carbon-value")
            .attr("y", d => -vis.footSizeScale(d[1]))
            .text(d => d3.format(".2f")(d[1]) + " MT");
    
        updateGroups.select(".country-label")
            .attr("y", maxFootSize - 50) // align all labels at the same level
            .text(d => d[0]);
    
        // update sort button text
        let sortButtonText = "Sort ";
        if (vis.sortOrder === "asc") {
            sortButtonText += "▲";
        } else if (vis.sortOrder === "desc") {
            sortButtonText += "▼";
        } else {
            sortButtonText += "🔄";
        }
        d3.select("#sortButton").text(sortButtonText);
    }
}