const express = require('express')
var bodyParser = require('body-parser');
var url = require('url');
const sqlite3 = require('sqlite3').verbose();
const path = require('path')
const multer = require('multer');
const fs = require('fs');
const camerautils = require('./camerautils.js');

const app = express()
const port = 3000
const rootPath = '/var/www/skyserver';
const cameraPath = rootPath + "/camera/";
const sqlDBFile = 'meteo.db';
const sqlImageDBFile = 'images.db';
const sqlStatusDBFile = 'status.db';


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, path.join("/var/www/skyserver/camera/"));
  },

  // By default, multer removes file extensions so let's add them back
  filename: function(req, file, cb) {
      //cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      cb(null, file.originalname);
    }
});




function zeroPad(input) {
	if (input < 10) return "0" + input.toString();
	return input.toString();
}

function getDateFromUTCString(inputStr) {
	var dateString = inputStr.split(' ')[0];
	var newDate;
	let year = parseInt(dateString.split('-')[0]);
	let month = parseInt(dateString.split('-')[1]);
	let day = parseInt(dateString.split('-')[2]);
	console.log("year", year);
	console.log("month", month);
	console.log("day", day);
	
	var timeString = inputStr.split(' ')[1];
	if (timeString!=null) {
		let hour = parseInt(timeString.split(':')[0]);
		let minute = parseInt(timeString.split(':')[1]);
		let second = parseFloat(timeString.split(':')[2]);
		console.log("hour", hour);
		console.log("minute", minute);
		console.log("second", second);
	    newDate = new Date (Date.UTC(year, month-1, day, hour, minute, second));
	} else newDate = new Date (Date.UTC(year, month-1, day));
	
	return newDate;
}

function formatUTCDateTime(inputDate) {
	var hours;
	var minutes;
	var seconds;
	var timeString;
	
	year = inputDate.getUTCFullYear();
	month = inputDate.getUTCMonth();
	date = inputDate.getUTCDate();
	
	hours = inputDate.getUTCHours();
 	minutes = inputDate.getUTCMinutes();
	seconds = inputDate.getUTCSeconds();
		
	timeString = year + "-" + zeroPad(month+1) + "-" + zeroPad(date) + " " + zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
	return timeString;
}

app.use(express.static(rootPath));
app.use(bodyParser.urlencoded({
	extended: true
  }));
app.use(bodyParser.json());

var upload  = multer({ dest: cameraPath })

app.post('/upload', upload.single('camera'), function (req, res, next) {
  console.log("received image upload...");
  console.log(req.file);
  var destinationFilename = path.join(req.file.destination, req.file.filename);
  var intendedFilename = path.join(req.file.destination, req.file.originalname);
  console.log("Will rename %s to %s", destinationFilename, intendedFilename);
  fs.rename(destinationFilename, intendedFilename, function(err) {
    	if ( err ) console.log('ERROR: ' + err);
		console.log("rename successful");
		camerautils.scaleFile(intendedFilename, cameraPath);
		});
  
  res.status(204).end();
});

app.get('/metadata', function(request, response) {
	console.log("GET request for image metadata...");

	let db = new sqlite3.Database(path.join(rootPath, sqlImageDBFile), sqlite3.OPEN_READWRITE, (err) => {
	  if (err) {
		return console.error(err.message);
	  } });
	
	let command = request.query.command;
	if (command != null) {
		console.log("command received:", command);
		switch(command) {
			case 'hosts': 
				let SQLstatement = "SELECT DISTINCT(hostname) from images;";
				executeSQL(db, SQLstatement, function (err, data) {
					console.log(data);
					response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    				response.write(JSON.stringify(data, null, '\t')); 
					response.end();
			});
	
				return;
				break;

		}
	}
	let hostname = request.query.host;
	console.log("...for host:", hostname);
	let startDateStr = request.query.start;
	let endDateStr = request.query.end;
	var endDate;
	console.log("endDateStr", endDateStr);
	if (endDateStr == null) {
		endDate = new Date();
		endDateStr = formatUTCDateTime(endDate);
		console.log("No end date specified. Will choose 'now' as end date:", endDateStr);
	} else {
	 	endDate = getDateFromUTCString(endDateStr);
	}

	if (startDateStr != null) {
		console.log("start date: ", startDateStr);
	} else {
		console.log("No start date specified. Will get 24 hours of data.");
		startDate = new Date(endDate.getTime() - 86400*1000);
		startDateStr = formatUTCDateTime(startDate);
	}

	console.log("start:", startDateStr);
	console.log("end:", endDateStr);

	
	let SQLstatement = "SELECT json_extract(images.data, '$') as data from images WHERE date<'" + endDateStr +  "' AND date>'" + startDateStr  + "' AND hostname=='" + hostname + "';";
	try {
		console.log(SQLstatement);
		db.all(SQLstatement, [], processSQLresults);
		success = true;
		db.close();
	} catch (e) {
		console.error("database exception.");
		console.error(e);
		success = false;
		response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    	response.write(JSON.stringify({ "status": "fail"})) 
		response.end();		
	}

	function processSQLresults(err, data) {
		console.log("%d rows returned from database", data.length);
		var dbResults = [];
		for (var d of data) {
			dbResults.push(JSON.parse(d.data));
		}
		response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    	response.write(JSON.stringify(dbResults, null, '\t')); 
		response.end();
	}
	
	
});

