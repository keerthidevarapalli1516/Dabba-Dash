const stages = [
    "Received",
    "In Kitchen",
    "Packed",
    "Out for Delivery",
    "Delivered"
];

const initialOrders = [
    [101, "Biryani Box", "Chicken Biryani", "Sector A", 12, 0],
    [102, "Burger Den", "Burger, Fries", "Sector B", 8, 1],
    [103, "Chai Point", "Tea, Samosa", "Sector A", 5, 0],
    [104, "Burger Den", "2 Burgers, Fries", "Sector B", 15, 1],
    [105, "Biryani Box", "Veg Biryani", "Sector C", 25, 1],
    [106, "Chai Point", "Coffee, Sandwich", "Sector D", 10, 2],
    [107, "Biryani Box", "Chicken Biryani", "Sector A", 7, 2],
    [108, "Burger Den", "Cheese Burger", "Sector C", 12, 3],
    [109, "Chai Point", "Tea, Biscuits", "Sector D", 5, 0],
    [110, "Biryani Box", "Special Biryani", "Sector B", 20, 1],
    [111, "Burger Den", "Veg Burger", "Sector A", 8, 2],
    [112, "Chai Point", "Tea, Samosa", "Sector C", 12, 3],
    [113, "Biryani Box", "Mutton Biryani", "Sector D", 15, 1],
    [114, "Burger Den", "Burger, Fries", "Sector B", 10, 2],
    [115, "Chai Point", "Coffee", "Sector A", 6, 4]
];

const riders = [
    { name: "Ramesh", zone: "Sector A", available: true },
    { name: "Suresh", zone: "Sector B", available: true },
    { name: "Rahul", zone: "Sector C", available: true },
    { name: "Kiran", zone: "Sector D", available: true },
    { name: "Arjun", zone: "Sector A", available: true },
    { name: "Vijay", zone: "Sector B", available: true }
];

let orders = JSON.parse(localStorage.getItem("dabbaOrders"));

if (!Array.isArray(orders)) {
    orders = initialOrders.map(item => ({
        id: item[0],
        brand: item[1],
        items: item[2],
        zone: item[3],
        prepMinutes: item[4],
        stage: item[5],
        rider: "",
        createdAt: Date.now() - item[4] * 60000
    }));
}

let deliveryRiders = JSON.parse(localStorage.getItem("dabbaRiders"));

if (!Array.isArray(deliveryRiders)) {
    deliveryRiders = riders;
}

function saveData() {
    localStorage.setItem("dabbaOrders", JSON.stringify(orders));
    localStorage.setItem("dabbaRiders", JSON.stringify(deliveryRiders));
}

function getNextId() {
    return Math.max(100, ...orders.map(o => o.id)) + 1;
}

// UPDATE DASHBOARD
function renderDashboard() {
    const active = orders.filter(o => o.stage < 4);
    const dispatched = orders.filter(o => o.stage === 3);

    document.getElementById("activeCount").textContent = active.length;

    const totalPrep = orders.length ?
        orders.reduce((sum, o) => sum + o.prepMinutes, 0) / orders.length :
        0;

    document.getElementById("avgPrep").textContent =
        Math.round(totalPrep) + " min";

    document.getElementById("dispatchCount").textContent =
        dispatched.length;

    document.getElementById("riderCount").textContent =
        deliveryRiders.filter(r => r.available).length;

    renderOrders();
    renderRiders();
    renderZones();
    renderAlerts();
    renderTrackingOptions();
}

