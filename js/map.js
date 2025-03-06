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
    }

    initVis() {
        this.svg = d3.select(this.containerId)
            .attr("width", width)
            .attr("height", height);

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
            .scale(170)
            .translate([width / 1.5, height / 1.5]);

        this.path = d3.geoPath().projection(this.projection);

        this.wrangleData();
    }

    wrangleData() {
        const countryNameFixes = {
            "USA": "United States of America",
            "UK": "United Kingdom",
            "Russia": "Russian Federation",
            "South Korea": "Korea, Republic of",
            "Iran": "Iran, Islamic Republic of",
            "Venezuela": "Venezuela, Bolivarian Republic of",
            "Vietnam": "Viet Nam"
        };

        this.data.forEach(d => {
            let countryName = d.Country.trim();
            if (countryNameFixes[countryName]) {
                countryName = countryNameFixes[countryName]; // fix name if necessary
            }

            // Parse numeric values
            let waste = parseFloat(d.Waste_Production_KG) || 0;
            let carbonFootprint = parseFloat(d.Carbon_Footprint_MT) || 0;
            let water_usage = parseFloat(d.Water_Usage_Liters) || 0;

            if (!this.countryDataMap.has(countryName)) {
                this.countryDataMap.set(countryName, {
                    waste: 0, carbonFootprint: 0, water_usage: 0, count: 0
                });
            }

            // Accumulate sums and count
            let countryStats = this.countryDataMap.get(countryName);
            countryStats.waste += waste;
            countryStats.water_usage += water_usage;
            countryStats.carbonFootprint += carbonFootprint;
            countryStats.count += 1;
        });

        // Ensure USA & UK are included
        this.countryDataMap.set("United States of America", this.countryDataMap.get("United States of America") || { waste: 0, water_usage: 0, carbonFootprint: 0, count: 0 });
        this.countryDataMap.set("United Kingdom", this.countryDataMap.get("United Kingdom") || { waste: 0, water_usage: 0, carbonFootprint: 0, count: 0 });

        this.updateVis();
    }

    updateVis() {
        Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        ]).then(([world]) => {
            const countries = topojson.feature(world, world.objects.countries).features;

            // Draw Countries
            this.svg.append("g")
                .selectAll("path")
                .data(countries)
                .join("path")
                .attr("d", this.path)
                .attr("fill", d => this.countryDataMap.has(d.properties.name) ? "red" : "#ccc")
                .attr("stroke", "#333")
                .on("mouseover", (event, d) => {
                    let countryName = d.properties.name;
                    let stats = this.countryDataMap.get(countryName);

                    this.tooltip.transition().duration(200).style("opacity", 1);

                    if (stats) {
                        // Calculate averages
                        let avgWaste = stats.waste / stats.count;
                        let avgWaterUsage = stats.water_usage / stats.count;
                        let avgCarbonFootprint = stats.carbonFootprint / stats.count;

                        // Format numbers with commas and no decimals
                        this.tooltip.html(
                            `<strong>${countryName}</strong><br>
                            Waste: ${avgWaste.toLocaleString(undefined, { maximumFractionDigits: 0 })} KG<br>
                            Water Usage: ${avgWaterUsage.toLocaleString(undefined, { maximumFractionDigits: 0 })} Liters<br>
                            Carbon Footprint: ${avgCarbonFootprint.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT (megatonnes)`
                        );
                    } else {
                        // If no data, show "data not collected"
                        this.tooltip.html(
                            `<strong>${countryName}</strong><br>Data Not Collected`
                        );
                    }

                    this.tooltip.style("left", (event.pageX + 10) + "px")
                               .style("top", (event.pageY - 10) + "px");

                    d3.select(event.currentTarget).style("stroke", "black");
                })
                .on("mouseout", (event) => {
                    this.tooltip.transition().duration(200).style("opacity", 0);
                    d3.select(event.currentTarget).style("stroke", "#333");
                });
        }).catch(error => {
            console.error("Error loading world data:", error);
        });
    }
}