app.get('/status', function(request, response) {
	console.log("GET request for device status report...");

	let db = new sqlite3.Database(path.join(rootPath, sqlStatusDBFile), sqlite3.OPEN_READWRITE, (err) => {
	  if (err) {
		return console.error(err.message);
	  } });
	
	let startDateStr = request.query.start;
	let endDateStr = request.query.end;
	var endDate;
	console.log("endDateStr", endDateStr);
	if (endDateStr == null) {
		endDate = new Date();
		endDateStr = formatUTCDateTime(endDate);
		console.log("No end date specified. Will choose 'now' as end date:", endDateStr);
	} else {
	 	endDate = getDateFromUTCString(endDateStr);
	}

	if (startDateStr != null) {
		console.log("start date: ", startDateStr);
	} else {
		console.log("No start date specified. Will get 24 hours of data.");
		startDate = new Date(endDate.getTime() - 86400*1000);
		startDateStr = formatUTCDateTime(startDate);
	}

	console.log("start:", startDateStr);
	console.log("end:", endDateStr);

	
	let SQLstatement = "SELECT json_extract(status.data, '$') as data from status WHERE date<'" + endDateStr +  "' AND date>'" + startDateStr + "';";
	try {
		console.log(SQLstatement);
		db.all(SQLstatement, [], processSQLresults);
		success = true;
		db.close();
	} catch (e) {
		console.error("database exception.");
		console.error(e);
		success = false;
		response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    	response.write(JSON.stringify({ "status": "fail"})) 
		response.end();		
	}

	function processSQLresults(err, data) {
		console.log("%d rows returned from database", data.length);
		var dbResults = [];
		for (var d of data) {
			dbResults.push(JSON.parse(d.data));
		}
		response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    	response.write(JSON.stringify(dbResults, null, '\t')); 
		response.end();
	}
	
	
});

app.post('/status', function(request, response) {
	console.log("skyWATCH device status is incoming...");
	var data = request.body;
	console.log(data);
	var ip;
	if (request.headers['x-forwarded-for']) {
    	ip = request.headers['x-forwarded-for'].split(",")[0];
	} else if (request.connection && request.connection.remoteAddress) {
    	ip = request.connection.remoteAddress;
	} else {
    	ip = request.ip;
	}
  	console.log("Client's remote IP is:", ip);
	data.system.remoteIP = ip;  
	var success = false;
	var SQLstatement = "INSERT INTO status VALUES ('" + data.date + "', '" + data.hostname + "', json('" + JSON.stringify(data) + "'))";
	console.log("SQL:", SQLstatement);
	let db = new sqlite3.Database(path.join(rootPath, sqlStatusDBFile), sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
		  return console.error(err.message);
		} });
  
	  try {
		  db.run(SQLstatement);
		  success = true;
		  db.close();
	  } catch (e) {
		  console.error("database exception.");
		  console.error(e);
		  success = false;
		 
	  }
	  
	console.log("SQL insertion success is", success);
	response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
	if(success) response.write(JSON.stringify({ "status": "success"})) 
	else response.write(JSON.stringify({ "status": "failed"})); 
	response.end();
});

app.post('/imagedata', function(request, response) {
	console.log("Image data is incoming...");
	var data = request.body;
	console.log(data);
	var SQLstatement = "INSERT INTO images VALUES ('" + data.date + "', '" + data.hostname + "', '" + data.file + "', json('" + JSON.stringify(data) + "'))";
	console.log("SQL:", SQLstatement);
	let db = new sqlite3.Database(path.join(rootPath, sqlImageDBFile), sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
		  return console.error(err.message);
		} });
  
	  try {
		  db.run(SQLstatement);
		  success = true;
		  db.close();
	  } catch (e) {
		  console.error("database exception.");
		  console.error(e);
		  success = false;
	  }
	  
	console.log("SQL insertion success is", success);
	response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
	if(success) response.write(JSON.stringify({ "status": "success"})) 
	else response.write(JSON.stringify({ "status": "failed"})); 
	response.end();
	}
);

