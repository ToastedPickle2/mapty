"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Application Architecture
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const noWorkoutDisplay = document.querySelector(".no-workouts-display");
//prettier-ignore
const leafletPopup = document.querySelectorAll(".leaflet-popup-content-wrapper");
//prettier-ignore
const noWorkoutDisplayText = document.querySelector(".no-workouts-display-text");
const clearBtn = document.querySelector(".clear-btn");
const clearBtnWrapper = document.querySelector(".clear-btn-wrapper");
const sortBtn = document.querySelector(".sort-btn");
const alertContainer = document.querySelector(".alert-container");
const checkContainer = document.querySelector(
  ".workout-confirmation-message-container"
);

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #workoutsArray = [];

  constructor() {
    // get user's position
    this._getPosition(); // putting it in the constructor because whatever is in the constructor is executed immediately

    // Get data from local storage
    this._getLocalStorage();

    // Attach Event Handlers
    form.addEventListener("submit", this._newWorkout.bind(this)); // IMPORTANT - An event handler function will always have the this keyword of the DOM element onto which it is attached (in this case, form). So the bind function is needed.

    inputType.addEventListener("change", this._toggleElevationField);

    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    sortBtn.addEventListener("click", this._sort.bind(this));

    // leafletPopup.forEach((el) => el.on("click", this._moveToPopup.bind(this)));

    this._close();

    this._clearAll();
  }

  _sortWorkouts() {
    this.#workoutsArray.sort((a, b) => a.distance - b.distance); // Sort by distance (you can change the sorting criteria)
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

    const coords = [latitude, longitude];

    console.log("THIS", this);
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    // This has to be here because only after the #map is created, can the _renderWorkoutMarker method be executed
    this.#workouts.forEach((x) => {
      this._renderWorkoutMarker(x);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    console.log(mapE);
    form.classList.remove("hidden");
    inputDistance.focus();

    noWorkoutDisplay.classList.add("hidden");
    noWorkoutDisplayText.classList.add("hide-text");

    // clearBtnWrapper.style.display = "flex";
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    // coords = [latitude, longitude];
    let workout;

    // If workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        alertContainer.style.opacity = "100%";
        return;
      } else {
        alertContainer.style.opacity = "0%";
      }
      // return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        // alertContainer.style.display = "flex";
        alertContainer.style.opacity = "100%";
        return;
      } else {
        // alertContainer.style.display = "none";
        alertContainer.style.opacity = "0%";
      }
      // return alert("Inputs have to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // this._sort();

    // Hide form and clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();

    this._close(workout);
  }

  _clearAll() {
    if (containerWorkouts.querySelectorAll("li").length <= 0) {
    } else if (containerWorkouts.querySelectorAll("li").length > 0) {
    }
    clearBtn.addEventListener("click", function (e) {
      e.preventDefault();

      localStorage.removeItem("workouts");
      window.location.reload();
    });
  }

  _close() {
    const self = this;

    document.querySelectorAll(".description__close--btn").forEach((el) => {
      el.addEventListener("click", function (e) {
        e.preventDefault();

        const workoutEl = e.target.closest(".workout");
        workoutEl.classList.remove("border");

        if (workoutEl) {
          workoutEl.classList.add("hidden");
          setTimeout(
            () => {
              workoutEl.classList.add("form__row--hidden");
              const workoutId = workoutEl.dataset.id;

              self.#workouts = self.#workouts.filter(
                (workout) => workout.id !== workoutId
              );

              localStorage.setItem("workouts", JSON.stringify(self.#workouts));
              noWorkoutDisplayText.classList.add("hide-text");

              window.location.reload(); // reloads the page
            },

            1000
          );
        }

        if (!workoutEl) return;
      });
    });
  }

  _renderWorkoutMarker(workout) {
    // console.log("WORKOUT 1", workout);

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type === "running"
            ? "🏃‍♂️" + " " + workout.description
            : "🚴‍♀️" + " " + workout.description
        }`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    this.#workoutsArray.push(workout);
    console.log("workouts array", this.#workoutsArray);

    if (this.#workoutsArray.length > 1) {
      this.#workoutsArray.sort((a, b) => a.distance - b.distance);
      console.log("sorted workouts array", this.#workoutsArray);
    }

    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <button class="description__close--btn">x</button>
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${
                  workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;

    if (workout.type === "running")
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${
                workout.pace ? workout.pace.toFixed(1) : ""
              }</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          </li>`;

    if (workout.type === "cycling")
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${
                workout.speed ? workout.speed.toFixed(1) : ""
              }</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>
          </li> -->`;

    form.insertAdjacentHTML("afterend", html);

    checkContainer.style.opacity = "100%";
    setTimeout(() => (checkContainer.style.opacity = "0%"), 2000);

    clearBtnWrapper.style.display = "flex";
  }

  _sort() {
    console.log("click");
    console.log("Sort Method", this.#workoutsArray);

    this._sortWorkouts();

    // const workoutsContainer = document.querySelector(".div-workouts");
    // workoutsContainer.innerHTML = "";
    // containerWorkouts.innerHTML = "";

    this.#workoutsArray.forEach((workout) => this._renderWorkout(workout));
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;
    // prettier-ignore
    const workout = this.#workouts.find((work) => work.id === workoutEl.dataset.id);
    // the setView method is a leaflet method

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Using the public interface
    // workout.click(); // won't work because objects that come from local storage will not inherit all the methods that they did before
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // IMPORTANT - objects that come from local storage will not inherit all the methods that they did before.
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((x) => {
      this._renderWorkout(x);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    window.location.reload(); // reloads the page
  }
}

const app = new App();
// app.reset();
//////////////////////////////////////////////////////////////////////////////////////////////////

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    // this.name = name;
    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;

    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

if (containerWorkouts.querySelectorAll("li").length > 0) {
  noWorkoutDisplay.classList.add("hidden");
  noWorkoutDisplayText.classList.add("hide-text");
}

leafletPopup.forEach((el) =>
  el.addEventListener("click", function () {
    console.log("SUCCESS");
    leafletPopup.style.fontSize = "20rem";
  })
);

const workoutBox = document.querySelectorAll(".workout");
let selectedWorkout = null;

workoutBox.forEach((el) =>
  el.addEventListener("click", function (e) {
    const workoutEl = e.target.closest(".workout");

    if (workoutEl) {
      if (selectedWorkout) {
        selectedWorkout.classList.remove("border");
      }

      workoutEl.classList.add("border");

      selectedWorkout = workoutEl;
    }
  })
);