// ORDER BOARD
function renderOrders() {
    const board = document.getElementById("orderBoard");
    const filter = document.getElementById("brandFilter").value;

    board.innerHTML = "";

    stages.forEach((stageName, index) => {

        const column = document.createElement("div");
        column.className = "kanban-column";

        const heading = document.createElement("h3");

        const stageOrders = orders.filter(o =>
            o.stage === index &&
            (filter === "All" || o.brand === filter)
        );

        heading.textContent = `${stageName} (${stageOrders.length})`;
        column.appendChild(heading);

        stageOrders.forEach(order => {

            const card = document.createElement("div");
            card.className = "order-card";

            const riderOptions = deliveryRiders.map(rider => `
                <option value="${rider.name}"
                    ${order.rider === rider.name ? "selected" : ""}
                    ${!rider.available && order.rider !== rider.name ? "disabled" : ""}>
                    ${rider.name} - ${rider.zone}
                    ${rider.available ? "(Available)" : "(Busy)"}
                </option>
            `).join("");

            let html = `
                <span class="brand">${order.brand}</span>
                <h4>Order #${order.id}</h4>
                <p>🍽 ${order.items}</p>
                <p>📍 ${order.zone}</p>
                <p>⏱ ${order.prepMinutes} minutes</p>
                <p>Status: ${stages[order.stage]}</p>
            `;

            if (order.rider) {
                html += `<p>🚴 Rider: ${order.rider}</p>`;
            }

            if (order.stage >= 2 && order.stage < 4) {
                html += `
                    <select onchange="assignRider(${order.id}, this.value)">
                        <option value="">Assign Rider</option>
                        ${riderOptions}
                    </select>
                `;
            }

            if (order.stage < 4) {
                html += `
                    <button onclick="advanceOrder(${order.id})">
                        ${[
                            "Start Preparing",
                            "Mark Packed",
                            "Dispatch Order",
                            "Mark Delivered"
                        ][order.stage]}
                    </button>
                `;
            }

            card.innerHTML = html;
            column.appendChild(card);
        });

        board.appendChild(column);
    });
}

// CHANGE ORDER STATUS
function advanceOrder(id) {
    const order = orders.find(o => o.id === id);

    if (!order || order.stage >= 4) return;

    if (order.stage === 2 && !order.rider) {
        const recommended = deliveryRiders.find(r =>
            r.available && r.zone === order.zone
        );

        if (recommended) {
            const confirmAssign = confirm(
                `Recommended rider: ${recommended.name}. Assign this rider?`
            );

            if (confirmAssign) {
                order.rider = recommended.name;
            } else {
                alert("Please assign a rider before dispatch.");
                renderDashboard();
                return;
            }
        } else {
            alert("No available rider. Please assign a rider first.");
            return;
        }
    }

    if (order.stage === 2) {
        const rider = deliveryRiders.find(r => r.name === order.rider);

        if (!rider || !rider.available) {
            alert("Selected rider is not available.");
            return;
        }

        rider.available = false;
    }

    if (order.stage === 3 && order.rider) {
        const rider = deliveryRiders.find(r => r.name === order.rider);
        if (rider) rider.available = true;
    }

    order.stage++;

    if (order.stage === 1) {
        order.prepMinutes = 0;
    }

    saveData();
    renderDashboard();
}

// ASSIGN RIDER
function assignRider(id, riderName) {
    const order = orders.find(o => o.id === id);

    if (!order || order.stage < 2 || order.stage >= 4) return;

    const newRider = deliveryRiders.find(r => r.name === riderName);

    if (riderName && (!newRider || !newRider.available)) {
        alert("This rider is not available.");
        renderDashboard();
        return;
    }

    const oldRider = deliveryRiders.find(r =>
        r.name === order.rider
    );

    if (oldRider && order.stage === 3) {
        oldRider.available = true;
    }

    order.rider = riderName;

    if (newRider && order.stage === 3) {
        newRider.available = false;
    }

    saveData();
    renderDashboard();
}

// RIDER DISPLAY
function renderRiders() {
    const board = document.getElementById("riderBoard");

    board.innerHTML = "";

    deliveryRiders.forEach(rider => {

        const card = document.createElement("div");
        card.className = "rider-card";

        card.innerHTML = `
            <h3>🚴 ${rider.name}</h3>
            <p>📍 ${rider.zone}</p>
            <p class="${rider.available ? "available" : "busy"}">
                ${rider.available ? "● Available" : "● Busy"}
            </p>
        `;

        board.appendChild(card);
    });
}

// DELIVERY ZONE BATCHING
function renderZones() {
    const board = document.getElementById("zoneBoard");
    board.innerHTML = "";

    const zones = ["Sector A", "Sector B", "Sector C", "Sector D"];

    zones.forEach(zone => {

        const zoneOrders = orders.filter(o =>
            o.zone === zone && o.stage < 4
        );

        const card = document.createElement("div");
        card.className = "zone-card";

        card.innerHTML = `
            <h3>📍 ${zone}</h3>
            <p>Active Orders: ${zoneOrders.length}</p>
            <p>${zoneOrders.map(o => "#" + o.id).join(", ") || "No active orders"}</p>
            <p>Delivery Radius: 2 KM cluster</p>
        `;

        board.appendChild(card);
    });
}

