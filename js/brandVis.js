// Line Chart for Environmental Impact measurements for top 5 and bottom 5 brands

class BrandLineChart{

    constructor(parentElement, data){
        this.data = data;
        this.parentElement = parentElement;
        this.years = [2018, 2019, 2020, 2021, 2022]; 
        this.displayData = data;

        this.initVis();
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
        .attr("height", vis.brandHeight + vis.brandMargin.left + vis.brandMargin.right);

        // Append the <g> element for the chart (for lines)
        let g = vis.svg.select(".chart-g");
        if (g.empty()) {
            g = vis.svg.append("g")
                .attr("class", "chart-g")
                .attr("transform", `translate(${vis.brandMargin.left},${vis.brandMargin.top})`);
        }

        // Define scales
        vis.xScale = d3.scalePoint()
            .domain(vis.years) 
            .range([0, vis.brandWidth])
            .padding(0.5);

        vis.yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => d.Waste_Generation)])
            .range([vis.brandHeight, 0]);

        // Define line generator
        vis.lineGenerator = d3.line()
            .x(d => vis.xScale(d.Year))
            .y(d => vis.yScale(d.Waste_Generation))
            .curve(d3.curveLinear); 

        // Add axes
        vis.svg.append("g")
        .attr("transform", `translate(0,${vis.brandHeight})`)
        .call(d3.axisBottom(vis.xScale))
        .attr("color", "black");

        vis.svg.append("g")
        .call(d3.axisLeft(vis.yScale))
        .attr("color", "black");

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
            .text("Waste Generation");

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
    
        // brands
        vis.selectedBrands = ['Nike', 'Adidas', 'Urban Outfitters', 'Zara', 'Forever 21'];

        // Filter by product type
        vis.selectedBrandsData = vis.displayData.filter((d) => d.Product_Type === selectedProductType);

        console.log(vis.selectedBrandsData)

        // Aggregate waste generation by year and brand
        let aggregatedData = d3.rollups(vis.selectedBrandsData,
            v => d3.sum(v, d => d.Waste_Generation),  
            d => d.Company,
            d => d.Production_Year
        );

        console.log(aggregatedData)

        // Convert to a flat structure
        vis.selectedBrandsData = aggregatedData.flatMap(([company, years]) => 
            years.map(([year, totalWaste]) => ({
                Company: company,
                Production_Year: year,
                Waste_Generation: totalWaste
            }))
        );

        console.log(vis.selectedBrandsData)
            
        // Ensure chronological order for correct line rendering
        vis.selectedBrandsData.sort((a, b) => d3.ascending(a.Production_Year, b.Production_Year));

        // Update scales
        vis.yScale.domain([0, d3.max(vis.selectedBrandsData, d => d.Waste_Generation)]);

        console.log("Updated Data for Selected Brands:", vis.selectedBrandsData);
    
        vis.updateVis();
    }

    /* Update visualization */
    updateVis(){
        let vis = this;

       // Remove previous lines
       vis.svg.selectAll("path.line").remove();

       // Group data by brand
       let brands = d3.group(vis.selectedBrandsData, d => d.Company);
       const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

       console.log(brands)

       brands.forEach((values, brand) => {
        
           let brandData = values.map(d => ({
               Year: d.Production_Year,
               Waste_Generation: d.Waste_Generation,
           }));

           // Sort data for smooth line transition
           brandData.sort((a, b) => d3.ascending(a.Year, b.Year));

           console.log(brandData)

           vis.svg
               .append("path")
               .datum(brandData)
               .attr("class", "line")
               .attr("fill", "none")
               .attr("stroke", colorScale(brand))
               .attr("stroke-width", 2)
               .attr("d", (d) => {
                console.log(d);  // Log path data to check its structure
                return vis.lineGenerator(d);
            });
       });

        // Add legend
        vis.svg.selectAll(".legend").remove();
        let legend = vis.svg.append("g").attr("class", "legend").attr("transform", `translate(${vis.brandWidth + 10}, 10)`);
        vis.selectedBrands.forEach((brand, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", colorScale(brand));
            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 10)
                .text(brand);
        });
   }
}
