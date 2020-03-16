/**
 * reads monthly logging data and displays graph
 *
 * @author: Kevin Wieland, Michael Ortenstein
 *
 * fills data-gaps in timeline with respective values and hides empty data from being displayed
 */

const DATACOLUMNCOUNT = 19;  // count of native data columns received by mqtt (including timestamp-column)

var overallhausverbrauch = 0;
var hideload2;
var hidespeichersoc;
var hidelpa;
var hidelp1;
var hidelp2;
var hidelp3;
var hidelp4;
var hidelp5;
var hidelp6;
var hidelp7;
var hidelp8;
var atime;
var boolDisplayLp1 = false;
var boolDisplayLp2 = false;
var boolDisplayLp3 = false;
var boolDisplayLp4 = false;
var boolDisplayLp5 = false;
var boolDisplayLp6 = false;
var boolDisplayLp7 = false;
var boolDisplayLp8 = false;
var boolDisplayEvu = false;
var boolDisplayPv = false;
var boolDisplaySpeicheri = false;
var boolDisplaySpeichere = false;
var boolDisplayLp1Soc = false;
var boolDisplayLp2Soc = false;
var boolDisplayLoad1i = false;
var boolDisplayLoad1e = false;
var boolDisplayLoad2i = false;
var boolDisplayLoad2e = false;
var boolDisplayHouseConsumption = false;
var alp1 = [];
var alp2 = [];
var alp3 = [];
var alp4 = [];
var alp5 = [];
var alp6 = [];
var alp7 = [];
var alp8 = [];
var abezug = [];
var aeinspeisung = [];
var lp1soc;
var lp2soc;
var lp1enabled;
var lp2enabled;
var lp3enabled;
var initialread = 0;
var graphloaded = 0;
var boolDisplayLoad1;
var boolDisplayLp1Soc;
var boolDisplayLoad2;
var boolDisplayLp2Soc;
var boolDisplayLp1;
var boolDisplayLp2;
var boolDisplayLp3;
var boolDisplayLp4;
var boolDisplayLp5;
var boolDisplayLp6;
var boolDisplayLp7;
var boolDisplayLp8;
var boolDisplayLpAll;
var boolDisplaySpeicherSoc;
var boolDisplayEvu;
var boolDisplayPv;
var boolDisplayLegend = true;
var boolDisplayLiveGraph;
var datasend = 0;
var allValuesPresent = new Array(12).fill(0);  // flag if all data segments were received
var graphDataSegments = new Array(12).fill('');  // all data segments
var graphDataStr = '';  // holds all concatenated data segments
var csvData = [];  // holds data as 2d-array after calculating values from graphDataStr
var totalValues = [''];  // holds monthly totals for every data-column from csvData, starting with empty value at index 0 (equals timestamp index at csvData)
var lpCounterValues = [];  // holds all counter values transformed to kWh
var overalllp1wh = [];
var overalllp2wh = [];

var apv = [];
var aspeicheri = [];
var aspeichere = [];
var aspeichersoc = [];
var asoc = [];
var asoc1 = [];
var averbraucher2i = [];
var averbraucher2e = [];
var averbraucher1i = [];
var averbraucher1e = [];
var ahausverbrauch = [];
var alpa = [];
var thevalues = [
	["openWB/system/MonthGraphData1", "#"],
	["openWB/system/MonthGraphData2", "#"],
	["openWB/system/MonthGraphData3", "#"],
	["openWB/system/MonthGraphData4", "#"],
	["openWB/system/MonthGraphData5", "#"],
	["openWB/system/MonthGraphData6", "#"],
	["openWB/system/MonthGraphData7", "#"],
	["openWB/system/MonthGraphData8", "#"],
	["openWB/system/MonthGraphData9", "#"],
	["openWB/system/MonthGraphData10", "#"],
	["openWB/system/MonthGraphData11", "#"],
	["openWB/system/MonthGraphData12", "#"],
]
var clientuid = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
var client = new Messaging.Client(location.host, 9001, clientuid);