app.post('/meteo', function(request, response) {
	var success = false;
	console.log("Received a meteo upload");
	var data = request.body;
  	console.log(data);
	var timestamp = data.timestamp;
	var hostname = data.hostname;

	var SQLstatement = "INSERT INTO meteo VALUES ('" + timestamp + "', '" + hostname + "', json('" + JSON.stringify(data) + "'))";
	console.log("SQL:", SQLstatement);

	let db = new sqlite3.Database(path.join(rootPath, sqlDBFile), sqlite3.OPEN_READWRITE, (err) => {
	  if (err) {
		return console.error(err.message);
	  } });

	db.run(SQLstatement, function(err) {
		if (err) {
		  console.log("meteo db error", err.message);
		} else {
			console.log("Inserted in meteo database ok");
			success = true;
		}
	  });
	db.close();
	
  	response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    if(success) response.write(JSON.stringify({ "status": "success"})) 
	else response.write(JSON.stringify({ "status": "failed"}));
    response.end();

});

function executeSQL(db, SQL, callback) {
	try {
		console.log(SQL);
		db.all(SQL, [], callback);
		success = true;
		db.close();
	} catch (e) {
		console.error("database exception.");
		console.error(e);
		callback("error", null);
	}
}

app.get("/regen", function(request, response){
	console.log("Regeneratiing the skycam.json file...");
	camerautils.updateImageFilelist();
	response.redirect("/camera/skycam.json");
});

app.get("/getmeteo", function(request, response) {
	console.log("GET request for meteo data...");

	let db = new sqlite3.Database(path.join(rootPath, sqlDBFile), sqlite3.OPEN_READWRITE, (err) => {
	  if (err) {
		return console.error(err.message);
	  } });
	
	let command = request.query.command;
	if (command != null) {
		console.log("command received:", command);
		switch(command) {
			case 'hosts': 
				const endDate = new Date();
				const endDateStr = formatUTCDateTime(endDate);
				const startDate = new Date(endDate.getTime() - 86400*1000);
				const startDateStr = formatUTCDateTime(startDate);
				console.log("Getting hosts active in the last 24 hours.");
		
				let SQLstatement = "SELECT DISTINCT(hostname) from meteo WHERE date<'" + endDateStr +  "' AND date>'" + startDateStr  + "';";
				executeSQL(db, SQLstatement, function (err, data) {
					console.log(data);
					response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    				response.write(JSON.stringify(data, null, '\t')); 
					response.end();
					});
	
				return;
				break;

		}
	}
	let hostname = request.query.host;
	console.log("..for host:", hostname);
	let startDateStr = request.query.start;
	let endDateStr = request.query.end;
	var endDate;
	console.log("endDateStr", endDateStr);
	if (endDateStr == null) {
		endDate = new Date();
		endDateStr = formatUTCDateTime(endDate);
		console.log("No end date specified. Will choose 'now' as end date:", endDateStr);
	} else {
	 	endDate = getDateFromUTCString(endDateStr);
	}

	if (startDateStr != null) {
		console.log("start date: ", startDateStr);
	} else {
		console.log("No start date specified. Will get 24 hours of data.");
		startDate = new Date(endDate.getTime() - 86400*1000);
		startDateStr = formatUTCDateTime(startDate);
	}

	console.log("start:", startDateStr);
	console.log("end:", endDateStr);

	
	let SQLstatement = "SELECT json_extract(meteo.data, '$') as data from meteo WHERE date<'" + endDateStr +  "' AND date>'" + startDateStr  + "' AND hostname=='" + hostname + "';";
	try {
		console.log(SQLstatement);
		db.all(SQLstatement, [], processSQLresults);
		success = true;
		db.close();
	} catch (e) {
		console.error("database exception.");
		console.error(e);
		success = false;
		response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    	response.write(JSON.stringify({ "status": "fail"})) 
		response.end();		
	}

	function processSQLresults(err, data) {
		console.log("%d rows returned from database", data.length);
		var dbResults = [];
		for (var d of data) {
			dbResults.push(JSON.parse(d.data));
		}
		response.writeHead(200, { 'Content-Type': 'application/json',  'Access-Control-Allow-Origin': '*' });
    	response.write(JSON.stringify(dbResults, null, '\t')); 
		response.end();
	}
	
	
});


app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.listen(port, () => {
  console.log(`skyWATCH webserver app listening at http://localhost:${port}`)
})

