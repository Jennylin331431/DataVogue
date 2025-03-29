class StackedPieChart{

    constructor(parentElement, data){
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = data;

        this.initVis();
    }

    
    initVis(){
        let vis = this;

        vis.pieWidth = 700;
        vis.pieHeight = 600;
        vis.maxRadius = Math.min(width, height) / 2 - 200;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("class", "responsive-svg")
            .attr("viewBox", `0 0 ${vis.pieWidth} ${vis.pieHeight}`) 
            .attr("preserveAspectRatio", "xMidYMid meet") 
            .append("g")
            .attr("transform", `translate(${(vis.pieWidth / 2) + 100}, ${vis.pieHeight / 2})`);
            
        // Create tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip-pie-chart")
            .style("display", "none");

        // Legend
        vis.legendContainer = d3.select("#brands-legend");
        vis.legendContainer.html(""); 

        let selectedBrands = [
            "Nike",
            "Adidas",
            "Urban Outfitters",
            "Zara",
            "Forever 21",
          ];

        vis.brandSet = new Set(selectedBrands);  

        // Define colour scheme
        vis.color = d3.scaleOrdinal()
            .domain(["Nike", "Adidas", "Urban Outfitters", "Zara", "Forever 21"])
            .range(["#EFD5F2", "#D2A2F2", "#B78DF2", "#6DBFF2", "#BBDDF2"]);

        // Create Legend
        vis.brandSet.forEach(brand => {
        let legendItem = vis.legendContainer.append("div")
            .attr("class", "legend-item")
            .style("display", "flex") 
            .style("align-items", "center")
            .style("margin-bottom", "5px");
    
        legendItem.append("div")
            .attr("class", "legend-color")
            .style("width", "15px") 
            .style("height", "15px")
            .style("margin-right", "8px") 
            .style("background-color", vis.color(brand));
    
        legendItem.append("span")
            .text(brand)
            .attr("class", "legend-brand-name")
            .style("font-size", "14px")
            .style("color", "#333");
        });

        vis.wrangleData();
        
    }

    
    wrangleData(){
        let vis = this;

        vis.multiLevelData = [];

        let setMultiLevelData = function(data) {
            if (!data) return;
    
            let level = data.length,
                counter = 0,
                currentLevelData = [],
                queue = [];
    
            // Enqueue all years
            data.forEach(d => queue.push(d));
    
            while (queue.length > 0) {
                let node = queue.shift();
                currentLevelData.push(node);
                level--;
    
                if (node.subData) {
                    node.subData.forEach(subNode => {
                        queue.push(subNode);
                        counter++;
                    });
                }
    
                if (level === 0) {
                    level = counter;
                    counter = 0;
                    vis.multiLevelData.push(currentLevelData);
                    currentLevelData = [];
                }
            }
        };
    
        // Step 1: Group data by year
        let transformedData = {};
    
        vis.displayData.forEach(([brand, records]) => {
            records.forEach(([year, waste]) => {
                if (!transformedData[year]) {
                    transformedData[year] = { year, subData: [], totalWaste: 0};
                }

                transformedData[year].totalWaste += waste;
                transformedData[year].subData.push({ brand, waste, year });
            });
        });


        // Compute percentage of waste for each brand 
        Object.values(transformedData).forEach(yearData => {
            yearData.subData.forEach(d => {
                d.percentageWaste = (d.waste / yearData.totalWaste) * 100;
            });
        });

        // Convert object to array format for easier traversal
        let formattedData = Object.values(transformedData);
    
        // Step 2: Apply hierarchical transformation
        setMultiLevelData(formattedData);    

        console.log(vis.multiLevelData)

        vis.updateVis();

    }


    updateVis(){
        let vis = this;

        console.log(vis.multiLevelData)

        // Clear existing visualization before updating
        vis.svg.selectAll("*").remove();

        // Append title
        vis.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", 0)  
            .attr("y", -vis.pieHeight / 2 + 20)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "rgb(109, 15, 109)")
            .text("Percentage of Waste Generation per Brand");

        // // Create tooltip
        // let tooltip = d3.select("body").append("div")
        //     .attr("class", "tooltip")
        //     .style("display", "none");
   
        // If no data, exit
        if (vis.multiLevelData.length === 0) return;

        let pieWidth = parseInt(vis.maxRadius / vis.multiLevelData.length) - vis.multiLevelData.length;

        let pie = d3.pie()
            .sort(null)
            .value(d => d.percentageWaste);  // Set waste generation as the value for the pie chart

        let arc = d3.arc();

        vis.multiLevelData[0].forEach((levelData, i) => {
            let currentPieWidth = (i + 1) * pieWidth;

            arc.outerRadius(currentPieWidth - 1)
                .innerRadius(i * pieWidth);

             // Select all arc groups and bind new data
            let g = vis.svg.selectAll(".arc" + i)
                .data(pie(levelData.subData));

            // Exit phase for old elements
            g.exit().transition().duration(1000)
                .style("opacity", 0)
                .remove();

            // Enter phase for new elements
            let enterG = g.enter().append("g")
                .attr("class", "arc" + i);

            enterG.append("path")
                .attr("d", arc)
                .style("fill", d => vis.color(d.data.brand))
                .on("mouseover", function(event, d) {
                    vis.tooltip.transition().duration(200).style("opacity", 1);
                    vis.tooltip.html(`
                        <strong>Brand:</strong> ${d.data.brand} <br>
                        <strong>Year:</strong> ${d.data.year} <br>
                        <strong>Waste Generation:</strong> ${d.data.waste.toLocaleString()}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px")
                    .style("display", "block");

                    vis.svg.selectAll("path")
                    .transition().duration(300)
                    .style("fill", function(data) {
                        return data.data.brand === d.data.brand ? vis.color(d.data.brand) : "#d3d3d3";
                    });
                })
                .on("mousemove", function(event) {
                    vis.tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function() {
                    vis.tooltip.transition().duration(200).style("opacity", 0);

                    // Restore original colors
                    vis.svg.selectAll("path")
                    .transition().duration(300)
                    .style("fill", d => vis.color(d.data.brand));
                });

            enterG.append("text")
                .attr("transform", d => "translate(" + arc.centroid(d) + ")")
                .attr("dy", i === 0 ? "0.7em" : ".35em")
                .style("text-anchor", "middle")
                .style("font-size", (i === 0) ? "9px" : "13px")
                .text(d => d.data.percentageWaste.toFixed(1) + "%")
                .on("mouseover", function(event, d) {
                    vis.tooltip.transition().duration(200).style("opacity", 1);
                    vis.tooltip.html(`
                        <strong>Brand:</strong> ${d.data.brand} <br>
                        <strong>Year:</strong> ${d.data.year} <br>
                        <strong>Waste Generation:</strong> ${d.data.waste.toLocaleString()}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
        
                    vis.svg.selectAll("path")
                    .transition().duration(300)
                    .style("fill", function(data) {
                        return data.data.brand === d.data.brand ? vis.color(d.data.brand) : "#d3d3d3";
                    });
                })
                .on("mousemove", function(event) {
                    vis.tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function() {
                    vis.tooltip.transition().duration(200).style("opacity", 0); 
        
                    vis.svg.selectAll("path")
                    .transition().duration(300)
                    .style("fill", d => vis.color(d.data.brand));
                });

            g.merge(enterG).transition().duration(1000)
                .style("opacity", 1) 
                .select("path")
                .attr("d", arc)
                .style("fill", d => vis.color(d.data.brand))
                .attr("transform", "scale(1.05)") 
                .transition().duration(500)
                .attr("transform", "scale(1)"); 

            g.merge(enterG).transition().duration(1000)
                .select("text")
                .attr("transform", d => "translate(" + arc.centroid(d) + ")")
                .attr("dy", i === 0 ? "0.7em" : ".35em")
                .style("text-anchor", "middle")
                .style("font-size", (i === 0) ? "9px" : "14px")
                .text(d => d.data.percentageWaste.toFixed(1) + "%");
        });

    }
}