function handlevar(mqttmsg, mqttpayload, mqtttopic, htmldiv) {
	if ( mqttmsg.match( /^openwb\/system\/monthgraphdata[1-9][0-9]*$/i ) ) {
		// matches to all messages containing "openwb/graph/monthgraphdata#"
		// where # is an integer > 0
		// search is case insensitive
		var index = mqttmsg.match(/\d+/)[0];  // extract first match = number from mqttmsg
		if ( index < 13 && initialread == 0 && (mqttpayload != "empty")) {
			index -= 1;  // adjust to array starting at index 0
			graphDataStr += ('\n') + mqttpayload;
			graphDataSegments[index] = mqttpayload;
			allValuesPresent[index] = 1;
			if ( !allValuesPresent.includes(0) ) {
				// all segments received, so process data and display graph
				loadgraph();
			}
		}
	}
}

//Gets  called if the websocket/mqtt connection gets disconnected for any reason
client.onConnectionLost = function (responseObject) {
	client.connect(options);
}

//Gets called whenever you receive a message
client.onMessageArrived = function (message) {
	handlevar(message.destinationName, message.payloadString, thevalues[0], thevalues[1]);
}

var retries = 0;

//Connect Options
var options = {
	timeout: 5,
	//Gets Called if the connection has sucessfully been established
	onSuccess: function () {
		retries = 0;
		thevalues.forEach(function(thevar) {
			client.subscribe(thevar[0], {qos: 0});
		});
		requestmonthgraph();
	},
	//Gets Called if the connection could not be established
	onFailure: function (message) {
		client.connect(options);
	}
};

//Creates a new Messaging.Message Object and sends it
var publish = function (payload, topic) {
	var message = new Messaging.Message(payload);
	message.destinationName = topic;
	message.qos = 2;
	message.retained = true;
	client.send(message);
}

client.connect(options);

var url_string = window.location.href
var url = new URL(url_string);
var graphdate = url.searchParams.get("date");
if ( graphdate == null) {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();
	graphdate = yyyy + mm;
} else {
	graphdate = graphdate.replace('-','');
}

function requestmonthgraph() {
	publish(graphdate, "openWB/set/graph/RequestMonthGraph");
}

function getCol(matrix, col) {
	var column = [];
	for( var i = 0; i < matrix.length; i++) {
    	column.push(matrix[i][col]);
    }
    return column;
}

function fillMissingDateRows() {
	// fills missing date rows between existing dates for selected month with values
	const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
	for ( var rowIndex = 1; rowIndex < csvData.length; rowIndex++ ) {
		var firstDateStr = csvData[rowIndex-1][0];
		var firstDate = new Date(firstDateStr + ' 00:00:00');
		var secondDateStr = csvData[rowIndex][0];
		var secondDate = new Date(secondDateStr + ' 00:00:00');
		var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
		if ( diffDays > 1 ) {
			// difference between 2 datasets is more than 1 day
			var dd = String(firstDate.getDate() + 1).padStart(2, '0');  // day to insert
			var newDatasetDateStr = firstDateStr.slice(0, 8) + dd;
			var newDataSet = [newDatasetDateStr];  // insert new date in new array-row
			for ( var colIndex = 1; colIndex < csvData[rowIndex-1].length; colIndex++ ) {
				newDataSet.push(csvData[rowIndex-1][colIndex]);  // copy data from older date
			}
			csvData.splice(rowIndex, 0, newDataSet);  // insert row
		}
	}
}

function fillLpCounterValuesArray() {
    // fills an array with same size as csvData but holding counter values of all lp in kWh
    // these values will be displayed at the graph tooltips
	const lpColumns = [4, 5, 6, 12, 13, 14, 15, 16];  // column-indexes of LP-entries in csvData-array
	csvData.forEach((dataRow, rowIndex) => {
		// process every day
		var lpCounterValuesRow = [];  // row to hold the counter values of the day in kWh, first element empty to match index (timestamp in csvData)
		if ( rowIndex < (csvData.length -1) ) {  // skipt last row of csvData-array, it is just needed for calculation
			dataRow.forEach((value, columnIndex) => {
				if ( lpColumns.includes(columnIndex) ) {
					// current column is a LP-counter-value
					lpCounterValuesRow.push(', Zählerstand: ' + (value/1000).toFixed(2) + ' kWh');
				} else {
					// no LP-counter-value so nothing to display
					lpCounterValuesRow.push('');
				}
			});
			lpCounterValues.push(lpCounterValuesRow);
		}
	});
}

