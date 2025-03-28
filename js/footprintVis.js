const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const scaleFactor = Math.min(1, screenWidth / 1200);

console.log(`Screen size: ${screenWidth}px wide × ${screenHeight}px tall`);


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
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", `0 0 ${screenWidth} 400`)
            .classed("responsive-svg", true);

        d3.select("#materialSelection").on("change", (event) => {
            this.selectedMaterial = event.target.value;
            this.wrangleData();
        });

        d3.select("#sortButton").on("click", () => {
            this.sortOrder = this.sortOrder === "random" ? "desc" : this.sortOrder === "desc" ? "asc" : "random";
            this.updateVis();
        });

        // Add Average CF Display
        d3.select("#averageCFContainer").html("<strong>Average Carbon Footprint: </strong><span id='avgCFValue'></span> MT");

        // Add Legend for Above/Below Average
        d3.select("#cfLegend").html(`
            <span style="color: green; font-weight: bold;">⬤ Below Avg</span> 
            <span style="margin-left: 10px; color: red; font-weight: bold;">⬤ Above Avg</span>
        `);

        this.wrangleData();

        window.addEventListener("resize", () => this.handleResize());
    }

    handleResize() {
        const newWidth = window.innerWidth;
        this.svg.attr("viewBox", `0 0 ${newWidth} 400`);
        this.updateVis();
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

        // Compute Average Carbon Footprint
        let totalFootprint = [...vis.processedData.values()].reduce((sum, val) => sum + val, 0);
        vis.averageFootprint = totalFootprint / vis.processedData.size;
        d3.select("#avgCFValue").text(d3.format(",.2f")(vis.averageFootprint));

        vis.updateVis();
    }

    updateVis() {
        let vis = this;
    
        let sortedData = [...vis.processedData.entries()];
    
        if (vis.sortOrder === "asc") {
            sortedData.sort((a, b) => a[1] - b[1]);
        } else if (vis.sortOrder === "desc") {
            sortedData.sort((a, b) => b[1] - a[1]);
        } else {
            sortedData = sortedData.sort(() => Math.random() - 0.5);
        }
    
        const screenWidth = window.innerWidth;
        const scaleFactor = Math.min(1, screenWidth / 1200);  // scale down on smaller screens
    
        let maxFootprint = d3.max(sortedData, d => d[1]);
        let minFootprint = d3.min(sortedData, d => d[1]);
    
        vis.footSizeScale = d3.scaleSqrt()
            .domain([minFootprint, maxFootprint])
            .range([60 * scaleFactor, 100 * scaleFactor]);
    
        let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
        let containerWidth = this.svg.node().getBoundingClientRect().width;
        let spacing = containerWidth / (vis.processedData.size + 1);
    
        const flagUrls = {
            "USA": "https://flagcdn.com/w40/us.png",
            "India": "https://flagcdn.com/w40/in.png",
            "Australia": "https://flagcdn.com/w40/au.png",
            "France": "https://flagcdn.com/w40/fr.png",
            "Japan": "https://flagcdn.com/w40/jp.png",
            "UK": "https://flagcdn.com/w40/gb.png",
            "Brazil": "https://flagcdn.com/w40/br.png",
            "China": "https://flagcdn.com/w40/cn.png",
            "Germany": "https://flagcdn.com/w40/de.png",
            "Italy": "https://flagcdn.com/w40/it.png"
        };
    
        let countryGroups = vis.svg.selectAll(".country-foot")
            .data(sortedData, d => d[0]);
    
        countryGroups.exit()
            .transition().duration(500)
            .attr("opacity", 0)
            .remove();
    
        let enterGroups = countryGroups.enter().append("g")
            .attr("class", "country-foot")
            .attr("transform", (d, i) => `translate(${spacing * (i + 1)}, 150)`)
            .attr("opacity", 0);
    
        // Foot icon (image)
        enterGroups.append("image")
            .attr("class", "footprint-icon")
            .attr("x", d => -vis.footSizeScale(d[1]) / 2)
            .attr("y", d => -vis.footSizeScale(d[1]) + 20 * scaleFactor)
            .attr("width", d => vis.footSizeScale(d[1]))
            .attr("height", d => vis.footSizeScale(d[1]))
            .attr("href", "img/foot.png");
    
        // Carbon value text
        enterGroups.append("text")
            .attr("class", "carbon-value")
            .attr("y", d => -vis.footSizeScale(d[1]) - 10 * scaleFactor)
            .attr("text-anchor", "middle")
            .style("fill", d => d[1] > vis.averageFootprint ? "red" : "green")
            .style("font-size", `${14 * scaleFactor}px`)
            .text(d => d3.format(".2f")(d[1]) + " MT");
    
        // Flag image
        enterGroups.append("image")
            .attr("class", "country-flag")
            .attr("x", -25 * scaleFactor)
            .attr("y", vis.footSizeScale(maxFootprint) - 50 * scaleFactor)
            .attr("width", 22 * scaleFactor)
            .attr("height", 15 * scaleFactor)
            .attr("href", d => flagUrls[d[0]] || "");
    
        // Country label
        enterGroups.append("text")
            .attr("class", "country-label")
            .attr("x", 5 * scaleFactor)
            .attr("y", vis.footSizeScale(maxFootprint) - 40 * scaleFactor)
            .attr("text-anchor", "start")
            .style("fill", "black")
            .style("font-size", `${15 * scaleFactor}px`)
            .text(d => d[0]);
    
        // Update positions + size
        let updateGroups = countryGroups.merge(enterGroups)
            .transition().duration(800)
            .attr("opacity", 1)
            .attr("transform", (d, i) => `translate(${spacing * (i + 1)}, 150)`);
    
        updateGroups.select(".footprint-icon")
            .attr("x", d => -vis.footSizeScale(d[1]) / 2)
            .attr("y", d => -vis.footSizeScale(d[1]) + 20 * scaleFactor)
            .attr("width", d => vis.footSizeScale(d[1]))
            .attr("height", d => vis.footSizeScale(d[1]));
    
        updateGroups.select(".carbon-value")
            .attr("y", d => -vis.footSizeScale(d[1]) - 10 * scaleFactor)
            .style("fill", d => d[1] > vis.averageFootprint ? "red" : "green")
            .style("font-size", `${14 * scaleFactor}px`)
            .text(d => d3.format(".2f")(d[1]) + " MT");
    
        updateGroups.select(".country-flag")
            .attr("x", -25 * scaleFactor)
            .attr("y", vis.footSizeScale(maxFootprint) - 50 * scaleFactor)
            .attr("width", 22 * scaleFactor)
            .attr("height", 15 * scaleFactor)
            .attr("href", d => flagUrls[d[0]] || "");
    
        updateGroups.select(".country-label")
            .attr("x", 5 * scaleFactor)
            .attr("y", vis.footSizeScale(maxFootprint) - 40 * scaleFactor)
            .style("font-size", `${15 * scaleFactor}px`)
            .text(d => d[0]);
    
        let sortButtonText = "Sort ";
        sortButtonText += vis.sortOrder === "asc" ? "▲" : vis.sortOrder === "desc" ? "▼" : "▲▼";
        d3.select("#sortButton").text(sortButtonText);
    }
    
}