import { subscribeToDataUpdates } from "./firebase_rtdb.js";
import {
    Chart,
    LinearScale,
    CategoryScale,
    BarElement,
    BarController,
    Tooltip,
    Legend
} from "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/+esm";

Chart.register(LinearScale, CategoryScale, BarElement, BarController, Tooltip, Legend);

function getDeviceStatus(deviceLastOnline, now) {
    if (!deviceLastOnline || deviceLastOnline === 0) {
        return "Never online";
    }

    const timeDiff = now - deviceLastOnline;

    if (timeDiff < 0) {
        return "Unknown (time sync issue)"
    }

    if (timeDiff < 15) {
        return "Online";
    } else if (timeDiff < 60) {
        return `Last online: ${timeDiff}s ago`;
    } else if (timeDiff < 3600) {
        return `Last online: ${Math.floor(timeDiff/60)}m ago`;
    } else if (timeDiff < 86400) {
        return `Last online: ${Math.floor(timeDiff/3600)}h ago`;
    } else {
        return `Last online: ${Math.floor(timeDiff/2628000)}mo ago`;
    }
}

function getStatusClass(deviceStatus) {
    if (deviceStatus === "Online") {
        return "online-status";
    } else if (!deviceStatus.includes("ago")) {
        return "unknown-status";
    } else {
        return "offline-status";
    }
}

function populateDeviceList(devices, now) {
    const deviceListElement = document.getElementById("device-list");

    deviceListElement.innerHTML = "";

    if (!devices || Object.keys(devices).length === 0){
        console.log("No device data to populate");
    }

    Object.keys(devices).forEach(deviceId => {
        const deviceData = devices[deviceId];

        const deviceName = deviceData.metadata?.deviceName;
        const deviceLastOnline = deviceData.status?.lastOnline;
        const deviceStatus = getDeviceStatus(deviceLastOnline, now);

        const deviceElement = document.createElement("li");
        deviceElement.classList.add("device-element")
        deviceElement.innerHTML = `
        <span class = "${getStatusClass(deviceStatus)}">&#9673;</span>
        ${deviceName}
        <br>
        <span style = "font-size: 0.7rem; opacity: 60%;">${deviceStatus}</span>
        <br>
        <span style = "font-size: 0.5rem; opacity: 60%">ID: ${deviceId}</span>
        `;
        deviceListElement.appendChild(deviceElement);
    });
}

function populateReadingsList(devices, now) {
    const readingsListElement = document.getElementById("readings-list");

    readingsListElement.innerHTML = "";

    if (!devices || Object.keys(devices).length === 0){
        console.log("No devices to populate readings");
    }

    Object.keys(devices).forEach(deviceId => {
        const deviceData = devices[deviceId];

        const deviceName = deviceData.metadata?.deviceName;
        const deviceLastOnline = deviceData.status?.lastOnline;
        const deviceLocation = deviceData.metadata?.deviceLocation;
        const deviceStatus = getDeviceStatus(deviceLastOnline, now);

        const readingElement = document.createElement("li");
        readingElement.classList.add("device-reading");

        if (deviceStatus === "Online") {
            console.log(deviceLastOnline)
            const reading = deviceData.data[deviceLastOnline];
            readingElement.innerHTML = `
            ${deviceLocation}
            <br>
            <span style = "font-size: 0.7rem; opacity: 60%;">${deviceName}</span>
            <br>
            <span class = "noise-reading-text">${reading}</span>dBA
            `
        } else {
            readingElement.innerHTML = `
            ${deviceLocation}
            <br>
            <span style = "font-size: 0.7rem; opacity: 60%;">${deviceName}</span>
            <br>
            <br>
            Device is offline
            `
        }

        readingsListElement.appendChild(readingElement);
    });
}

// Declare a variable to hold the chart instance outside the function
// so it can be accessed and updated across data changes.
let myBarChartInstance = null;

function makeBarChart(devices, now) {
    const chartLabels = [];
    const chartData = [];

    const oneHourAgo = now - 3600; // Unix timestamp for one hour ago

    Object.keys(devices).forEach(deviceId => {
        const deviceData = devices[deviceId];
        const deviceName = deviceData.metadata?.deviceName || `Device ${deviceId}`;
        const readings = deviceData.data || {};

        let totalNoise = 0;
        let readingCount = 0;

        Object.keys(readings).forEach(timestampStr => {
            const timestamp = parseInt(timestampStr, 10);
            if (timestamp >= oneHourAgo && timestamp <= now) {
                totalNoise += readings[timestampStr];
                readingCount++;
            }
        });

        const averageNoise = readingCount > 0 ? totalNoise / readingCount : 0;

        chartLabels.push(deviceName);
        chartData.push(averageNoise);
    });

    const ctx = document.getElementById('noiseChart');
    if (!ctx) {
        console.error("Canvas element with ID 'noiseChart' not found for Chart.js.");
        return;
    }

    const chartCtx = ctx.getContext('2d');

    // If the chart instance already exists, update its data
    if (myBarChartInstance) {
        myBarChartInstance.data.labels = chartLabels;
        myBarChartInstance.data.datasets[0].data = chartData;
        myBarChartInstance.update(); // This will animate the changes
    } else {
        // Otherwise, create a new chart instance
        myBarChartInstance = new Chart(chartCtx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Average Noise (dBA) in Last Hour',
                    data: chartData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, // Set to true for better handling of parent container resizing
                animation: {
                    duration: 400 // Customize animation duration if needed, 0 to disable
                },
                scales: {
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Average Noise (dBA)',
                            color: '#ffffff'
                        },
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.15)'
                        }
                    },
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'IoT Devices',
                            color: '#ffffff'
                        },
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.15)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff'
                    },
                    legend: {
                        display: false,
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }
}


subscribeToDataUpdates((data) => {
    if (data) {
        const now = Math.round(Date.now()/1000);
        populateDeviceList(data.devices, now);
        populateReadingsList(data.devices, now);
        makeBarChart(data.devices, now);

        const dataDumpField = document.getElementById("dumpField");
        //if (dataDumpField)dataDumpField.textContent = JSON.stringify(data, null, 2);
        window.markDashboardReady?.();
    } else {
        console.log("No data to display");
        window.markDashboardReady?.();
    }
});