function calcDailyValues() {
	// values in logfile are stored as counter values
	// calculates daily values by substracting two consecutive counter values from data array
	// stores results in same array
	for ( var column = 1; column < csvData[0].length; column++ ) {
		// process every column after date-column
		var dataColumn = getCol(csvData, column);
		if ( dataColumn.every( value => value !== 0 ) ) {
			// don't process column if all values are zero
			var prevValue = dataColumn[0];
			var dailyValue = 0;
			var prevDailyValue = 0;
			dataColumn.forEach((value, row) => {
				if ( row > 0 ) {  // start calculation with second row
					dailyValue=(value - prevValue);
					if ( dailyValue > 150000 || dailyValue < 0 ) {
						// avoid large spikes or negative values
						dailyValue=prevDailyValue;
					}
					csvData[row-1][column] = dailyValue/1000;
				}
				prevDailyValue = dailyValue;
				if ( value > 100 ) {
					prevValue = value;
				}
			});
		}
	}
}

function formatDateColumn() {
    // formats the first csvdata-column so date is displayed at labels like 'Mo, 16.03.20'
    for ( var rowIndex = 0; rowIndex < csvData.length; rowIndex++ ) {
        var theDate = new Date(csvData[rowIndex][0]);
        var dd = String(theDate.getDate()).padStart(2, '0');  // format with leading zeros
        var mm = String(theDate.getMonth() + 1).padStart(2, '0'); //January is 0!
        var dayOfWeek = theDate.toLocaleDateString('de-DE', { weekday: 'short'});
        var theDateStr = dayOfWeek + ', ' + dd + '.' + mm + '.' + theDate.getFullYear();
        csvData[rowIndex][0] = theDateStr;
    }
}

function lpCount() {
	// returns amount of LP containing other values than zero
	const lpColumns = [4, 5, 6, 12, 13, 14, 15, 16];  // column-indexes of LP-entries in csvData-array
	var count = 0;
	for ( var i = 0; i < lpColumns.length; i++ ) {
		var dataColumn = getCol(csvData, lpColumns[i]);
		if ( dataColumn.every( value => value !== 0 ) ) {
			count++;
		}
	}
	return count;
}

