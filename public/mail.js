const mailButton = document.querySelector(".mail-button");
const mailPopup = document.getElementById("mailPopup");

mailButton.addEventListener("click", () => {
    mailPopup.style.display = "flex";
});

function closeMail() {
    mailPopup.style.display = "none";
}