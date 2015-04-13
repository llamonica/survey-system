var cities = null;

cities = JSON.parse(requestCities());
renderUserForm();
renderSurveyForm();

function requestCities() {

    var httpRequest = new XMLHttpRequest();
    httpRequest.open("GET", "/cities", false);
    httpRequest.send(null);

    return httpRequest.responseText;
}

function renderUserForm() {

    var userDiv = document.getElementById("user_row");
    var userForm = document.createElement("form");
    userForm.className = "navbar-form";

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

function renderVotesTable() {

    //TODO: build votes table
}

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

    var response = httpRequest.responseText;
    renderVotesTable();
}
