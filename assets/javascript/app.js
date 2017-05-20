// Initialize Firebase
  var config = {
    apiKey: "AIzaSyDU5N94JD5H1_MmhmGMRSqGQ16v9jF6nD0",
    authDomain: "trainscheduler-e73e1.firebaseapp.com",
    databaseURL: "https://trainscheduler-e73e1.firebaseio.com",
    projectId: "trainscheduler-e73e1",
    storageBucket: "trainscheduler-e73e1.appspot.com",
    messagingSenderId: "61181318116"
  };

  firebase.initializeApp(config);

  var provider = new firebase.auth.GithubAuthProvider();

  // Reference for firebase database
  var database = firebase.database();

  var allTrain = [];
  var interval;
  var user=null;

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
		  user = result.user;

		  $("#username").text("Welcome aboard, Captain "+user.displayName);	
		  
		  console.log("Choo Choo!!");
		  $("#signInWithGithub").hide();
		  $(".editBtn").toggle();
		  $("#editBtn").toggle();
		  $("#signOutBtn").toggle();
		  $('#trainFormPanel').slideToggle(1000,"swing");

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

	}); // End of sign on with GitHub

	$("#scheduleDetails").on("click", ".editBtn", function(event){

		clearInterval(interval);	

		$(this).parent().parent().find("td>input").attr('disabled', false).removeClass('non-editable');

		$(this).parent().parent().find("td>input").attr('disabled', false).css({'border-width':'1px','border':'1px solid white'});

		// style='background-color:#181818; color:white;text-align:center;border-width:0px;border:none;'>"

		$(this).hide();
		$(this).parent().parent().find(".updateBtn, .deleteBtn, .undoBtn").show();	
		$(this).parent().parent().find(".trainName").focus();

	});

	$("#scheduleDetails").on("click", ".updateBtn", function() {
		var trainKey = $(this).parent().parent().attr('id');
		var newTrainName = $(this).parent().parent().find('td>.trainName').val();
		var newDestination = $(this).parent().parent().find('td>.destination').val();
		var updatedArrivalTime = $(this).parent().parent().find('td>.firstTrainTime').val();

		var updateTrain = {
			trainName: newTrainName,
			destination: newDestination,
			firstTrainTime: updatedArrivalTime
		};

		// Insert into database
		database.ref("/"+trainKey).update(updateTrain);

	});

	$("#scheduleDetails").on("click", ".undoBtn", function() {
		refreshTable();
	});

	$("#scheduleDetails").on("click", ".deleteBtn", function() {
		var trainKey = $(this).parent().parent().attr('id');

		database.ref("/"+trainKey).remove();
	});



	$('#signOutBtn').on("click", function(){

		firebase.auth().signOut().then(function() {
		  // Sign-out successful.
		  console.log("Bye");
		  $("#signInWithGithub").toggle();
		  $("#signOutBtn").hide();
		  $(".editBtn, .updateBtn, .deleteBtn, .undoBtn").hide();
		  $('#trainFormPanel').slideToggle(1000,"swing");

		}).catch(function(error) {
		  // An error happened.
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

	// console.log("totalMinutesPast: "+totalMinutesPast);

	var moduloRemainder = totalMinutesPast % frequency;

	var minutesToArrival = frequency - moduloRemainder;

	// console.log("minutesToArrival: "+minutesToArrival);
	
	var nextArrivalTime = moment().add(minutesToArrival, "minutes");

	console.log("nextArrivalTime: "+moment(nextArrivalTime).format("hh:mm A"));

	// Columns Train Name / Destination / Frequency / Next Arrival / Minutes Away
	var trainSchedule = $('#scheduleDetails');
	var tr = $("<tr id='"+key+"'>");
	
	var tdName = $("<td/>");
	var tdNameInput = $("<input type='text' class='trainName' value='"+trainName+"' style='background-color:#181818; color:white;text-align:center;border-width:0px;border:none;'>");
	tdName.append(tdNameInput);
	
	var tdDestination = $("<td/>");
	var tdDestinationInput = $("<input type='text' class='destination' value='"+destination+"' style='background-color:#181818; color:white;text-align:center;border-width:0px;border:none;'>");
	tdDestination.append(tdDestinationInput);

	var tdFrequency = $("<td/>");
	tdFrequency.text(frequency);

	var tdNxtArrival = $("<td/>");
	var tdNxtArrivalInput = $("<input type='text' class='firstTrainTime' value='"+moment(nextArrivalTime).format("hh:mm A")+"' style='background-color:#181818; color:white;text-align:center;border-width:0px;border:none;'>");
	tdNxtArrival.append(tdNxtArrivalInput);

	var tdMinsAway = $("<td/>");
	tdMinsAway.text(minutesToArrival);
	
	var editBtn = $("<button type='submit' class='editBtn btn btn-primary'><i class='fa fa-pencil' aria-hidden='true'></i>Edit</button>");
	var tdEditBtn = $("<td/>");
	tdEditBtn.append(editBtn);

	var updateBtn = $("<button type='submit' class='updateBtn btn-primary'><i class='fa fa-check' aria-hidden='true'> </i>Update</button>");
	var tdUpdateBtn = $("<td/>")
	tdUpdateBtn.append(updateBtn);

	var deleteBtn = $("<button type='submit' class='deleteBtn btn-primary'><i class='fa fa-trash' aria-hidden='true'> </i>Delete</button>");
	var tdDeleteBtn = $("<td/>")
	tdDeleteBtn.append(deleteBtn);

	var undoBtn = $("<button type='submit' class='undoBtn btn-primary'><i class='fa fa-undo' aria-hidden='true'> </i>Undo</button>");
	var tdUndoBtn = $("<td/>")
	tdUndoBtn.append(undoBtn);

	tr.append(tdName);
	tr.append(tdDestination);
	tr.append(tdFrequency);
	tr.append(tdNxtArrival);
	tr.append(tdMinsAway);
	tr.append(tdEditBtn);
	tr.append(tdUpdateBtn);
	tr.append(tdDeleteBtn);
	tr.append(tdUndoBtn);
	trainSchedule.append(tr);

	if(user===null){
		$(".editBtn, .updateBtn, .deleteBtn, .undoBtn").hide();

		$("td> input").attr('disabled', true).addClass('non-editable');
	} else{
		$(".editBtn").show()
		$(".updateBtn, .deleteBtn, .undoBtn").hide();
	}


}