import * as Carousel from "./Carousel.js";
import axios from "axios";

// Step 0: Store API key and API url for reference and easy access.
const API_KEY = process.env.API_KEY; // use environment variable defined in .env file
const API_URL = "https://api.thecatapi.com/v1";

// Create helper arrays
const levels = ["N/A", "Very Low", "Low", "Moderate", "High", "Very High"];
const attrs = [
  "origin",
  "weight",
  "life_span",
  "temperament",
  "grooming",
  "energy_level",
  "social_needs",
  "child_friendly",
  "dog_friendly",
];

// Use DOMContentLoaded event to run JavaScript code as soon as the page's HTML has been loaded
document.addEventListener("DOMContentLoaded", () => {
  // The breed selection input element.
  const breedSelect = document.getElementById("breedSelect");
  // The information section div element.
  const infoDump = document.getElementById("infoDump");
  // The progress bar div element.
  const progressBar = document.getElementById("progressBar");
  // The get favourites button element.
  const getFavouritesBtn = document.getElementById("getFavouritesBtn");

  /**
   * 1. Create an async function "initialLoad" that does the following:
   * - Retrieve a list of breeds from the cat API using fetch().
   * - Create new <options> for each of these breeds, and append them to breedSelect.
   *  - Each option should have a value attribute equal to the id of the breed.
   *  - Each option should display text equal to the name of the breed.
   * This function should execute immediately.
   */
  (async function initialLoad() {
    // Retrieve a list of breeds from the cat API using fetch()
    const data = await fetch(`${API_URL}/breeds`);
    const breeds = await data.json();

    // Clear breedSelect before populate new items
    breedSelect.textContent = "";

    // Create new <options> for each of these breeds, and append them to breedSelect.
    breeds.forEach((breed) => {
      breedSelect.appendChild(createOption(breed.id, breed.name));
    });

    // Initial load breed images to carousel
    loadImagesToCarousel(breedSelect.value);

    // Helper function to create new <options> element
    function createOption(id, name) {
      // Create new <options>
      const option = document.createElement("option");
      // option should have a value attribute equal to the id of the breed
      option.value = id;
      // option should display text equal to the name of the breed
      option.textContent = name;
      // return new <options> element
      return option;
    }
  })();

  /**
   * 2. Create an event handler for breedSelect that does the following:
   * - Retrieve information on the selected breed from the cat API using fetch().
   *  - Make sure your request is receiving multiple array items!
   *  - Check the API documentation if you're only getting a single object.
   * - For each object in the response array, create a new element for the carousel.
   *  - Append each of these new elements to the carousel.
   * - Use the other data you have been given to create an informational section within the infoDump element.
   *  - Be creative with how you create DOM elements and HTML.
   *  - Feel free to edit index.html and styles.css to suit your needs, but be careful!
   *  - Remember that functionality comes first, but user experience and design are important.
   * - Each new selection should clear, re-populate, and restart the Carousel.
   * - Add a call to this function to the end of your initialLoad function above to create the initial carousel.
   */
  breedSelect.addEventListener("change", async (event) => {
    // Get id from <select> element value
    const id = event.target.value;
    // Load breed images to carousel
    loadImagesToCarousel(id);
  });
});