function loadgraph() {
	var selectedGraphMonth = parseInt(graphdate.slice(4, 6));  // last 2 digits is month
	graphDataStr = graphDataStr.replace(/^\s*[\n]/gm, '');
	// test if graphdata starts with a date followed by comma like 20191201,
	if ( !(/^\d{8},/.test(graphDataStr)) ) {
		// if not: nothing to display
		$("#waitforgraphloadingdiv").html('<br>Keine Daten für diesen Zeitraum verfügbar.');
		$('#canvasdiv').hide();
		return;
	}

	// build array for graph from data-string
	var rawcsv = graphDataStr.split(/\r?\n|\r/);
	rawcsv.forEach((dataRowStr) => {
		var dataRow = dataRowStr.split(',');
		var dataRowDateStr = dataRow[0];
		if ( /^\d{8}$/.test(dataRowDateStr) ) {
			// test if first column is possible date and format correctly
			dataRowDateStr = dataRowDateStr.slice(0, 4) + "/" + dataRowDateStr.slice(4, 6) + "/" + dataRowDateStr.slice(6, 8);
			dataRowDate = new Date(dataRowDateStr);
			if ( dataRowDateStr.length > 0 && dataRowDate !== "Invalid Date" && !isNaN(dataRowDate) ) {
				// date string is not undefined or empty and date string is a date and dataset is for selected month
				dataRow[0] = dataRowDateStr;
				var columnCountDifference = DATACOLUMNCOUNT - dataRow.length;
				if ( columnCountDifference > 0 ) {
					// not enough columns in dataset, maybe due to older logfile, so add zero-fields
					while ( columnCountDifference > 0 ) {
						dataRow.push(0);
						columnCountDifference--;
					}
				} else if ( columnCountDifference < 0 ) {
					// too many columns in dataset, maybe due to read-errors of logfiles, so delete fields
					while ( columnCountDifference < 0 ) {
						dataRow.pop();
						columnCountDifference++;
					}
				}
				dataRow.forEach((value, columnIndex, theArray) => {
					// make sure all fields (except index 0 = timestamp) are numbers with two decimal places
					if ( columnIndex > 0 ) {
						if ( isNaN(value) ) {
							theArray[columnIndex] = 0;
						} else {
							theArray[columnIndex] = parseFloat(value);
						}
					}
				});
				csvData.push(dataRow);
			}
		}
	});

	if ( csvData.length < 2 ) {
		// not enough data rows: nothing to display
		$("#waitforgraphloadingdiv").html('<br>Nicht genügend Daten für diesen Zeitraum verfügbar.');
		$('#canvasdiv').hide();
		return;
	}

	// sort array by date
	csvData.sort((date1, date2) => date1[0].localeCompare(date2[0]));
	// and process array
	fillMissingDateRows();
	fillLpCounterValuesArray();
	calcDailyValues();
    formatDateColumn();

	csvData.pop();  // discard last row in csvData-array, it was just needed for calculation of daily values from original counter-values

	for ( var rowIndex = 0; rowIndex < csvData.length; rowIndex++ ) {
		// calculate daily 'Hausverbrauch [kWh]' from row-values
		// and extend csvData by these values
		// tägl. Hausverbrauch = Bezug - Einspeisung + PV - alle LP + Speicherentladung - Speicherladung ;
		var homeConsumption = csvData[rowIndex][1] - csvData[rowIndex][2] + csvData[rowIndex][3] - csvData[rowIndex][7] + csvData[rowIndex][18] - csvData[rowIndex][17];
		if ( homeConsumption >= 0) {
			csvData[rowIndex].push(homeConsumption);
		} else {
			csvData[rowIndex].push(0);
		}
	}

	for ( var columnIndex = 1; columnIndex < csvData[0].length; columnIndex++ ) {
		// summarize all columns for monthly totals
		var dataColumn = getCol(csvData, columnIndex);
		var total = 0;
		dataColumn.forEach((value) => {
			total+=value;
		});
		totalValues.push(total);
	}

	//for ( var i = 0; i < abezug.length; i += 1) {
	//	var hausverbrauch = abezug[i] + apv[i] - alpa[i] + aspeichere[i] - aspeicheri[i] - aeinspeisung[i];
	//	if ( hausverbrauch >= 0) {
	//	    ahausverbrauch.push((hausverbrauch).toFixed(2));
	//	    overallhausverbrauch += hausverbrauch;
	//	} else {
	//		ahausverbrauch.push('0');
	//	}
	//}

	//build array containing all available data from csvData
	var lineChartDataSets = [
		'', // first entry with index 0 is empty and later removed just needed to sync array index with respective csvData index
		{
			label: 'Bezug ' + totalValues[1].toFixed(2) + ' kWh',
			borderColor: "rgba(255, 0, 0, 0.7)",
			backgroundColor: "rgba(255, 10, 13, 0.3)",
			borderWidth: 1,
			fill: true,
			data: getCol(csvData, 1),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 1)  // custom added field, holds counter values or empty string
		} , {
			label: 'Einspeisung ' + totalValues[2].toFixed(2) + ' kWh',
			borderColor: "rgba(0, 255, 105, 0.9)",
			backgroundColor: "rgba(0, 255, 255, 0.3)",
			borderWidth: 2,
			fill: true,
			data: getCol(csvData, 2),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 2)  // custom added field, holds counter values or empty string
		} , {
			label: 'PV ' + totalValues[3].toFixed(2) + ' kWh',
			borderColor: 'green',
			backgroundColor: "rgba(10, 255, 13, 0.3)",
			fill: true,
			borderWidth: 1,
			data: getCol(csvData, 3),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 3)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp1 ' + totalValues[4].toFixed(2) + ' kWh',
			borderColor: "rgba(0, 0, 255, 0.7)",
			backgroundColor: "rgba(0, 0, 255, 0.7)",
			borderWidth: 1,
			fill: false,
			data: getCol(csvData, 4),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 4)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp2 ' + totalValues[5].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 30, 105, 0.7)",
			backgroundColor: "rgba(50, 30, 105, 0.7)",
			borderWidth: 1,
			fill: false,
			data: getCol(csvData, 5),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 5)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp3 ' + totalValues[6].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.7)",
			backgroundColor: 'blue',
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 6),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 6)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp Gesamt ' + totalValues[7].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.1)",
			backgroundColor: "rgba(0, 0, 255, 0.1)",
			fill: true,
			borderWidth: 2,
			data: getCol(csvData, 7),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 7)  // custom added field, holds counter values or empty string
		} , {
			label: 'Verbraucher 1 I ' + totalValues[8].toFixed(2) + ' kWh',
			borderColor: "rgba(0, 150, 150, 0.7)",
			backgroundColor: "rgba(200, 255, 13, 0.3)",
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 8),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 8)  // custom added field, holds counter values or empty string
		} , {
			label: 'Verbraucher 1 E ' + totalValues[9].toFixed(2) + ' kWh',
			borderColor: "rgba(0, 150, 150, 0.7)",
			backgroundColor: "rgba(200, 255, 13, 0.3)",
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 9),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 9)  // custom added field, holds counter values or empty string
		} , {
			label: 'Verbraucher 2 I ' + totalValues[10].toFixed(2) + ' kWh',
			borderColor: "rgba(150, 150, 0, 0.7)",
			backgroundColor: "rgba(200, 255, 13, 0.3)",
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 10),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 10)  // custom added field, holds counter values or empty string
		} , {
			label: 'Verbraucher 2 E ' + totalValues[11].toFixed(2) + ' kWh',
			borderColor: "rgba(150, 150, 0, 0.7)",
			backgroundColor: "rgba(200, 255, 13, 0.3)",
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 11),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 11)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp4 ' + totalValues[12].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.7)",
			backgroundColor: 'blue',
			fill: false,
			data: getCol(csvData, 12),
			borderWidth: 2,
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 12)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp5 ' + totalValues[13].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.7)",
			backgroundColor: 'blue',
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 13),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 13)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp6 ' + totalValues[14].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.7)",
			backgroundColor: 'blue',
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 14),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 14)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp7 ' + totalValues[15].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.7)",
			backgroundColor: 'blue',
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 15),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 15)  // custom added field, holds counter values or empty string
		} , {
			label: 'Lp8 ' + totalValues[16].toFixed(2) + ' kWh',
			borderColor: "rgba(50, 50, 55, 0.7)",
			backgroundColor: 'blue',
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 16),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 16)  // custom added field, holds counter values or empty string
		} , {
			label: 'Speicher I ' + totalValues[17].toFixed(2) + ' kWh',
			borderColor: 'orange',
			backgroundColor: "rgba(200, 255, 13, 0.3)",
			fill: true,
			borderWidth: 1,
			data: getCol(csvData, 17),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 17)  // custom added field, holds counter values or empty string
		} , {
			label: 'Speicher E ' + totalValues[18].toFixed(2) + ' kWh',
			borderColor: 'orange',
			backgroundColor: "rgba(255, 155, 13, 0.3)",
			fill: true,
			borderWidth: 1,
			data: getCol(csvData, 18),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 18)  // custom added field, holds counter values or empty string
		} , {
			label: 'Hausverbrauch ' + totalValues[19].toFixed(2) + ' kWh',
			borderColor: "rgba(150, 150, 0, 0.7)",
			backgroundColor: "rgba(200, 255, 13, 0.3)",
			fill: false,
			borderWidth: 2,
			data: getCol(csvData, 19),
			yAxisID: 'y-axis-1',
			lineTension: 0.2,
            toolTipData: getCol(lpCounterValues, 0)  // custom added field, always empty string at index 0
		}
	];

	// check if other LP than #1 has data !== 0 and if not, set all LP Gesamt to 0 so it will not be displayed
	if ( lpCount() < 2 ) {
		for ( var rowIndex = 0; rowIndex < csvData.length; rowIndex++ ) {
			csvData[rowIndex][7] = 0;
		}
	}

	// now delete all graph lines containing only zero values
	// by deleting the respective field in the linChartDataSets-array
	for ( var column = 1; column < csvData[0].length; column++ ) {
		// process all data-columns except the date
		// column in csvData is represented by column-entry in linChartData
		var dataColumn = getCol(csvData, column);
		if ( dataColumn.every( value => value === 0 ) ) {
			lineChartDataSets[column] = '';  // mark entry for removal of line if data is all zero
		}
	}
	// now remove lines marked by '' for removal
	lineChartDataSets = lineChartDataSets.filter((element) => element !== '');

	var ctx = document.getElementById('canvas').getContext('2d');
	window.myLine = new Chart(ctx, {
		type: 'line',
		data: {
			labels: getCol(csvData, 0),
			datasets: lineChartDataSets
		},
		options: {
			tooltips: {
				enabled: true,
				mode: 'index',
				callbacks: {
					label: function(dataPoint, graphData) {
                        // get only the name of the respective dataline since total value is visible at legend
                        var xLabel = graphData.datasets[dataPoint.datasetIndex].label.split(' ', 1)[0];
                        // get value for the tooltip-day
                        var yLabel = ', Tageswert: ' + dataPoint.yLabel.toFixed(2) + ' kWh';
                        // get counter value for the day (or empty string if not apliccable)
                        var counter = graphData.datasets[dataPoint.datasetIndex].toolTipData[dataPoint.index];
			   			return xLabel + counter + yLabel;
                    }
				}
			},
			responsive: true,
			maintainAspectRatio: false,
			hover: {
				mode: 'null',
			},
			stacked: false,
			legend: {
				display: boolDisplayLegend,
				position: 'bottom',
			},
			title: {
				display: false
			},
			scales: {
				xAxes: [{
					type: 'category'
				}],
				yAxes: [{
					type: 'linear',
					display: true,
					position: 'left',
					id: 'y-axis-1',
					scaleLabel: {
						display: true,
						labelString: 'Energie [kWh]',
						// middle grey, opacy = 100% (visible)
						fontColor: "rgba(153, 153, 153, 1)"
					}
				}]
			}
		}
	});
	$('#canvas').click (function(evt) {
		// on click of datapoint, jump to day view
		var activePoint = myLine.getElementAtEvent(event);
		if (activePoint.length > 0) {
			var clickedElementindex = activePoint[0]._index;
			var jumpToDate = myLine.data.labels[clickedElementindex];
			window.location.href = "daily.php?date=" + jumpToDate;
		}
	});

	initialread = 1;
	$('#waitforgraphloadingdiv').hide();
}

function showhidedataset(thedataset) {
	if ( window[thedataset] == true ) {
		publish("1","openWB/graph/"+thedataset);
	} else if ( window[thedataset] == false ) {
		publish("0","openWB/graph/"+thedataset);
	} else {
		publish("1","openWB/graph/"+thedataset);
	}
}

function showhidelegend(thedataset) {
	if ( window[thedataset] == true ) {
		publish("0","openWB/graph/"+thedataset);
	} else if ( window[thedataset] == false ) {
		publish("1","openWB/graph/"+thedataset);
	} else {
		publish("0","openWB/graph/"+thedataset);
	}
}

function showhide(thedataset) {
	if ( window[thedataset] == 0 ) {
		publish("1","openWB/graph/"+thedataset);
	} else if ( window[thedataset] == 1 ) {
		publish("0","openWB/graph/"+thedataset);
	} else {
		publish("1","openWB/graph/"+thedataset);
	}
}
