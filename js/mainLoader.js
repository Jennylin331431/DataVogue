let trendsLineChart;
let globalVisLineChart;
let worldMap;
let brandLineChart;
let footPrintVis;

let parseDate = d3.timeParse("%Y");
loadData();

document.addEventListener("DOMContentLoaded", function () {
  const yearSlider = document.getElementById("yearSlider");
  const yearLabel = document.getElementById("yearLabel");

  noUiSlider.create(yearSlider, {
    start: [2010, 2024],
    connect: true, // Fill the range between handles
    range: {
      min: 2010,
      max: 2024,
    },
    step: 1,
    tooltips: false, // no show tooltips on handles
    format: {
      to: (value) => Math.round(value),
      from: (value) => Math.round(value),
    },
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
      d.time = parseDate(d.year_of_sale.toString());
      d.sales_count = +d.sales_count;
    });

    data = csv;

    console.log("#fashion trend data", data);

    trendsLineChart = new Trends("trends-chart-container", data);
    trendsLineChart.initVis();

    // uncomment to see the different patterns and colors available
    // let distinctPatterns = [...new Set(data.map((d) => d.pattern))];
    // let distinctColors = [...new Set(data.map((d) => d.color))];
  });

  d3.csv("data/plasticTextilesData.csv").then((data) => {
    data.forEach((d) => {
      d.Production_Year = +d.Production_Year;
      d.Greenhouse_Gas_Emissions = +d.Greenhouse_Gas_Emissions;
      d.Pollutants_Emitted = +d.Pollutants_Emitted;
      d.Waste_Generation = +d.Waste_Generation;
      d.Water_Consumption = +d.Water_Consumption;
    });

    // Aggregate waste generation by year and brand
    let aggregatedData = d3.rollups(
        data,
        (v) => d3.sum(v, (d) => d.Waste_Generation),
        (d) => d.Company,
        (d) => d.Production_Year
    );

    console.log(aggregatedData);

    stackedPieChart = new StackedPieChart("pie-chart-container", aggregatedData)
   
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

  d3.csv("data/sustainable_fashion_trends.csv").then((csv) => {
    csv.forEach(function (d) {
      d.Carbon_Footprint_MT = +d.Carbon_Footprint_MT;
    });

    data = csv;

    console.log("#BigFoot data loaded", data);

    footPrintVis = new BigFootCarbonViz("#bigfoot-svg", data);
    footPrintVis.initVis();

    document
      .getElementById("materialSelection")
      .addEventListener("change", function () {
        let selectedMaterial = this.value;
        footPrintVis.selectedMaterial = selectedMaterial;
        footPrintVis.wrangleData();
      });
  });
}

//  data available for pairs of patterns and colors
let validColorsForPatterns = {
  Geometric: [
    "White",
    "Beige",
    "Brown",
    "Red",
    "Yellow",
    "Sky Blue",
    "Green",
    "Navy Blue",
    "Grey",
  ],
  "Polka Dots": [
    "Red",
    "Pink",
    "White",
    "Beige",
    "Brown",
    "Green",
    "Navy Blue",
    "Grey",
  ],
  Plain: [
    "White",
    "Beige",
    "Brown",
    "Red",
    "Yellow",
    "Sky Blue",
    "Orange",
    "Sky Blue",
    "Green",
    "Navy Blue",
    "Grey",
    "Black",
  ],
  Heart: ["Pink", "Red"],
  Striped: ["Orange", "Black"],
  Floral: ["Yellow", "Sky Blue"],
  None: [
    "White",
    "Beige",
    "Brown",
    "Red",
    "Yellow",
    "Sky Blue",
    "Pink",
    "Orange",
    "Green",
    "Navy Blue",
    "Grey",
    "Black",
  ],
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
  None: ["Geometric", "Polka Dots", "Plain", "Heart", "Striped", "Floral"],
  "Navy Blue": ["Geometric", "Polka Dots", "Plain"],
  Green: ["Geometric", "Polka Dots", "Plain"],
  Grey: ["Geometric", "Polka Dots", "Plain"],
  Black: ["Striped", "Plain"],
};

function colorChange() {
  selectedColor = document.getElementById("colorSelector").value;

  // update tshirt color
  updateTshirtColor(selectedColor);

  // Get all options from the Pattern dropdown
  const patternOptions = document.getElementById("patternSelector").options;

  // Disable all options initially
  for (let i = 0; i < patternOptions.length; i++) {
    patternOptions[i].disabled = true;
  }

  // Enable only the valid options
  if (validPatternsForColors[selectedColor]) {
    validPatternsForColors[selectedColor].forEach((color) => {
      for (let i = 0; i < patternOptions.length; i++) {
        if (
          patternOptions[i].value === color ||
          patternOptions[i].value === "None"
        ) {
          patternOptions[i].disabled = false;
        }
      }
    });
  }

  // update visualizations
  trendsLineChart.selectedColor = selectedColor;
  trendsLineChart.wrangleData();
}

function patternChange() {
  selectedPattern = document.getElementById("patternSelector").value;
  // update tshirt pattern
  updateTshirtPattern(selectedPattern);
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
        if (
          colorOptions[i].value === color ||
          colorOptions[i].value === "None"
        ) {
          colorOptions[i].disabled = false;
        }
      }
    });
  }
  // update visualizations
  trendsLineChart.selectedPattern = selectedPattern;
  trendsLineChart.wrangleData();
}

// event listener
d3.selectAll("#yearCheckboxes input[type=checkbox]").on("change", function() {
  const selectedYears = Array.from(document.querySelectorAll("#yearCheckboxes input[type=checkbox]:checked"))
      .map(checkbox => checkbox.value);

   // Filter the original dataset to only include selected years
   const filteredData = stackedPieChart.data
    .map(([brand, records]) => {
        const filteredRecords = records.filter(([year, waste]) => {
            return selectedYears.includes(String(year)); 
        });

        return filteredRecords.length > 0 ? [brand, filteredRecords] : null;
    })
    .filter(entry => entry !== null);

  //console.log(filteredData);

  stackedPieChart.displayData = filteredData;
  stackedPieChart.wrangleData();
});

let selectedProductType = document.getElementById("productSelector").value;

function productChange() {
  selectedProductType = document.getElementById("productSelector").value;
  brandLineChart.wrangleData();
}
