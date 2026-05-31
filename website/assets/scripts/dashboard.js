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

function getStatusColor(deviceStatus) {
    if (deviceStatus === "Online") {
        return "LimeGreen";
    } else if (!deviceStatus.includes("ago")) {
        return "Silver";
    } else {
        return "Red";
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

        console.log(deviceName, deviceLastOnline, now);

        const deviceElement = document.createElement("li");
        deviceElement.innerHTML = `
        <span style = "color: ${getStatusColor(deviceStatus)};">&#9673;</span>
        ${deviceName}
        <span style = "font-size: 0.7rem; opacity: 60%;">${deviceStatus}</span>
        <br>
        <span class = "advanced hidden" style = "font-size: 0.5rem; opacity: 60%">ID: ${deviceId}</span>
        `;
        deviceListElement.appendChild(deviceElement);
    });
}

subscribeToDataUpdates((data) => {
    if (data) {
        const now = Math.round(Date.now()/1000);
        console.log(now);
        populateDeviceList(data.devices, now);

        const dataDumpField = document.getElementById("dumpField");
        //if (dataDumpField)dataDumpField.textContent = JSON.stringify(data, null, 2);
        window.markDashboardReady?.();
    } else {
        console.log("No data to display");
        alert("No data to display.");
        window.markDashboardReady?.();
    }
});