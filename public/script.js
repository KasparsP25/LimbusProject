// LOAD BARS
fetch("Bars.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("Bars").innerHTML = data;

        // INVENTORY ELEMENTS
        const inventory = document.querySelector(".inventory");
        const inventoryPopup = document.getElementById("inventoryPopup");
        const closeInventory = document.getElementById("closeInventory");

        // OPEN INVENTORY
        if (inventory && inventoryPopup) {
            inventory.addEventListener("click", () => {
                inventoryPopup.style.display = "flex";
            });
        }

        // CLOSE INVENTORY BUTTON
        if (closeInventory && inventoryPopup) {
            closeInventory.addEventListener("click", () => {
                inventoryPopup.style.display = "none";
            });
        }
    })
    .catch(error => {
        console.error("Error loading Bars.html:", error);
    });


// CLOSE INVENTORY WITH ESCAPE
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        const inventoryPopup = document.getElementById("inventoryPopup");

        if (inventoryPopup) {
            inventoryPopup.style.display = "none";
        }
    }
});