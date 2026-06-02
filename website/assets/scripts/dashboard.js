import { subscribeToDataUpdates } from "./firebase_rtdb.js";
import {
    Chart,
    LinearScale,
    CategoryScale,
    BarElement,
    BarController,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    Legend
} from "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/+esm";

Chart.register(
    LinearScale,
    CategoryScale,
    BarElement,
    BarController,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    Legend
);

const chartColors = [
    "#4470ad",
    "#d75f5f",
    "#3f9c72",
    "#d39532",
    "#8a6fd1",
    "#2f9ca3",
    "#c25f99",
    "#6c8f36"
];

function getDeviceIds(devices) {
    if (!devices) {
        return [];
    }

    const deviceIds = Object.keys(devices);
    deviceIds.sort();
    return deviceIds;
}

function getDeviceColor(index) {
    return chartColors[index % chartColors.length];
}

function getTransparentColors(colors) {
    const transparentColors = [];

    colors.forEach(color => {
        transparentColors.push(`${color}99`);
    });

    return transparentColors;
}

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
        const deviceTemperature = deviceData.status?.internalTemperature ?? "unknown";
        const deviceStatus = getDeviceStatus(deviceLastOnline, now);

        const deviceElement = document.createElement("li");
        deviceElement.classList.add("device-element")
        deviceElement.innerHTML = `
        <span class = "${getStatusClass(deviceStatus)}">&#9673;</span>
        ${deviceName}
        <br>
        <span style = "font-size: 0.7rem; opacity: 60%;">${deviceStatus}</span>
        <br>
        <span style = "font-size: 0.5rem; opacity: 60%">ID: ${deviceId} |</span>
        <span style = "font-size: 0.5rem; opacity: 60%">Temp: ${deviceTemperature} ℃</span>
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
let hourlyNoiseChartInstance = null;
let thresholdChartInstance = null;
let latestDevices = null;
let latestNow = null;

function makeBarChart(devices, now) {
    const chartLabels = [];
    const chartData = [];
    const barColors = [];

    const oneHourAgo = now - 3600;

    getDeviceIds(devices).forEach((deviceId, index) => {
        const deviceData = devices[deviceId];
        const deviceName = deviceData.metadata?.deviceName || `Device ${deviceId}`;
        const readings = deviceData.data || {};

        let totalNoise = 0;
        let readingCount = 0;

        Object.keys(readings).forEach(timestampStr => {
            const timestamp = parseInt(timestampStr, 10);
            const readingNumber = getReadingNumber(readings[timestampStr]);

            if (timestamp >= oneHourAgo && timestamp <= now && readingNumber !== null) {
                totalNoise += readingNumber;
                readingCount++;
            }
        });

        let averageNoise = 0;
        if (readingCount > 0) {
            averageNoise = totalNoise / readingCount;
        }

        chartLabels.push(deviceName);
        chartData.push(averageNoise);
        barColors.push(getDeviceColor(index));
    });

    const ctx = document.getElementById('noiseChart');
    if (!ctx) {
        console.error("Canvas element with ID 'noiseChart' not found for Chart.js.");
        return;
    }

    const chartCtx = ctx.getContext('2d');
    const textColor = getChartTextColor();

    // If the chart instance already exists, update its data
    if (myBarChartInstance) {
        myBarChartInstance.data.labels = chartLabels;
        myBarChartInstance.data.datasets[0].data = chartData;
        myBarChartInstance.data.datasets[0].backgroundColor = getTransparentColors(barColors);
        myBarChartInstance.data.datasets[0].borderColor = barColors;
        myBarChartInstance.options.scales.x.title.color = textColor;
        myBarChartInstance.options.scales.x.ticks.color = textColor;
        myBarChartInstance.options.scales.y.title.color = textColor;
        myBarChartInstance.options.scales.y.ticks.color = textColor;
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
                    backgroundColor: getTransparentColors(barColors),
                    borderColor: barColors,
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
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: 'rgba(128,128,128,0.2)'
                        }
                    },
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'IoT Devices',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: 'rgba(128,128,128,0.16)'
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
                            color: textColor
                        }
                    }
                }
            }
        });
    }
}

function getHourlyBucketStarts(now, hourCount) {
    const currentHourStart = Math.floor(now / 3600) * 3600;
    const hourStarts = [];

    for (let index = 0; index < hourCount; index++) {
        const hoursBeforeCurrentHour = hourCount - 1 - index;
        const hourStart = currentHourStart - (hoursBeforeCurrentHour * 3600);
        hourStarts.push(hourStart);
    }

    return hourStarts;
}

function formatHourLabel(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
        hour: "numeric"
    });
}

function getReadingNumber(reading) {
    const readingNumber = Number(reading);

    if (Number.isFinite(readingNumber)) {
        return readingNumber;
    }

    return null;
}

function getChartTextColor() {
    return getComputedStyle(document.body).color;
}

function getHourlyAverages(readings, hourStarts) {
    const bucketsByHour = new Map();

    hourStarts.forEach(hourStart => {
        bucketsByHour.set(hourStart, { total: 0, count: 0 });
    });

    const firstHourStart = hourStarts[0];
    const finalHourEnd = hourStarts[hourStarts.length - 1] + 3600;

    if (!readings) {
        readings = {};
    }

    Object.entries(readings).forEach(([timestampStr, reading]) => {
        const timestamp = Number(timestampStr);
        const readingNumber = getReadingNumber(reading);

        if (!Number.isFinite(timestamp) || readingNumber === null) {
            return;
        }

        if (timestamp < firstHourStart || timestamp >= finalHourEnd) {
            return;
        }

        const hourStart = Math.floor(timestamp / 3600) * 3600;
        const bucket = bucketsByHour.get(hourStart);

        if (bucket) {
            bucket.total += readingNumber;
            bucket.count++;
        }
    });

    const hourlyAverages = [];

    hourStarts.forEach(hourStart => {
        const bucket = bucketsByHour.get(hourStart);

        if (bucket.count > 0) {
            hourlyAverages.push(Number((bucket.total / bucket.count).toFixed(1)));
        } else {
            hourlyAverages.push(null);
        }
    });

    return hourlyAverages;
}

function makeHourlyNoiseLineChart(devices, now) {
    const ctx = document.getElementById("line-chart");
    if (!ctx) {
        console.error("Canvas element with ID 'line-chart' not found for Chart.js.");
        return;
    }

    const hourStarts = getHourlyBucketStarts(now, 12);
    const chartLabels = hourStarts.map(formatHourLabel);
    const textColor = getChartTextColor();

    const datasets = [];

    getDeviceIds(devices).forEach((deviceId, index) => {
        const deviceData = devices[deviceId];
        const deviceName = deviceData.metadata?.deviceName || `Device ${deviceId}`;
        const color = getDeviceColor(index);

        datasets.push({
            label: deviceName,
            data: getHourlyAverages(deviceData.data, hourStarts),
            borderColor: color,
            backgroundColor: `${color}33`,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.3,
            spanGaps: true
        });
    });

    if (hourlyNoiseChartInstance) {
        hourlyNoiseChartInstance.data.labels = chartLabels;
        hourlyNoiseChartInstance.data.datasets = datasets;
        hourlyNoiseChartInstance.options.scales.x.title.color = textColor;
        hourlyNoiseChartInstance.options.scales.x.ticks.color = textColor;
        hourlyNoiseChartInstance.options.scales.y.title.color = textColor;
        hourlyNoiseChartInstance.options.scales.y.ticks.color = textColor;
        hourlyNoiseChartInstance.options.plugins.legend.labels.color = textColor;
        hourlyNoiseChartInstance.update("none");
        return;
    }

    hourlyNoiseChartInstance = new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                y: {
                    type: "linear",
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Average Noise (dBA)",
                        color: textColor
                    },
                    ticks: {
                        precision: 0,
                        color: textColor
                    },
                    grid: {
                        color: "rgba(128,128,128,0.2)"
                    }
                },
                x: {
                    type: "category",
                    title: {
                        display: true,
                        text: "Hour",
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: "rgba(128,128,128,0.16)"
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y;
                            if (value === null) {
                                return `${context.dataset.label}: no readings`;
                            }
                            return `${context.dataset.label}: ${value} dBA`;
                        }
                    }
                },
                legend: {
                    position: "bottom",
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function getThresholdValue() {
    const slider = document.getElementById("threshold-slider");

    if (!slider) {
        return 70;
    }

    return Number(slider.value);
}

function getThresholdWindowSeconds() {
    const windowSelect = document.getElementById("threshold-window");

    if (!windowSelect) {
        return 86400;
    }

    return Number(windowSelect.value);
}

function getThresholdWindowLabel() {
    const windowSelect = document.getElementById("threshold-window");

    if (!windowSelect) {
        return "last 24 hours";
    }

    return windowSelect.options[windowSelect.selectedIndex].text.toLowerCase();
}

function updateThresholdLabel() {
    const valueElement = document.getElementById("threshold-value");
    if (valueElement) {
        valueElement.textContent = getThresholdValue();
    }
}

function getThresholdData(readings, now, threshold, windowSeconds) {
    const earliestTime = now - windowSeconds;
    let totalReadings = 0;
    let readingsAboveThreshold = 0;

    if (!readings) {
        readings = {};
    }

    Object.entries(readings).forEach(([timestampStr, reading]) => {
        const timestamp = Number(timestampStr);
        const readingNumber = getReadingNumber(reading);

        if (!Number.isFinite(timestamp) || readingNumber === null) {
            return;
        }

        if (timestamp >= earliestTime && timestamp <= now) {
            totalReadings++;
            if (readingNumber >= threshold) {
                readingsAboveThreshold++;
            }
        }
    });

    let percentage = 0;
    if (totalReadings > 0) {
        percentage = (readingsAboveThreshold / totalReadings) * 100;
    }

    return {
        percentage: Number(percentage.toFixed(1)),
        readingsAboveThreshold: readingsAboveThreshold,
        totalReadings: totalReadings
    };
}

function makeThresholdChart(devices, now) {
    const ctx = document.getElementById("threshold-chart");
    if (!ctx) {
        console.error("Canvas element with ID 'threshold-chart' not found for Chart.js.");
        return;
    }

    const threshold = getThresholdValue();
    const windowSeconds = getThresholdWindowSeconds();
    const windowLabel = getThresholdWindowLabel();
    const chartLabels = [];
    const chartData = [];
    const barColors = [];
    const counts = [];

    getDeviceIds(devices).forEach((deviceId, index) => {
        const deviceData = devices[deviceId];
        const deviceName = deviceData.metadata?.deviceName || `Device ${deviceId}`;
        const thresholdData = getThresholdData(deviceData.data, now, threshold, windowSeconds);
        const color = getDeviceColor(index);

        chartLabels.push(deviceName);
        chartData.push(thresholdData.percentage);
        barColors.push(color);
        counts.push(thresholdData);
    });

    if (thresholdChartInstance) {
        thresholdChartInstance.data.labels = chartLabels;
        thresholdChartInstance.data.datasets[0].label = `Readings at or above ${threshold}dBA (${windowLabel})`;
        thresholdChartInstance.data.datasets[0].data = chartData;
        thresholdChartInstance.data.datasets[0].backgroundColor = getTransparentColors(barColors);
        thresholdChartInstance.data.datasets[0].borderColor = barColors;
        thresholdChartInstance.data.datasets[0].counts = counts;
        thresholdChartInstance.update();
        return;
    }

    const textColor = getChartTextColor();

    thresholdChartInstance = new Chart(ctx.getContext("2d"), {
        type: "bar",
        data: {
            labels: chartLabels,
            datasets: [{
                label: `Readings at or above ${threshold}dBA (${windowLabel})`,
                data: chartData,
                counts: counts,
                backgroundColor: getTransparentColors(barColors),
                borderColor: barColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 250
            },
            scales: {
                y: {
                    type: "linear",
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "% above threshold",
                        color: textColor
                    },
                    ticks: {
                        color: textColor,
                        callback: (value) => `${value}%`
                    },
                    grid: {
                        color: "rgba(128,128,128,0.2)"
                    }
                },
                x: {
                    type: "category",
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: "rgba(128,128,128,0.16)"
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const count = context.dataset.counts[context.dataIndex];
                            return `${context.parsed.y}% (${count.readingsAboveThreshold}/${count.totalReadings} readings)`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

const thresholdSlider = document.getElementById("threshold-slider");
if (thresholdSlider) {
    thresholdSlider.addEventListener("input", () => {
        updateThresholdLabel();
        if (latestDevices && latestNow) {
            makeThresholdChart(latestDevices, latestNow);
        }
    });
}

const thresholdWindow = document.getElementById("threshold-window");
if (thresholdWindow) {
    thresholdWindow.addEventListener("change", () => {
        if (latestDevices && latestNow) {
            makeThresholdChart(latestDevices, latestNow);
        }
    });
}


subscribeToDataUpdates((data) => {
    if (data) {
        const now = Math.round(Date.now()/1000);
        latestDevices = data.devices;
        latestNow = now;

        populateDeviceList(data.devices, now);
        populateReadingsList(data.devices, now);
        makeBarChart(data.devices, now);
        makeHourlyNoiseLineChart(data.devices, now);
        updateThresholdLabel();
        makeThresholdChart(data.devices, now);

        const dataDumpField = document.getElementById("dumpField");
        //if (dataDumpField)dataDumpField.textContent = JSON.stringify(data, null, 2);
        window.markDashboardReady?.();
    } else {
        console.log("No data to display");
        window.markDashboardReady?.();
    }
});