// KITCHEN DELAY ALERT
function renderAlerts() {
    const alerts = document.getElementById("alerts");

    const delayedOrders = orders.filter(order =>
        order.stage === 1 &&
        (Date.now() - order.createdAt) / 60000 > 20
    );

    if (delayedOrders.length === 0) {
        alerts.innerHTML =
            '<p class="no-alert">✓ No delayed orders right now.</p>';
        return;
    }

    alerts.innerHTML = delayedOrders.map(order => `
        <div class="alert-item">
            ⚠ Order #${order.id} - ${order.brand}
            has been in the kitchen for more than 20 minutes!
        </div>
    `).join("");
}

// CUSTOMER TRACKING OPTIONS
function renderTrackingOptions() {
    const select = document.getElementById("trackingSelect");
    const previous = select.value;

    select.innerHTML = orders.map(order => `
        <option value="${order.id}">
            Order #${order.id} - ${order.brand}
        </option>
    `).join("");

    if (orders.some(o => String(o.id) === previous)) {
        select.value = previous;
    }

    renderTracking();
}

// CUSTOMER LIVE TRACKING
function renderTracking() {
    const id = Number(document.getElementById("trackingSelect").value);

    const order = orders.find(o => o.id === id);

    if (!order) return;

    const messages = [
        "Your order has been received!",
        "Your delicious food is being prepared.",
        "Your food is packed and ready.",
        order.rider ?
        `${order.rider} is picking up your food!` :
        "Your order is out for delivery!",
        "Your order has been delivered. Enjoy your meal!"
    ];

    document.getElementById("customerOrder").textContent =
        `Order #${order.id}`;

    document.getElementById("customerBrand").textContent =
        order.brand + " - " + order.items;

    document.getElementById("customerStatus").textContent =
        stages[order.stage];

    document.getElementById("customerMessage").textContent =
        messages[order.stage];

    const eta = [20, 15, 10, 5, 0];

    document.getElementById("eta").textContent =
        order.stage === 4 ?
        "Delivered successfully!" :
        `Estimated time: ${eta[order.stage]} minutes`;

    const vehicle = document.getElementById("vehicle");

    vehicle.textContent = order.stage === 4 ? "🏁" : "🛵";

    const stepper = document.getElementById("stepper");

    stepper.innerHTML = stages.map((stage, index) => `
        <div class="step ${
            index < order.stage ? "completed" :
            index === order.stage ? "current" : ""
        }">
            ${index <= order.stage ? "✓" : "○"}<br>
            ${stage}
        </div>
    `).join("");
}

// ADD NEW ORDER
function addOrder() {
    const brand = prompt(
        "Enter Brand: Biryani Box, Burger Den or Chai Point"
    );

    if (!brand) return;

    const validBrands = [
        "Biryani Box",
        "Burger Den",
        "Chai Point"
    ];

    if (!validBrands.includes(brand)) {
        alert("Please enter a valid brand name.");
        return;
    }

    const items = prompt("Enter food items:");

    if (!items) return;

    const zone = prompt(
        "Enter delivery zone: Sector A, Sector B, Sector C or Sector D"
    );

    if (!["Sector A", "Sector B", "Sector C", "Sector D"].includes(zone)) {
        alert("Please enter a valid sector.");
        return;
    }

    orders.push({
        id: getNextId(),
        brand: brand,
        items: items,
        zone: zone,
        prepMinutes: 0,
        stage: 0,
        rider: "",
        createdAt: Date.now()
    });

    saveData();
    renderDashboard();

    alert("New order added successfully!");
}

// RIDER PAYOUT CALCULATOR
function calculatePay() {
    const distance = Number(document.getElementById("distance").value);
    const surge = Number(document.getElementById("surge").value);

    if (!Number.isFinite(distance) || !Number.isFinite(surge) ||
        distance < 0 || surge < 0) {
        alert("Enter valid non-negative numbers.");
        return;
    }

    const basePay = 20;
    const perKm = 8;

    const total = basePay + (distance * perKm) + surge;

    document.getElementById("payout").textContent =
        "Total Payout: ₹" + total.toFixed(2);
}

// REFRESH ALERTS AND DASHBOARD
setInterval(() => {
    renderAlerts();
}, 10000);

// INITIALIZE APPLICATION
renderDashboard();