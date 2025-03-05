
const width = 960, height = 600;

const svg = d3.select("#world-map")
    .attr("width", width)
    .attr("height", height);

// tooltip, hidden by default
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("font-size", "14px")
    .style("pointer-events", "none");

const projection = d3.geoMercator()
    .scale(170)
    .translate([width / 1.5, height / 1.5]);

const path = d3.geoPath().projection(projection);

// name fixes
const countryNameFixes = {
    "USA": "United States of America",
    "UK": "United Kingdom",
    "Russia": "Russian Federation",
    "South Korea": "Korea, Republic of",
    "Iran": "Iran, Islamic Republic of",
    "Venezuela": "Venezuela, Bolivarian Republic of",
    "Vietnam": "Viet Nam"
};

// load the world map and dataset
Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("data/sustainable_fashion_trends.csv")
]).then(([world, data]) => {
    console.log("World data loaded:", world);
    console.log("Dataset loaded:", data);

    const countries = topojson.feature(world, world.objects.countries).features;

    let countryDataMap = new Map();
    data.forEach(d => {
        let countryName = d.Country.trim();
        if (countryNameFixes[countryName]) {
            countryName = countryNameFixes[countryName]; // fix name if necessary
        }

        // parse numeric values
        let waste = parseFloat(d.Waste_Production_KG) || 0;
        let carbonFootprint = parseFloat(d.Carbon_Footprint_MT) || 0;
        let water_usage = parseFloat(d.Water_Usage_Liters) || 0;

        if (!countryDataMap.has(countryName)) {
            countryDataMap.set(countryName, {
                waste: 0, carbonFootprint: 0, water_usage: 0, count: 0
            });
        }

        // accumulate sums and count
        let countryStats = countryDataMap.get(countryName);
        countryStats.waste += waste;
        countryStats.water_usage += water_usage;
        countryStats.carbonFootprint += carbonFootprint;
        countryStats.count += 1;
    });

    // ensure USA & UK are included
    countryDataMap.set("United States of America", countryDataMap.get("United States of America") || { waste: 0, water_usage: 0, carbonFootprint: 0, count: 0 });
    countryDataMap.set("United Kingdom", countryDataMap.get("United Kingdom") || { waste: 0, water_usage: 0, carbonFootprint: 0, count: 0 });

    // draw Countries
    svg.append("g")
        .selectAll("path")
        .data(countries)
        .join("path")
        .attr("d", path)
        .attr("fill", d => countryDataMap.has(d.properties.name) ? "red" : "#ccc")
        .attr("stroke", "#333")
        .on("mouseover", function(event, d) {
            let countryName = d.properties.name;
            let stats = countryDataMap.get(countryName);

            tooltip.transition().duration(200).style("opacity", 1);

            if (stats) {
                // calculate averages
                let avgWaste = stats.waste / stats.count;
                let avgWaterUsage = stats.water_usage / stats.count;
                let avgCarbonFootprint = stats.carbonFootprint / stats.count;

                // format numbers with commas and no decimals
                tooltip.html(
                    `<strong>${countryName}</strong><br>
                    Waste: ${avgWaste.toLocaleString(undefined, { maximumFractionDigits: 0 })} KG<br>
                    Water Usage: ${avgWaterUsage.toLocaleString(undefined, { maximumFractionDigits: 0 })} Liters<br>
                    Carbon Footprint: ${avgCarbonFootprint.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT (megatonnes)`
                );
            } else {
                // ff no data, show "data not collected"
                tooltip.html(
                    `<strong>${countryName}</strong><br>Data Not Collected`
                );
            }

            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");

            d3.select(this).style("stroke", "black");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(200).style("opacity", 0);
            d3.select(this).style("stroke", "#333");
        });

}).catch(error => {
    console.error("Error loading data:", error);
});
