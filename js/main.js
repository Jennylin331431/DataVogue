const data = [];



// helper function to render info of building selected
function renderInfo(d) {
  // show building info based on selection
  d3.select("#buildings-info").html(`
        <img src="img/${d.image}" alt="Image of ${d.building}" />
    <h3 class="building-info-title">${d.building}</h3>
                  <hr />
   <div class="building-info-container">
  <div class="building-info-text">
    <div class="building-label">Height</div>
    <div class="building-info">${d.height_m}m</div>
  </div>
  <hr />
  <div class="building-info-text">
    <div class="building-label">City</div>
    <div class="building-info">${d.city}</div>
  </div>
  <hr />
  <div class="building-info-text">
    <div class="building-label">Country</div>
    <div class="building-info">${d.country}</div>
  </div>
  <hr />
   <div class="building-info-text">
    <div class="building-label">Floors</div>
    <div class="building-info">${d.floors}</div>
  </div>
  <hr />
  <div class="building-info-text">
    <div class="building-label">Completed</div>
    <div class="building-info">${d.completed}</div>
  </div>
  <hr />
  <div class="building-link">
         >> <a href="https://en.wikipedia.org/wiki/${d.building.replace(/ /g, '_')}" target="_blank">Read more on Wikipedia</a>
        </div>
</div>

  `);
}

d3.csv("data/buildings.csv").then(function (data) {
  data = data;

  


  // Log to the console to check the data
  console.log(data);

  // sort data
  data.sort((a, b) => b.height_px - a.height_px); 

  const svg = d3.select(".col svg");

  // Create the bars and bind data to each rect element
  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 265) 
    .attr("y", (d, i) => i * 50 + 20) 
    .attr("width", (d) => d.height_px) 
    .attr("height", 40)
    .on("click", function (event, d) {
      // render building info
      renderInfo(d);
    }); 

    // add building labels to left of bar
  svg
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-text")
    .attr("x", (d, i) => 250) 
    .attr("y", (d, i) => i * 50 + 43)
    .attr("text-anchor", "end") 
    .text((d) => d.building).on("click", function (event, d) {
      // render building info
      renderInfo(d);
    }); 
  // add height text to bar
  svg
    .selectAll("rect.height-text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "height-text")
    .attr("x", (d) => 260 + Number(d.height_px))
    .attr("y", (d, i) => i * 50 + 45) 
    .attr("text-anchor", "end")
    .text((d) => d.height_m).on("click", function (event, d) {
      // render building info
      renderInfo(d);
    }); 
});
