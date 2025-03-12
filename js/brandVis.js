// Line Chart for Environmental Impact measurements for top 5 and bottom 5 brands

class BrandLineChart{

    constructor(parentElement, data){
        this.data = data;
        this.parentElement = parentElement;
        this.displayData = data;

        this.initVis;
    }

     /* Initialize visualization */
    initVis(){
        let vis = this;

        vis.brandMargin = { top: 40, right: 160, bottom: 50, left: 60 };
        vis.brandWidth = 900 - vis.brandMargin.left - vis.brandMargin.right;
        vis.brandHeight = 450 - vis.brandMargin.top - vis.brandMargin.bottom; 
 
        // SVG container
        vis.svg = d3.select("#brand-vis")
        .attr("width", vis.brandWidth + vis.brandMargin.left + vis.brandMargin.right)
        .attr("height", vis.brandHeight + vis.brandMargin.left + vis.brandMargin.right)
        .append("g") 
        .attr("transform", `translate(${vis.brandMargin.left},${vis.brandMargin.top})`);

        vis.xScale = d3.scalePoint()
            .domain([...new Set(vis.data.map(d => d.Year))]) 
            .range([0, vis.brandWidth]);

        vis.yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => d.Waste_Production_KG)])
            .range([vis.brandHeight, 0]);

        // Add axes
        vis.svg.append("g")
        .attr("transform", `translate(0,${vis.brandHeight})`)
        .call(d3.axisBottom(vis.xScale));

            vis.svg.append("g")
        .call(d3.axisLeft(vis.yScale));

        // Axes abels
        vis.svg.append("text")
        .attr("x", vis.brandWidth / 2)
        .attr("y", vis.brandHeight + vis.brandMargin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");

        vis.svg.append("text")
            .attr("x", -vis.brandHeight / 2)
            .attr("y", -vis.brandMargin.left + 15)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("font-size", "14px")
            .text("Waste Generation (kg)");

        // Chart title
        vis.svg.append("text")
            .attr("x", vis.brandWidth / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Waste Generation over Time by Brands"); 

        vis.wrangleData();

    }

    /* Data wrangling */
    wrangleData(){
        let vis = this;

        let brandWaste = d3.rollups(vis.data, 
            v => d3.mean(v, d => d.Waste_Production_KG), 
            d => d.Brand_Name);

        brandWaste.sort((a, b) => d3.descending(a[1], b[1]));

        let top5 = brandWaste.slice(0, 5).map(d => d[0]);
        let bottom5 = brandWaste.slice(-5).map(d => d[0]);

        vis.displayData = vis.data.filter(d => top5.includes(d.Brand_Name) || bottom5.includes(d.Brand_Name));

        vis.xScale.domain([...new Set(vis.displayData.map(d => d.Year))]);
        vis.yScale.domain([0, d3.max(vis.displayData, d => d.Waste_Production_KG)]);

        vis.updateVis();
    }

    /* Update visualization */
    updateVis(){
        let vis = this;

        // remove previous lines
        vis.svg.selectAll(".line").remove();

        // get brands
        let brands = d3.group(vis.displayData, d => d.Brand_Name);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        console.log(brands)

        brands.forEach((values, key) => {
            console.log(values[0]["Waste_Production_KG"])

            const brandData = values.map(d => ({
                Year: d.Year,
                Waste_Production_KG: d.Waste_Production_KG
            }));

            vis.svg.append("path")
                .datum(brandData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(key))
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => vis.xScale(d.Year))
                    .y(d => vis.yScale(d.Waste_Production_KG)));
        });

    }
}