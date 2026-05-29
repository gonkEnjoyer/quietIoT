import { db } from "./firebase_init.js";

import {getDatabase, get, ref, child} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js"

var timeInput = document.getElementById("time-input");
var userInput = document.getElementById("user-input");
var deviceInput = document.getElementById("device-input");
var submitBtn = document.getElementById("test-button");
var returnedText = document.getElementById("returned-text");

function getData() {
  returnedText.textContent = String("users/" + userInput.value + "/devices/" + deviceInput.value + "/data/" + timeInput.value);
}

submitBtn.addEventListener("click", getData);
