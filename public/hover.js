
let tooltip;

function createTooltip() {
    if (tooltip) return;

    tooltip = document.createElement("div");
    tooltip.className = "hud-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);
}

function showTooltip(element) {
    createTooltip();
    tooltip.textContent = element.dataset.tooltip;
    tooltip.style.display = "block";
}

function hideTooltip() {
    if (tooltip) {
        tooltip.style.display = "none";
    }
}

document.addEventListener("mouseover", event => {
    const element = event.target.closest("[data-tooltip]");

    if (!element || element.contains(event.relatedTarget)) return;

    showTooltip(element);
});

document.addEventListener("mouseout", event => {
    const element = event.target.closest("[data-tooltip]");

    if (!element || element.contains(event.relatedTarget)) return;

    hideTooltip();
});
