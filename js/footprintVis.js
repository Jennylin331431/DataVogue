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
            .attr("width", "100%")
            .attr("height", "auto")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 1500 400")
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

        let maxFootprint = d3.max(sortedData, d => d[1]);
        let minFootprint = d3.min(sortedData, d => d[1]);
        vis.footSizeScale = d3.scaleSqrt()
            .domain([minFootprint, maxFootprint])
            .range([60, 100]);

        let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        let containerWidth = this.svg.node().getBoundingClientRect().width;
        let spacing = containerWidth / (vis.processedData.size + 1);

        // mapping for country flags
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

        // append footprint emoji
        enterGroups.append("image")
            .attr("class", "footprint-icon")
            .attr("x", d => -vis.footSizeScale(d[1]) / 2)
            .attr("y", d => -vis.footSizeScale(d[1]) + 20)
            .attr("width", d => vis.footSizeScale(d[1]))
            .attr("height", d => vis.footSizeScale(d[1])) 
            .attr("href", "../img/foot.png");


        // append carbon footprint value
        enterGroups.append("text")
            .attr("class", "carbon-value")
            .attr("y", d => -vis.footSizeScale(d[1]) - 10)
            .attr("text-anchor", "middle")
            .style("fill", d => d[1] > vis.averageFootprint ? "red" : "green")
            .style("font-size", "14px")
            .text(d => d3.format(".2f")(d[1]) + " MT");

        // append country flag to the left of the country name
        enterGroups.append("image")
            .attr("class", "country-flag")
            .attr("x", -25)
            .attr("y", vis.footSizeScale(maxFootprint) - 30)
            .attr("width", 22)
            .attr("height", 15)
            .attr("href", d => flagUrls[d[0]] || "");

        // append country name beside the flag
        enterGroups.append("text")
            .attr("class", "country-label")
            .attr("x", 5)
            .attr("y", vis.footSizeScale(maxFootprint) - 40)
            .attr("text-anchor", "start")
            .style("fill", "black")
            .style("font-size", "15px")
            .text(d => d[0]);

        let updateGroups = countryGroups.merge(enterGroups)
            .transition().duration(800)
            .attr("opacity", 1)
            .attr("transform", (d, i) => `translate(${spacing * (i + 1)}, 150)`);

        updateGroups.select(".footprint-icon")
            .transition().duration(800)
            .attr("x", d => -vis.footSizeScale(d[1]) / 2)
            .attr("y", d => -vis.footSizeScale(d[1]) + 20)
            .attr("width", d => vis.footSizeScale(d[1]))
            .attr("height", d => vis.footSizeScale(d[1]));
        

        updateGroups.select(".carbon-value")
            .attr("y", d => -vis.footSizeScale(d[1]) - 10)
            .style("fill", d => d[1] > vis.averageFootprint ? "red" : "green")
            .text(d => d3.format(",.2f")(d[1]) + " MT");

        updateGroups.select(".country-flag")
            .attr("y", vis.footSizeScale(maxFootprint) - 30)
            .attr("href", d => flagUrls[d[0]] || "");

        updateGroups.select(".country-label")
            .attr("x", 5)
            .attr("y", vis.footSizeScale(maxFootprint) - 20)
            .text(d => d[0]);

        let sortButtonText = "Sort ";
        sortButtonText += vis.sortOrder === "asc" ? "▲" : vis.sortOrder === "desc" ? "▼" : "▲▼";
        d3.select("#sortButton").text(sortButtonText);
    }
}