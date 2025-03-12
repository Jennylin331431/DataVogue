let trendsLineChart;
let globalVisLineChart;
let worldMap;

let parseDate = d3.timeParse("%Y");
loadData();

document.addEventListener("DOMContentLoaded", function () {
  const yearSlider = document.getElementById("yearSlider");
  const yearLabel = document.getElementById("yearLabel");

  noUiSlider.create(yearSlider, {
      start: [2010, 2024],
      connect: true,       // Fill the range between handles
      range: {
          "min": 2010,
          "max": 2024
      },
      step: 1,
      tooltips: false, // no show tooltips on handles
      format: {
          to: value => Math.round(value),
          from: value => Math.round(value)
      }
  });

  // update the displayed year range
  yearSlider.noUiSlider.on("update", function (values) {
    const [startYear, endYear] = values.map(Number);
    startYearLabel.textContent = startYear; // update left label
    endYearLabel.textContent = endYear; // update right label

    // update world map visualization
    if (worldMap) {
        worldMap.updateYearRange(startYear, endYear);
    }
});
});


function loadData() {
  d3.csv("data/fashion_data_2018_2022.csv").then((csv) => {
    csv.forEach(function (d) {
      // d.time = parseDate(d.year_of_sale.toString() + "-" + d.month_of_sale);
      d.time = parseDate(d.year_of_sale.toString());
      d.sales_count = +d.sales_count;
    });

    // Store csv data in global variable
    data = csv;

    console.log("#fashion trend data", data);

    trendsLineChart = new Trends("trends-chart-container", data);

    trendsLineChart.initVis();

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

    d3.csv("data/plasticTextilesData.csv").then((data) => {
      data.forEach((d) => {
        d.Production_Year = +d.Production_Year;
        d.Greenhouse_Gas_Emissions = +d.Greenhouse_Gas_Emissions;
        d.Pollutants_Emitted = +d.Pollutants_Emitted;
        d.Waste_Generation = +d.Waste_Generation;
        d.Water_Consumption = +d.Water_Consumption;
      });

      // group data and calculate averages for each measure
      aggregatedData = Array.from(
        d3.group(data, (d) => d.Production_Year),
        ([year, values]) => ({
          Production_Year: year,
          averageGreenhouseGasEmissions: d3.mean(
            values,
            (v) => v.Greenhouse_Gas_Emissions
          ),
          averagePollutantsEmitted: d3.mean(
            values,
            (v) => v.Pollutants_Emitted
          ),
          averageWasteGeneration: d3.mean(values, (v) => v.Waste_Generation),
          averageWaterConsumption: d3.mean(values, (v) => v.Water_Consumption),
        })
      );

      globalVisLineChart = new GlobalLineChart(
        "global-line-chart",
        aggregatedData
      );

      globalVisLineChart.initVis();

      console.log(aggregatedData);
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

// Object to store valid Pattern-Color pairs
let validColorsForPatterns = {
  Geometric: ["White", "Beige", "Brown", "Red", "Yellow", "Sky Blue"],
  "Polka Dots": ["Red", "Pink", "White", "Beige", "Brown"],
  Plain: [
    "White",
    "Beige",
    "Brown",
    "Red",
    "Yellow",
    "Sky Blue",
    "Orange",
    "Sky Blue",
  ],
  Heart: ["Pink", "Red"],
  Striped: ["Orange"],
  Floral: ["Yellow", "Sky Blue"],
};

let validPatternsForColors = {
  White: ["Geometric", "Polka Dots", "Plain"],
  Beige: ["Geometric", "Polka Dots", "Plain"],
  Brown: ["Geometric", "Polka Dots", "Plain"],
  Red: ["Geometric", "Polka Dots", "Heart"],
  Yellow: ["Geometric", "Plain", "Floral"],
  "Sky Blue": ["Geometric", "Plain", "Floral"],
  Pink: ["Polka Dots", "Heart"],
  Orange: ["Plain", "Striped"],
};

function colorChange() {
  selectedColor = document.getElementById("colorSelector").value;

  // Get all options from the Color dropdown
  const patternOptions = document.getElementById("patternSelector").options;

  // Disable all options initially
  for (let i = 0; i < patternOptions.length; i++) {
    patternOptions[i].disabled = true;
  }


  // Enable only the valid options
  if (validPatternsForColors[selectedColor]) {
    validPatternsForColors[selectedColor].forEach((color) => {
      for (let i = 0; i < patternOptions.length; i++) {
        console.log("#")
        if (patternOptions[i].value === color || patternOptions[i].value === "None") {
          patternOptions[i].disabled = false;
        }
      }
    });
  }

  // update visualizations
  trendsLineChart.selectedColor = selectedColor;
  trendsLineChart.wrangleData();

  console.log("#colorchange", selectedColor);
}

function patternChange() {
  selectedPattern = document.getElementById("patternSelector").value;
  console.log("#patternChange", selectedPattern);

  // Get all options from the Color dropdown
  const colorOptions = document.getElementById("colorSelector").options;

  // Disable all options initially
  for (let i = 0; i < colorOptions.length; i++) {
    colorOptions[i].disabled = true;
  }

  // Enable only the valid options for the selected pattern
  if (validColorsForPatterns[selectedPattern]) {
    validColorsForPatterns[selectedPattern].forEach((color) => {
      for (let i = 0; i < colorOptions.length; i++) {
        if (colorOptions[i].value === color || colorOptions[i].value === "None") {
          colorOptions[i].disabled = false;
        }
      }
    });
  }
  // update visualizations
  trendsLineChart.selectedPattern = selectedPattern;
  trendsLineChart.wrangleData();
}

