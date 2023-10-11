"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map, mapEvent, coords;

class App {
  #map;
  #mapEvent;

  constructor() {
    this._getPosition(); // putting it in the constructor because whatever is in the constructor is executed immediately
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // IMPORTANT - the bind method is needed so that when other values (like this.#map) are called in other methods, the this keyword points back to the App class and is not undefined
        function () {
          // IMPORTANT - the getCurrentPosition is a built in method that needs two parameters. The first is to define what happens if it's successful. In this case, pass the information into the _loadMap method. And the second part is if it's unsuccessful and in this case it alerts a message;
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    // the information for position is taken from the _getPosition method above through this._loadMap
    console.log(position);
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    coords = [latitude, longitude];

    console.log("THIS", this);
    this.#map = L.map("map").setView(coords, 13);
    console.log(this.#map);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", function (mapE) {
      this.#mapEvent = mapE;
      console.log(mapE);
      form.classList.remove("hidden");
      inputDistance.focus();
    });
  }

  _showForm() {}

  _toggleElevationField() {}

  _newWorkout() {}
}

const app = new App();

inputType.addEventListener("change", function () {
  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  // Clear input fields
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      "";

  // Display marker
  L.marker(coords)
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
      })
    )
    .setPopupContent("Workout")
    .openPopup();
});

//////////////////////////////////////////////////////////////////////////////////////////////////

class Workout {
  #coords = [];

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.#coords = coords;
  }

  mult() {
    console.log((this.distance *= 2));
    return this;
  }
}

class Running extends Workout {
  constructor(distance, duration, coords, name, cadence, pace) {
    super(distance, duration, coords);
    this.name = name;
    this.cadence = cadence;
    this.pace = pace;
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, name, elevationGain, speed) {
    super(distance, duration, coords);
    this.name = name;
    this.elevationGain = elevationGain;
    this.speed = speed;
  }
}

const runner = new Running(20, 2, "20");
console.log(runner);
runner.mult().mult();
