

class StackedPieChart{

    constructor(parentElement, data){
        this.parentElement = parentElement;
        this.data = data;

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

        // // Scales & Generators
        // vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        // vis.arc = d3.arc()
        //     .innerRadius(d => vis.radiusScale(d.data.year))
        //     .outerRadius(d => vis.radiusScale(d.data.year) + 40); // Spacing between rings

        // vis.pie = d3.pie()
        //     .value(d => d.waste)
        //     .sort(null);

        // vis.radiusScale = d3.scaleOrdinal()
        //     .domain([2018, 2019, 2020, 2021, 2022])  // years
        //     .range([80, 120, 160, 200, 240]); // ring levels 

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
    
        vis.data.forEach(([brand, records]) => {
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

        // Clear existing visualization before updating
        vis.svg.selectAll("*").remove();

        // If no data, exit
        if (vis.multiLevelData.length === 0) return;

        let pieWidth = parseInt(vis.maxRadius / vis.multiLevelData.length) - vis.multiLevelData.length;
        let color = d3.scaleOrdinal(d3.schemeCategory10);   

        let pie = d3.pie()
            .sort(null)
            .value(d => d.waste);  // Set waste as the value for the pie chart

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
                .style("fill", d => color(d.data.brand));

            g.append("text")
                .attr("transform", d => "translate(" + arc.centroid(d) + ")")
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .text(d => d.data.brand);
            });
    }
}