// Helper function to fetch breed images from Cat API and updates the carousel with them.
async function loadImagesToCarousel(id) {
  // Fetch images for selected breed ID using Cat API
  const imagesPromise = fetch(
    `${API_URL}/images/search?limit=100&breed_ids=${id}`,
    { headers: { "x-api-key": API_KEY } }
  );
  // Fetch detailed info for selected breed ID using Cat API
  const infoPromise = fetch(`${API_URL}/breeds/${id}`);
  // Get images data and info data simultaneously
  [imagesData, infoData] = await Promise.all([imagesPromise, infoPromise]);
  // Parse the JSON response from the info data into info object
  const info = await infoData.json();
  // Parse the JSON response from the images data into images array
  const images = await imagesData.json();
  // If there are only 4 images, duplicate them to ensure smooth rotation on wide screen
  images.length === 4 && images.push(...images);
  // Get carousel element by ID
  const carousel = document.getElementById("carouselInner");
  // Clear carousel before populate new items
  carousel.textContent = "";
  // For each image in the response array, create a new element and append it to the carousel
  images.forEach((image, index) => {
    // Create carousel item using HTML template
    const carouselItem = document
      .getElementById("carouselItemTemplate")
      .content.firstElementChild.cloneNode(true);
    // Activate the first element
    if (index === 0) {
      carouselItem.classList.add("active");
    }
    // Update the element's image with the URL from the API response.
    const carouselItemImage = carouselItem.querySelector("img");
    carouselItemImage.src = image.url;
    // Append each of these new elements to the carousel
    carousel.appendChild(carouselItem);
  });
  // Clean infoDump
  infoDump.textContent = "";
  // Create infoDump item using HTML template
  const infoDumpItem = document
    .getElementById("infoDumpTemplate")
    .content.firstElementChild.cloneNode(true);

  // Update <h1> element with title
  const infoDumpTitle = infoDumpItem.querySelector("h1");
  infoDumpTitle.textContent = info.name;
  // Add alternative names, if any
  info.alt_names.trim() && (infoDumpTitle.textContent += " (" + info.alt_names + ")");
  // Update <p> element with breed description
  const infoDumpDescription = infoDumpItem.querySelector(
    ".section:first-of-type > h2 + p"
  );
  infoDumpDescription.textContent = info.description;
  // Get <attributes> element
  const infoDumpAttributes = infoDumpItem.querySelector(".attributes");
  // Create empty attribute
  const attrTemplate = document.createElement("div");
  attrTemplate.classList.add("attribute");
  attrTemplate.appendChild(document.createElement("h3"));
  attrTemplate.appendChild(document.createElement("p"));
  // Loop through attr array to collect properties from object and render attr
  attrs.map((attr) =>
    infoDumpAttributes.appendChild(createAttr(attrTemplate, attr, info))
  );
  // Add additional information (links)
  const infoDumpAdditionalInfo = infoDumpItem.querySelector(
    ".section:last-of-type > h2 + p"
  );
  const resources = [];
  // if 'vetstreet_url' exists, create VetStreet Page link
  info.vetstreet_url &&
    resources.push(
      createResourceLink(info.vetstreet_url, `VetStreet ${info.name} page`)
        .outerHTML
    );
  // if 'wikipedia_url' exists, create Wikipedia article link
  info.wikipedia_url &&
    resources.push(
      createResourceLink(info.wikipedia_url, `Wikipedia article`).outerHTML
    );
  // Update <p> element with breed description
  resources.length &&
    (infoDumpAdditionalInfo.innerHTML =
      "For more details, visit " + resources.join(" or ") + ".");

  // Function to create a resource link
  function createResourceLink(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.textContent = name;
    return a;
  }

  // Function to create attribute element and fill out data
  function createAttr(template, prop, data) {
    const attr = template.cloneNode(true);
    attr.querySelector("h3").textContent = prop.split("_").join(" ");
    switch (prop) {
      case "weight":
        console.log(data[prop]);
        attr.querySelector("p").textContent =
          data[prop].imperial + " lbs (" + data[prop].metric + " kg)";
        break;
      case "life_span":
        attr.querySelector("p").textContent = data[prop] + " years";
        break;
      case "origin":
      case "temperament":
        attr.querySelector("p").textContent = data[prop];
        break;
      case "grooming":
      case "energy_level":
      case "social_needs":
      case "child_friendly":
      case "dog_friendly":
        attr.querySelector("p").textContent = levels[data[prop]];
        break;
    }
    return attr;
  }

  // Render infoDump content
  infoDump.appendChild(infoDumpItem);
}

/**
 * 3. Fork your own sandbox, creating a new one named "JavaScript Axios Lab."
 */
/**
 * 4. Change all of your fetch() functions to axios!
 * - axios has already been imported for you within index.js.
 * - If you've done everything correctly up to this point, this should be simple.
 * - If it is not simple, take a moment to re-evaluate your original code.
 * - Hint: Axios has the ability to set default headers. Use this to your advantage
 *   by setting a default header with your API key so that you do not have to
 *   send it manually with all of your requests! You can also set a default base URL!
 */
/**
 * 5. Add axios interceptors to log the time between request and response to the console.
 * - Hint: you already have access to code that does this!
 * - Add a console.log statement to indicate when requests begin.
 * - As an added challenge, try to do this on your own without referencing the lesson material.
 */

/**
 * 6. Next, we'll create a progress bar to indicate the request is in progress.
 * - The progressBar element has already been created for you.
 *  - You need only to modify its "width" style property to align with the request progress.
 * - In your request interceptor, set the width of the progressBar element to 0%.
 *  - This is to reset the progress with each request.
 * - Research the axios onDownloadProgress config option.
 * - Create a function "updateProgress" that receives a ProgressEvent object.
 *  - Pass this function to the axios onDownloadProgress config option in your event handler.
 * - console.log your ProgressEvent object within updateProgess, and familiarize yourself with its structure.
 *  - Update the progress of the request using the properties you are given.
 * - Note that we are not downloading a lot of data, so onDownloadProgress will likely only fire
 *   once or twice per request to this API. This is still a concept worth familiarizing yourself
 *   with for future projects.
 */

/**
 * 7. As a final element of progress indication, add the following to your axios interceptors:
 * - In your request interceptor, set the body element's cursor style to "progress."
 * - In your response interceptor, remove the progress cursor style from the body element.
 */
/**
 * 8. To practice posting data, we'll create a system to "favourite" certain images.
 * - The skeleton of this function has already been created for you.
 * - This function is used within Carousel.js to add the event listener as items are created.
 *  - This is why we use the export keyword for this function.
 * - Post to the cat API's favourites endpoint with the given ID.
 * - The API documentation gives examples of this functionality using fetch(); use Axios!
 * - Add additional logic to this function such that if the image is already favourited,
 *   you delete that favourite using the API, giving this function "toggle" functionality.
 * - You can call this function by clicking on the heart at the top right of any image.
 */
export async function favourite(imgId) {
  // your code here
}

/**
 * 9. Test your favourite() function by creating a getFavourites() function.
 * - Use Axios to get all of your favourites from the cat API.
 * - Clear the carousel and display your favourites when the button is clicked.
 *  - You will have to bind this event listener to getFavouritesBtn yourself.
 *  - Hint: you already have all of the logic built for building a carousel.
 *    If that isn't in its own function, maybe it should be so you don't have to
 *    repeat yourself in this section.
 */

/**
 * 10. Test your site, thoroughly!
 * - What happens when you try to load the Malayan breed?
 *  - If this is working, good job! If not, look for the reason why and fix it!
 * - Test other breeds as well. Not every breed has the same data available, so
 *   your code should account for this.
 */
