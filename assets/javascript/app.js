// Initialize Firebase
  var config = {
    apiKey: "AIzaSyDU5N94JD5H1_MmhmGMRSqGQ16v9jF6nD0",
    authDomain: "trainscheduler-e73e1.firebaseapp.com",
    databaseURL: "https://trainscheduler-e73e1.firebaseio.com",
    storageBucket: "trainscheduler-e73e1.appspot.com",
    messagingSenderId: "61181318116"
  };

  firebase.initializeApp(config);

  var provider = new firebase.auth.GithubAuthProvider();

  // Reference for firebase database
  var database = firebase.database();

  var allTrain = [];
  var interval;

	// At the initial load, get a snapshot of the current data.
	database.ref().on("value", function(snapshot) {

		var train_data = snapshot.val();
		allTrains = [];

		// Put all trains object from database into array
		for(var i in train_data) {

			// Print the initial data to the console.
			console.log("Train" +i+ ":" +train_data[i]);

			allTrains.push([i,train_data[i]]);
		}

		$("#scheduleDetails").empty();
		allTrains.forEach(function(trainData){
			
			//Update table with train data
			updateTrainTable(trainData[1],trainData[0]);
		});

		//Set interval every min
		interval = setInterval(refreshTable, 60000);

	}); // End of initial load

	$("#signInWithGithub").on("click", function(event){

		firebase.auth().signInWithPopup(provider).then(function(result) {
		  // This gives you a GitHub Access Token. You can use it to access the GitHub API.
		  var token = result.credential.accessToken;
		  // The signed-in user info.
		  var user = result.user;
		  
		  console.log("Signed in!");

		}).catch(function(error) {
		  // Handle Errors here.
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  // The email of the user's account used.
		  var email = error.email;
		  // The firebase.auth.AuthCredential type that was used.
		  var credential = error.credential;
	  		console.log("Error - " + errorCode + "  " + errorMessage + "  " + email + "  " + credential);
		});

	}); 

	function refreshTable(){
		$("#scheduleDetails").empty();
		allTrains.forEach(function(snapshotdata){
			updateTrainTable(snapshotdata[1],snapshotdata[0]);
		});
	}


	// Add new train
	$("#addTrain").on("click", function(event){
		event.preventDefault();

		// Capture input values
		var trainName = $("#trainName").val().trim();
		var destination = $("#destination").val().trim();
		var firstTrainTime = $("#firstTrainTime").val().trim();
		var frequency = $("#frequency").val().trim();
	
		// Create new train object
		var newTrain = {
			trainName: trainName,
			destination: destination,
			firstTrainTime: firstTrainTime,
			frequency: frequency
		};

		// Insert into database
		database.ref().push(newTrain);

		// Clear form
		$("#trainName").val("");
		$("#destination").val("");
		$("#firstTrainTime").val("");
		$("#frequency").val("");


	}); //End of add new train

function updateTrainTable(trainVal, key){
	var trainName = trainVal.trainName;
	var destination = trainVal.destination;
	var frequency = trainVal.frequency;
	var startTime = trainVal.firstTrainTime;

	var calStartTime = moment(startTime, "HH:mm").subtract(1,"years");

	// Total minutes = current time - start time
	var totalMinutesPast = moment().diff(moment(calStartTime), "minutes");

	console.log("totalMinutesPast: "+totalMinutesPast);

	var moduloRemainder = totalMinutesPast % frequency;

	var minutesToArrival = frequency - moduloRemainder;

	console.log("minutesToArrival: "+minutesToArrival);
	
	var nextArrivalTime = moment().add(minutesToArrival, "minutes");

	console.log("nextArrivalTime: "+moment(nextArrivalTime).format("hh:mm A"));

	// Columns Train Name / Destination / Frequency / Next Arrival / Minutes Away
	var trainSchedule = $('#scheduleDetails');
	var tr = $("<tr/>");
	var tdName = $("<td/>");
	tdName.text(trainName);
	var tdDestination = $("<td/>");
	tdDestination.text(destination);
	var tdFrequency = $("<td/>");
	tdFrequency.text(frequency);
	var tdNxtArrival = $("<td/>");
	tdNxtArrival.text(moment(nextArrivalTime).format("hh:mm A"));
	var tdMinsAway = $("<td/>");
	tdMinsAway.text(minutesToArrival);

	tr.append(tdName);
	tr.append(tdDestination);
	tr.append(tdFrequency);
	tr.append(tdNxtArrival);
	tr.append(tdMinsAway);
	trainSchedule.append(tr);

}