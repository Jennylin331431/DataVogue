

class StackedPieChart{

    constructor(parentElement, data){
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = data;

        this.initVis();
    }

    
    initVis(){
        let vis = this;

        vis.pieWidth = 500,
        vis.pieHeight = 500,
        vis.maxRadius = Math.min(width, height) / 2 - 200;

        console.log(vis.parentElement)

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.pieWidth)
            .attr("height", vis.pieHeight)
            .append("g")
            .attr("transform", "translate(" + vis.pieWidth / 2 + "," + vis.pieHeight / 2 + ")");

        // Legend
        vis.legendContainer = d3.select("#legend");
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
        vis.color = d3.scaleOrdinal(d3.schemeCategory10);

         // Create Legend
         vis.brandSet.forEach(brand => {
            let legendItem = vis.legendContainer.append("div")
                .attr("class", "legend-item")
                .style("display", "flex")  // Align items horizontally
                .style("align-items", "center")
                .style("margin-bottom", "5px");
        
            legendItem.append("div")
                .attr("class", "legend-color")
                .style("width", "15px")  // Set rectangle width
                .style("height", "15px") // Set rectangle height
                .style("margin-right", "8px")  // Space between color box and text
                .style("background-color", vis.color(brand));
        
            legendItem.append("span")
                .text(brand)
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
                    transformedData[year] = { year, subData: [] };
                }
                transformedData[year].subData.push({ brand, waste });
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

        // If no data, exit
        if (vis.multiLevelData.length === 0) return;

        let pieWidth = parseInt(vis.maxRadius / vis.multiLevelData.length) - vis.multiLevelData.length;   

        let pie = d3.pie()
            .sort(null)
            .value(d => d.waste);  // Set waste generation as the value for the pie chart

        let arc = d3.arc();

        vis.multiLevelData[0].forEach((levelData, i) => {
            let currentPieWidth = (i + 1) * pieWidth;

            arc.outerRadius(currentPieWidth - 1)
            .innerRadius(i * pieWidth);

            let g = vis.svg.selectAll(".arc" + i)
                .data(pie(levelData.subData))
                .enter()
                .append("g")
                .attr("class", "arc" + i);

            g.append("path")
                .attr("d", arc)
                .style("fill", d => vis.color(d.data.brand));

            g.append("text")
                .attr("transform", d => "translate(" + arc.centroid(d) + ")")
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .text(d => d.data.waste);
            });
    }
}
