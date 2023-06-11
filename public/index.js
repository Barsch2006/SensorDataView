async function searchFilter() {
    // get the data of the form 
    var form = document.querySelector(".filter");
    var formData = new FormData(form);
    var data = {};
    data.start = formData.get("start");
    data.end = formData.get("end");
    const newResData = await fetch(`/api/room/${data.start.length > 0 ? data.start : 'all'}/${data.end.length > 0 ? data.end : 'all'}`).then(res => res.json());
    parseData(newResData);
}

function showGraph(graphData) {
    // Load the Visualization API and the corechart package.
    google.charts.load('current', { 'packages': ['corechart'] });
    // Set a callback to run when the Google Visualization API is loaded.
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = google.visualization.arrayToDataTable(graphData);

        var options = {
            title: 'JIA Sensor Data',
            curveType: 'function',
            legend: { position: 'bottom' }
        };

        var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

        chart.draw(data, options);
    }
}

function showTable(tableData) {
    // make a table from the data the server sent
    var table = document.querySelector(".data");
    table.innerHTML = "";
    var tableHead = document.createElement("tr");
    tableHead.innerHTML = "<th>Room</th><th>Value</th><th>Timestamp</th>";
    table.appendChild(tableHead);
    for (var i = 0; i < tableData.length; i++) {
        var tableRow = document.createElement("tr");
        tableRow.innerHTML = `<td>${tableData[i].name}</td><td>${tableData[i].value}</td><td>${tableData[i].timestamp}</td>`;
        table.appendChild(tableRow);
    }
}

async function parseData(data) {
    // sort data by timestamp
    data.sort((a, b) => {
        return a.timestamp.localeCompare(b.timestamp);
    });
    // parse the data to a graph
    var graphData = [];
    let head = ["Time"];
    let rooms = await fetch("/api/rooms").then(res => res.json());
    rooms.forEach(room => {
        head.push(room.name);
    });
    graphData.push(head);
    graphData.push(...sortData(data));
    console.log(graphData);
    showGraph(graphData);
    showTable(data);
    optionButtons(data);
}

function optionButtons(data) {
    // add a button to download the data as a csv file
    var downloadButton = document.createElement("button");
    downloadButton.innerHTML = "Download as CSV";
    downloadButton.addEventListener("click", () => {
        var csv = "Room,Value,Timestamp\n";
        tableData.forEach(element => {
            csv += `${element.name},${element.value},${element.timestamp}\n`;
        });
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        hiddenElement.target = '_blank';
        hiddenElement.download = 'data.csv';
        hiddenElement.click();
    });
    document.querySelector('.options').appendChild(downloadButton);
    // add a button to download the graph as a png file
    var downloadButton = document.createElement("button");
    downloadButton.innerHTML = "Download as PNG";
    downloadButton.addEventListener("click", () => {
        var svg = document.querySelector('svg');
        var canvas = document.createElement('canvas');
        canvas.width = svg.width.baseVal.value;
        canvas.height = svg.height.baseVal.value;
        var ctx = canvas.getContext('2d');
        var data = (new XMLSerializer()).serializeToString(svg);
        var DOMURL = window.URL || window.webkitURL || window;
        var img = new Image();
        var svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
        var url = DOMURL.createObjectURL(svgBlob);
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);
            var imgURI = canvas
                .toDataURL('image/png')
                .replace('image/png', 'image/octet-stream');
            triggerDownload(imgURI);
            // triggerDownload function
            function triggerDownload(imgURI) {
                var evt = new MouseEvent('click', {
                    view: window,
                    bubbles: false,
                    cancelable: true
                });
                var a = document.createElement('a');
                a.setAttribute('download', 'graph.png');
                a.setAttribute('href', imgURI);
                a.setAttribute('target', '_blank');
                a.dispatchEvent(evt);
            }
        };
        img.src = url;
    });
    document.querySelector('.options').appendChild(downloadButton);
}

function sortData(data) {
    // the data is sorted like: [{name: "room1", value: 1, timestamp: "2020-12-12"}, {name: "room2", value: 2, timestamp: "2020-12-12"}]
    // I want to have an array like: [["2020-12-12", 1, 2], ["2020-12-13", 2, 3]]
    var sortedData = [];
    var dates = [];
    data.forEach(element => {
        if (!dates.includes(element.timestamp)) {
            dates.push(element.timestamp);
        }
    }
    );
    dates.forEach(date => {
        var temp = [date];
        data.forEach(element => {
            if (element.timestamp == date) {
                temp.push(parseFloat(element.value));
            }
        });
        sortedData.push(temp);
    });
    return sortedData;
}

window.onload = searchFilter();
