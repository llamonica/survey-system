
// Initialize user and survey forms
var cities = JSON.parse(requestCities());
renderUserForm();
renderSurveyForm();

// Sends an HTTP request for the cities in the database.
function requestCities() {

    var httpRequest = new XMLHttpRequest();
    httpRequest.open("GET", "/cities", false);
    httpRequest.send(null);

    return httpRequest.responseText;
}

// Builds the form elements for input about the user
function renderUserForm() {

    var userDiv = document.getElementById("user_row");
    userDiv.children[0].innerHTML = "Favorite City";
    userDiv.children[1].innerHTML = "Enter your name and email and then select your favorite of the three cities listed below.";

    var userForm = document.createElement("form");
    userForm.className = "navbar-form";
    userForm.id = "user_form";

    var userFormGroup1 = document.createElement("div");
    userFormGroup1.className = "form-group";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Full name";
    nameInput.className = "form-control";
    nameInput.id = "user_name";
    userFormGroup1.appendChild(nameInput);

    var userFormGroup2 = document.createElement("div");
    userFormGroup2.className = "form-group";
    var emailInput = document.createElement("input");
    emailInput.type = "text";
    emailInput.placeholder = "Email address";
    emailInput.className = "form-control";
    emailInput.id = "email_addr";
    userFormGroup1.appendChild(emailInput);

    userForm.appendChild(userFormGroup1);
    userForm.appendChild(userFormGroup2);
    userDiv.appendChild(userForm);
}

// Builds the form elements for the user's vote
function renderSurveyForm() {

    var surveyDiv = document.getElementById("survey_row");
    var index = 0;
    while (index < cities.length) {
        var cityDiv = document.createElement("div");
        cityDiv.className = "col-md-4";
        appendCityButton(cities[index], cityDiv);
        surveyDiv.appendChild(cityDiv);
        index++;
    }
}

// Appends a voting button for a city to a div.
// city: JSON object representing a city object
// cityDiv: Div to which the button is appended
function appendCityButton(city, cityDiv) {

    var hDiv = document.createElement("h2");
    hDiv.innerHTML = city.city + ", " + city.state;
    cityDiv.appendChild(hDiv);

    var paragraph = document.createElement("p");
    var form = document.createElement("form");
    var button = document.createElement("input");
    button.id = "city" + city.id;
    button.className = "btn btn-primary btn-lg";
    //button.role = "button";
    button.value = "Vote";
    button.onclick = function(c) {
        return function() {
            postVote(c);
        };
    }(city);

    form.appendChild(button);
    paragraph.appendChild(form);
    cityDiv.appendChild(paragraph);
}

// Builds the vote distribution table.
// response: JSON string representing the HTTP response body
function renderVotesTable(response) {

    //console.log("response: " + response);

    var oldElem = document.getElementById("survey_row");
    var votesDiv = oldElem.parentNode;

    votesHeader = document.createElement("h3");
    votesHeader.innerHTML = "Vote Distribution";
    votesDiv.replaceChild(votesHeader, oldElem);

    var votes = JSON.parse(response);
    for (var i = 0; i < votes.length; i++) {

        renderVotesTableRow(votes[i].city, votes[i].state, votes[i].count, votesDiv);
    }
}

// Appends a table row to the distribution table.
// city: Name of city
// state: Name of state
// count: Number of votes for the city
// parent: Parent node to which the row is appended
function renderVotesTableRow(city, state, count, parent) {

    rowDiv = document.createElement("div");
    rowDiv.className = "row";
    parent.appendChild(rowDiv);

    cityCellDiv = document.createElement("div");
    cityCellDiv.className = "col-md-4";
    cityCellDiv.innerHTML = city + ", " + state;
    countCellDiv = document.createElement("div");
    countCellDiv.className = "col-md-1";
    countCellDiv.innerHTML = count;

    rowDiv.appendChild(cityCellDiv);
    rowDiv.appendChild(countCellDiv);
}

// Sends a HTTP POST request with the user's vote.
// city: City object from the vote's onClick closure
function postVote(city) {

    var voteJSON = {"user" : document.getElementById("user_name").value,
                    "email" : document.getElementById("email_addr").value,
                    "city" : city.id}
    var jsonString = JSON.stringify(voteJSON)
    var httpRequest = new XMLHttpRequest();
    httpRequest.open("POST", "/vote", false);
    httpRequest.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    httpRequest.setRequestHeader('Content-Length', jsonString.length);
    httpRequest.send(jsonString);

    console.log("vote sent: " + jsonString);
    console.log("json length: " + jsonString.length);

    if (httpRequest.status == 200) {

        renderVotesTable(httpRequest.responseText);
    } else {

        displayError(httpRequest.status, httpRequest.responseText);
    }
}

// Replaces the greeting with an error message and restart button.
// status: Response status code
// message: Response error message
function displayError(status, message) {

    console.log("error: " + status + ", " + message);

    // Replace the survey form
    var oldElem = document.getElementById("survey_row");
    var parent = oldElem.parentNode;
    var newDiv = document.createElement("div");
    newDiv.className = "row";
    newDiv.id = "survey_row";
    parent.replaceChild(newDiv, oldElem);

    // Replace the user form with a restart button
    var oldUserForm = document.getElementById("user_form");
    while (oldUserForm.firstChild) {

        oldUserForm.removeChild(oldUserForm.firstChild);
    }
    var errorForm = document.createElement("form");
    var errorParent = oldUserForm.parentNode;
    errorParent.replaceChild(errorForm, oldUserForm);

    var userFormGroup = document.createElement("div");
    userFormGroup.className = "form-group";
    var button = document.createElement("input");
    button.className = "btn btn-primary btn-lg";
    button.value = "Try again";
    button.onclick = reloadForms;
    userFormGroup.appendChild(button);
    errorForm.appendChild(userFormGroup);

    // Replace message with error
    errorForm.parentNode.children[0].innerHTML = "Error: " + status;
    errorForm.parentNode.children[1].innerHTML = message;
}

// Removes error message elements and reloads the user and survey forms.
function reloadForms() {

    var userDiv = document.getElementById("user_row");
    userDiv.removeChild(userDiv.lastChild);
    renderUserForm();
    renderSurveyForm();
}
