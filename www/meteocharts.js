function drawTemperatureChart(data) {
	console.log("...drawing the temperature graph.");
	// Copy the data

	var domeTemperature = [];	
	var CPUTemperature = [];
	var skyTemperature = [];
	var ambientTemperature = [];
	for (d of data) {
		//console.log(d);
		var dataPoint;
		try {
			dataPoint = {x: d.dateTime, y: d.dome.temperature}; 
			if (d.dome.temperature>-100) domeTemperature.push(dataPoint);
		} catch {
			console.error("missing dome data");
		}
		try { 
			dataPoint = {x: d.dateTime, y: d.cpu.temperature};
			if (d.cpu.temperature>-100) CPUTemperature.push(dataPoint);
		} catch {
			console.error("missing CPU data");
		}
		try {
			dataPoint = {x: d.dateTime, y: d.IR.sky};
			if (d.IR.sky>-100) skyTemperature.push(dataPoint);
			dataPoint = {x: d.dateTime, y: d.IR.ambient};
			if (d.IR.ambient>-100) ambientTemperature.push(dataPoint);
		} catch {
			console.error("missing IR data");
		}
	}

	var temperatureChartObject = {
		type: 'scatter',
		data: {
		datasets: [{
			label: 'Dome',
			pointBackgroundColor: 'rgba(0, 0, 0, 0.5)',
			pointBorderColor: 'rgba(0, 0, 0, 0.5)',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			pointRadius: 2,
			pointStyle: 'rect',
			data: domeTemperature
			},
			{ 
			label: 'CPU', 
			pointBackgroundColor: 'rgba(200, 0, 0, 0.5)',
			pointBorderColor: 'rgba(200, 0, 0, 0.5)',
			backgroundColor: 'rgba(200, 0, 0, 0.5)',
			pointRadius: 2,
			pointStyle: 'circle',
			data: CPUTemperature
			}			
		]
		},
		options: {
			responsive: false,
			animation: false,
			title: {
				display: true,
				text:  "Temperature",
				fontSize: 20,
				fontFamily: "verdana,arial,sans serif"
			},
			legend: {
				display: true,
				position: 'top',

				labels: {
					fontColor: 'rgb(0, 0, 0)',
					usePointStyle: true
				}
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {hour: 'HH:mm'}
					},
					scaleLabel: {
						display: true,
						labelString: 'Time of day'
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Temperature (\u00B0C)'
					}
				}]
			}
		}
	};

	// Only show IR data if it exists
	if (skyTemperature.length>1) {
		temperatureChartObject.data.datasets.push(
			{ 
				label: 'Sky', 
				pointBackgroundColor: 'rgba(50, 50, 180, 0.5)',
				pointBorderColor: 'rgba(50, 50, 180, 0.5)',
				backgroundColor: 'rgba(50, 50, 180, 0.5)',
				pointRadius: 2,
				pointStyle: 'dot',
				data: skyTemperature
			}
		);
		temperatureChartObject.data.datasets.push(
			{
				label: 'Ambient',
				pointBackgroundColor: 'rgba(0, 200, 0, 0.5)',
				pointBorderColor: 'rgba(0, 200, 0, 0.5)',
				backgroundColor: 'rgba(0, 200, 0, 0.5)',
				pointRadius: 2,
				pointStyle: 'triangle',
				data: ambientTemperature
			}
		);
	}

	temperatureChart = new Chart(document.getElementById('temperatureChart').getContext('2d'), temperatureChartObject);
	return temperatureChart;
}

function drawHumidityChart(data) {
	console.log("...drawing the humidity graph.");
	// Copy the data 
	var domeHumidity = [];
	for (d of data) {
		var dataPoint = {x: d.dateTime, y: d.dome.humidity}; 
		domeHumidity.push(dataPoint);
	}

	var chartObject = {
		type: 'scatter',
		data: {
		datasets: [{
			label: 'Dome',
			pointBackgroundColor: 'rgba(100, 100, 200, 0.5)',
			pointBorderColor: 'rgba(100, 100, 200, 0.5)',
			backgroundColor: 'rgba(100, 100, 100, 0.5)',
			pointRadius: 2,
			pointStyle: 'rect',
			data: domeHumidity
			}]
		},
		options: {
			responsive: false,
			animation: false,
			title: {
				display: true,
				text:  "Humidity",
				fontSize: 20,
				fontFamily: "verdana,arial,sans serif"
			},
			legend: {
				display: false,
				position: 'top',

				labels: {
					fontColor: 'rgb(0, 0, 200)',
					usePointStyle: true
				}
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {hour: 'HH:mm'}
					},
					scaleLabel: {
						display: true,
						labelString: 'Time of day'
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Humidity (%)'
					},
					ticks: {
						min: 0,
						max: 100
					}
				}]
			}
		}
	};

	humidityChart = new Chart(document.getElementById('humidityChart').getContext('2d'), chartObject);
	return  humidityChart;
}

