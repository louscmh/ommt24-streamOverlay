// SOCKET /////////////////////////////////////////////////////////////////
let socket = new ReconnectingWebSocket("ws://" + location.host + "/ws");
socket.onopen = () => {
    console.log("Successfully Connected");
};
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => {
    console.log("Socket Error: ", error);
};

// SEED DATA /////////////////////////////////////////////////////////////////
let seeds = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/seeds.json");
        jsonData.map((seed) => {
            seeds.push(seed);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(seeds);

// SHOWCASE DATES DATA /////////////////////////////////////////////////////////////////
let dates = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/showcase.json");
        jsonData.map((round) => {
            dates.push(round);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(dates);

// HTML VARS /////////////////////////////////////////////////////////////////
let teamName = document.getElementById("teamName");
let playerOne = document.getElementById("playerOne");
let playerTwo = document.getElementById("playerTwo");
let stageText = document.getElementById("stageText");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentFile = "";
let gameState;
let currentStage;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    if (currentStage != getCurrentStage()) {
        currentStage = getCurrentStage()
        stageText.innerHTML = currentStage;
    }

    if (bestOfTemp !== Math.ceil(data.tourney.manager.bestOF / 2) || scoreBlueTemp !== data.tourney.manager.stars.left || scoreRedTemp !== data.tourney.manager.stars.right) {

		// Courtesy of Victim-Crasher
		bestOfTemp = Math.ceil(data.tourney.manager.bestOF / 2);
        scoreBlueTemp = data.tourney.manager.stars.left;
        scoreRedTemp = data.tourney.manager.stars.right;

        if (bestOfTemp == scoreBlueTemp) {
            teamName.innerHTML = data.tourney.manager.teamName.left;
            playerOne.innerHTML = seeds.find(seed => seed["Team"] === teamName.innerHTML)["playerOne"];
            playerTwo.innerHTML = seeds.find(seed => seed["Team"] === teamName.innerHTML)["playerTwo"];
        } else if (bestOfTemp == scoreRedTemp) {
            teamName.innerHTML = data.tourney.manager.teamName.right;
            playerOne.innerHTML = seeds.find(seed => seed["Team"] === teamName.innerHTML)["playerOne"];
            playerTwo.innerHTML = seeds.find(seed => seed["Team"] === teamName.innerHTML)["playerTwo"];
        } else {
            teamName.innerHTML = "";
            playerOne.innerHTML = "Match has not ended yet!"
            playerTwo.innerHTML = ""
        }
	}

}

function getCurrentStage() {
    var date = new Date();
    var day = date.getUTCDate();
    var month = date.getUTCMonth()+1;

    // console.log(`${day}, ${month}`);

    let currentStage;

    for (let stage of dates) {
        stageDate = parseDateTime(stage["date"]);
        // console.log(`${stageDate.getUTCDate()}, ${stageDate.getUTCMonth()}`);
        if (stageDate.getUTCDate() >= day && stageDate.getUTCMonth()+1 >= month) {
            return currentStage["stage"];
        }
        currentStage = stage;
    }
    return "No Stage Detected";
}

function parseDateTime(dateTimeString) {
    // console.log(dateTimeString);
    if (dateTimeString == "") return null;
    
    var [day, month] = dateTimeString.split('/').map(Number);

    var date = new Date();
    var currentYear = date.getFullYear();

    date.setUTCFullYear(currentYear);
    date.setUTCMonth(month - 1);
    date.setUTCDate(day);

    return date;
}