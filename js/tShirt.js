let canvas = new fabric.Canvas("tshirt-canvas");

// Function to update T-shirt color on the canvas
function updateTshirtColor(color) {
  console.log("update", color);

  let tShirtDiv = document.getElementById("tshirt-div");

  // reset styles
  tShirtDiv.style.setProperty("--striped-base-color", "white");
  tShirtDiv.style.setProperty("--dot-color", "black");
  document.getElementById("tshirt-div").style.opacity = 1;

    // Use a switch statement for color logic
    switch (color) {
      case "None":
        console.log("#");
        tShirtDiv.style.opacity = 0.5;
        color = "#fff";
        tShirtDiv.style.setProperty("--striped-base-color", "black"); // Stripes based on black
        break;
  
      case "Navy Blue":
        color = "#000080";  
        tShirtDiv.style.setProperty("--dot-color", "white");
        break;

        case "Grey":
        tShirtDiv.style.setProperty("--dot-color", "white");
        break;
  
      case "Sky Blue":
        color = "#87CEEB";

        break;
  
      case "black":
        tShirtDiv.style.setProperty("--striped-base-color", "white");  // Black background needs white stripes
        break;
  
      case "White":
        tShirtDiv.style.setProperty("--dot-color", "black");  // Set dots to black when background is white
        break;
  
      default:
        break;
    }

  // change background color
  tShirtDiv.style.backgroundColor = color;
  tShirtDiv.style.setProperty("--bg-color", color);
}

function updateTshirtPattern(pattern) {
  let box = document.getElementById("tshirt-div");

  // Remove all pattern classes
  box.classList.remove(
    "geometric",
    "polka-dots",
    "plain",
    "striped",
    "floral",
    "heart"
  );

  let heartDiv = document.getElementById("heart-div");

  // reset heart div
  heartDiv.style.display = "none";

  // Apply the selected pattern
  switch (pattern) {
    case "Geometric":
      box.classList.add("geometric");
      break;
    case "Polka Dots":
      box.classList.add("polka-dots");
      break;
    case "Plain":
      box.classList.add("plain");
      break;
    case "Striped":
      box.classList.add("striped");
      break;
    case "Floral":
      box.classList.add("floral");
      break;
    case "Heart":
      heartDiv.style.display = "block";

      break;
    default:
      break; // No class applied for "None"
  }
}