function drawPressureChart(data) {
	console.log("...drawing the pressure graph.");
	// Copy the data 
	var domePressure = [];
	for (d of data) {
		var dataPoint = {x: d.dateTime, y: d.dome.pressure}; 
		if (d.dome.pressure>0) domePressure.push(dataPoint);
	}

	var chartObject = {
		type: 'scatter',
		data: {
		datasets: [{
			label: 'Dome',
			pointBackgroundColor: 'rgba(100, 100, 100, 0.5)',
			pointBorderColor: 'rgba(100, 100, 100, 0.5)',
			backgroundColor: 'rgba(100, 100, 100, 0.5)',
			pointRadius: 2,
			pointStyle: 'rect',
			data: domePressure
			}]
		},
		options: {
			responsive: false,
			animation: false,
			title: {
				display: true,
				text:  "Pressure",
				fontSize: 20,
				fontFamily: "verdana,arial,sans serif"
			},
			legend: {
				display: false,
				position: 'top',

				labels: {
					fontColor: 'rgb(100, 100, 100)',
					usePointStyle: true
				}
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {hour: 'HH:mm'}
					},
					scaleLabel: {
						display: true,
						labelString: 'Time of day'
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Pressure (hPa)'
					}
					
				}]
			}
		}
	};

	pressureChart = new Chart(document.getElementById('pressureChart').getContext('2d'), chartObject);
	return  pressureChart;
}

function drawCloudChart(data) {
	console.log("...drawing the cloud chart.");
	// Copy the data 
	var cloudCoverage = [];
	for (d of data) {
		var dataPoint = {x: d.dateTime, y: d.cloud}; 
		if (d.cloud>=0) cloudCoverage.push(dataPoint);
	}

	var chartObject = {
		type: 'bar',
		data: {
		datasets: [{
			backgroundColor: 'rgba(10, 10, 10, 0.5)',
			data: cloudCoverage
			}]
		},
		options: {
			responsive: false,
			animation: false,
			title: {
				display: true,
				text:  "Cloud coverage",
				fontSize: 20,
				fontFamily: "verdana,arial,sans serif"
			},
			legend: {
				display: false,
				position: 'top',

				labels: {
					fontColor: 'rgb(100, 100, 100)',
					usePointStyle: true
				}
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {hour: 'HH:mm'}
					},
					scaleLabel: {
						display: true,
						labelString: 'Time of day'
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Cloud fraction'
					},
					ticks: {
						min: 0,
						max: 1
					}
					
				}]
			}
		}
	};

	cloudChart = new Chart(document.getElementById('cloudChart').getContext('2d'), chartObject);
	return  cloudChart;
}

function drawBatteryChart(data) {
	console.log("...drawing the battery graph.");
	// Copy the data

	var voltage = [];	
	var current = [];
	var charge = [];
	for (d of data) {
		var dataPoint;
		try {
			dataPoint = {x: d.dateTime, y: d.battery.voltage}; 
			if (d.battery.voltage>-100) voltage.push(dataPoint);
		} catch {
			console.error("missing voltage data");
		}
		try {
			dataPoint = {x: d.dateTime, y: d.battery.current}; 
			if (d.battery.current>-999) current.push(dataPoint);
		} catch {
			console.error("missing current data");
		}
		try {
			dataPoint = {x: d.dateTime, y: d.battery.charge}; 
			charge.push(dataPoint);
		} catch {
			console.error("missing current data");
		}
	}

	var batteryChartObject = {
		type: 'scatter',
		data: {
		datasets: [{
				label: 'voltage',
				pointBackgroundColor: 'rgba(0, 0, 0, 0.5)',
				pointBorderColor: 'rgba(0, 0, 0, 0.5)',
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				pointRadius: 2,
				pointStyle: 'rect',
				data: voltage,
				yAxisID: 'voltage'
			}, {
				label: 'current',
				backgroundColor: 'rgba(0, 200, 0, 0.5)',
				pointBackgroundColor: 'rgba(0, 200, 0, 0.5)',
				pointBorderColor: 'rgba(0, 100, 0, 0.5)',
				pointRadius: 2,
				pointStyle: 'circle',
				data: current,
				yAxisID: 'current'
			}, {
				label: 'charge',
				backgroundColor: 'rgba(200, 200, 0, 0.5)',
				pointBackgroundColor: 'rgba(200, 200, 0, 0.5)',
				pointBorderColor: 'rgba(200, 100, 0, 0.5)',
				pointRadius: 2,
				pointStyle: 'triangle',
				data: charge,
				yAxisID: 'charge'
			}		
		]
		},
		options: {
			responsive: false,
			animation: false,
			title: {
				display: true,
				text:  "Battery",
				fontSize: 20,
				fontFamily: "verdana,arial,sans serif"
			},
			legend: {
				display: true,
				position: 'top',
				labels: {
					fontColor: 'rgb(0, 0, 0)',
					usePointStyle: true
				}
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {hour: 'HH:mm'}
					},
					scaleLabel: {
						display: true,
						labelString: 'Time of day'
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Voltage (V)', 
						
					},
					id: 'voltage',
					position: 'left'
				}, {
					scaleLabel: {
						display: true,
						labelString: 'Current (mA)', 
						
					},
					id: 'current',
					position: 'right'
				}, {
					scaleLabel: {
						display: true,
						labelString: 'Charge (%)', 
						
					},
					ticks: {
						beginAtZero: true,
						min: 0,
						max: 100
					},
					id: 'charge',
					position: 'right'
				}]
			}
		}
	};
	batteryChart = new Chart(document.getElementById('batteryChart').getContext('2d'), batteryChartObject);
	return batteryChart;
}