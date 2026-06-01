//import Chart from "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.min.js"
import { subscribeToDataUpdates } from "./firebase_rtdb.js";


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
    } else if (timeDiff < 2592000) {
        return `Last online: ${Math.floor(timeDiff/86400)}d ago`;
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

        //console.log(deviceName, deviceLastOnline, now);

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

subscribeToDataUpdates((data) => {
    if (data) {
        const now = Math.round(Date.now()/1000);
        populateDeviceList(data.devices, now);
        populateReadingsList(data.devices, now);

        const dataDumpField = document.getElementById("dumpField");
        //if (dataDumpField)dataDumpField.textContent = JSON.stringify(data, null, 2);
        window.markDashboardReady?.();
    } else {
        console.log("No data to display");
        window.markDashboardReady?.();
    }
});