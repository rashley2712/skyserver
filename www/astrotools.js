function zeroPad(input) {
	if (input < 10) return "0" + input.toString();
	return input.toString();
} 

function formatUTCTime(date) {
	var dateStr = date.getUTCFullYear() + "-" + zeroPad(date.getUTCMonth()+1) + "-" + zeroPad(date.getUTCDate());
	var time = zeroPad(date.getUTCHours()) + ":" + zeroPad(date.getUTCMinutes()) + ":" + zeroPad(date.getUTCSeconds());
	return dateStr + " " + time;
}

function formatTime(date) {
	var dateStr = date.getFullYear() + "-" + zeroPad(date.getMonth()+1) + "-" + zeroPad(date.getDate());
	var time = zeroPad(date.getHours()) + ":" + zeroPad(date.getMinutes()) + ":" + zeroPad(date.getSeconds());
	return dateStr + " " + time;
}

function humanTime(seconds) {
	const check = seconds;
	if (seconds < 60) return Math.round(seconds).toString() + " seconds";
	var minutes = seconds/60;
	if (minutes<60) {
		seconds = (minutes - Math.floor(minutes)) * 60;
		return zeroPad(Math.floor(minutes)) + ":" + zeroPad(Math.floor(seconds)) + " minutes";
	}
	var hours = minutes/60;
	minutes = (hours - Math.floor(hours)) * 60;
	return Math.floor(hours) + ":" + zeroPad(Math.floor(minutes))  + " hours";
	// return seconds.toString();
}

function decimalPlacesFloat(value, places) {
	multiplier = Math.pow(10, places);
	return Math.round(value*multiplier) / multiplier;
}

function castSingleDateUTC(text) {
	let year = parseInt(text.substring(0, 4));
	let month = parseInt(text.substring(5, 7));
	let day = parseInt(text.substring(8, 10));
	let hour = parseInt(text.substring(11, 13));
	let minute = parseInt(text.substring(14, 16));
	let second = parseFloat(text.substring(17, 25));
	return new Date(Date.UTC(year, month-1, day, hour, minute, second));
}


function getJSON(url, callback) {
	console.log("calling to fetch:", url);
	var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'json';
		xhr.onload = function() {
			var status = xhr.status;
			if (status === 200) {
				callback(null, xhr.response);
			} else {
				callback(status, xhr.response);
			}
		};
	xhr.send();
};    
