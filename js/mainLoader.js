let linechart;
let globalVisLineChart;
let worldMap;

let parseDate = d3.timeParse("%Y-%m");
loadData();

function loadData() {
  d3.csv("data/fashion_data_2018_2022.csv").then((csv) => {
    csv.forEach(function (d) {
      d.time = parseDate(d.year_of_sale.toString() + "-" + d.month_of_sale);
      d.sales_count = +d.sales_count;
    });

    // Store csv data in global variable
    data = csv;

    console.log("#data loaded", data);

    linechart = new Trends("trends-container", data);

    linechart.initVis();

    // Extract distinct values in the "category" field (replace with actual field)
    let distinctCategories = [...new Set(data.map((d) => d.color))];

    console.log("#distinctCategories", distinctCategories);

    d3.csv("data/plasticTextilesData.csv").then(data => {
      data.forEach(d => {
          d.Production_Year = +d.Production_Year;  
          d.Greenhouse_Gas_Emissions = +d.Greenhouse_Gas_Emissions;
          d.Pollutants_Emitted = +d.Pollutants_Emitted;
          d.Waste_Generation = +d.Waste_Generation;
          d.Water_Consumption = +d.Water_Consumption;
      });
  
      // group data and calculate averages for each measure 
      aggregatedData = Array.from(d3.group(data, d => d.Production_Year), ([year, values]) => ({
          Production_Year: year,
          averageGreenhouseGasEmissions: d3.mean(values, v => v.Greenhouse_Gas_Emissions),
          averagePollutantsEmitted: d3.mean(values, v => v.Pollutants_Emitted),
          averageWasteGeneration: d3.mean(values, v => v.Waste_Generation),
          averageWaterConsumption: d3.mean(values, v => v.Water_Consumption)
      }));
  
      globalVisLineChart = new GlobalLineChart("global-line-chart", aggregatedData);
  
      globalVisLineChart.initVis();
  
      console.log(aggregatedData);
    }
  )
  });

    d3.csv("data/sustainable_fashion_trends.csv").then((csv) => {
      csv.forEach(function (d) {
          d.Waste_Production_KG = +d.Waste_Production_KG;
          d.Carbon_Footprint_MT = +d.Carbon_Footprint_MT;
          d.Water_Usage_Liters = +d.Water_Usage_Liters;
      });

      data = csv;

      console.log("#data loaded", data);

      worldMap = new WorldMap("#world-map", data);
      worldMap.initVis();
  });
}

