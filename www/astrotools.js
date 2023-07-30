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
	if (hours<24) return Math.floor(hours) + ":" + zeroPad(Math.floor(minutes))  + " hours";

	var days = hours/24;
	hours = (days - Math.floor(days)) * 24;
	return Math.floor(days) + "d " + Math.floor(hours) + "h";
	return seconds.toString();
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


// Calendar drawing
function drawCalendar(startDate, endDate, parentElement) {
	var startMonth = parseInt(startDate.substring(5, 7));
	var endMonth = parseInt(endDate.substring(5, 7));
	var startYear = parseInt(startDate.substring(0, 5));
	var endYear = parseInt(endDate.substring(0, 5));
	var cols = 4;
	let fullTable = document.createElement("table");
	let counter = 0;
	var tableRow;
	for (var year=startYear; year<=endYear; year++) {
		if (year==endYear) stopMonth=endMonth; else stopMonth=12;
		for (var month=startMonth; month<=stopMonth; month++) {
			if (counter % cols == 0) tableRow = document.createElement("tr");
			var monthElement = document.createElement("div");
			let tableData = document.createElement("td");
			tableData.setAttribute('class', 'master');
			drawMonth(month, year, tableData);
			monthElement.id = "month_" + zeroPad(month.toString()) + year.toString();
			monthElement.name = "month_" + zeroPad(month.toString()) + year.toString();
			drawMonth(month, year, monthElement);
			// parentElement.appendChild(monthElement);
			tableRow.appendChild(tableData);
			if (counter % cols == cols-1) {
				fullTable.appendChild(tableRow);
			}
			counter++;		
		}
		if (counter % cols != cols-1) {
			fullTable.appendChild(tableRow);
		}
		
		startMonth=1;
	}
	parentElement.appendChild(fullTable);
}

function drawMonth(month, year, element) {
	var debug = false;
	var dateCursor = new Date();
	if (debug) console.log("date:", dateCursor);
	//calendarYear = dateCursor.getFullYear();
	calendarYear = year;
	//calendarMonth = dateCursor.getMonth();
	calendarMonth = month-1;
	//calendarDay = 15;
	//console.log("Current day:", calendarDay);
	if (debug) console.log("Current month:", calendarMonth);
	if (debug) console.log("Current year:", calendarYear);
	
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	let monthString = months[calendarMonth];
	let firstDay = new Date(calendarYear, calendarMonth, 1);
	let lastDay = new Date(calendarYear, calendarMonth+1, 0).getDate();
	dayOfWeek = firstDay.getDay();
	if (debug) console.log(firstDay);
	if (debug) console.log(lastDay);
	if (debug) console.log("First day is a", days[dayOfWeek]);
	tableHTML = "<table border=\"1\" class=\"calendar\">\n";
	tableHTML+="\t<tr><td colspan=\"7\" class=\"month-header\">" + monthString + " " + calendarYear + "</td></tr>\n";
	tableHTML+="\t<tr>\n";
	tableHTML+="\t\t<td>S</td><td>M</td><td>T</td><td>W</td><td>T</td><td>F</td><td>S</td>\n";	
	tableHTML+="\t</tr>\n";
	tableHTML+="\t<tr>\n";
	for (var i=0; i<dayOfWeek;i++) { 
		let day = new Date(firstDay.getTime() - 86400*1000 * (dayOfWeek-i));
		let dayNumber = day.getDate();
		tableHTML+="\t\t<td>" + dayNumber + "</td>\n"; 
		}
	var dayCounter = 0;
	for (var i=dayOfWeek; i<7; i++) {
		let day = new Date(firstDay.getTime() + dayCounter * 86400*1000);
		let dayNumber = day.getDate();
		let idString = "day_" + year + "-" + zeroPad(month) + "-" + zeroPad(dayNumber);
		tableHTML+="\t\t<td id=\"" + idString + "\" onmouseover=\"highlight(this)\" onmouseout=\"unhighlight(this)\"><span class=\"active\">" + dayNumber + "</span>";
		tableHTML+="</td>\n";
		dayCounter++;
	}
	tableHTML+="\t</tr>\n";
	while (dayCounter<lastDay) {
		tableHTML+="\t<tr>\n";
		for (var i=0; i<7; i++) {
			let day = new Date(firstDay.getTime() + dayCounter * 86400*1000);
			let dayNumber = day.getDate();
			let idString = "day_" + year + "-" + zeroPad(month) + "-" + zeroPad(dayNumber);
			if (dayCounter<lastDay) {
				tableHTML+="\t\t<td id=\"" + idString + "\" onmouseover=\"highlight(this)\" onmouseout=\"unhighlight(this)\"><span class=\"active\">" + dayNumber + "</span>";
				tableHTML+="</td>\n";
			}
			else  
				tableHTML+="\t\t<td>" + dayNumber + "</td>\n";
			dayCounter++;
		}
		tableHTML+="\t</tr>\n";
	}
	
	tableHTML+= "</table>";
	if (debug) console.log(tableHTML);
	
	element.innerHTML = tableHTML;
}