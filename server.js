
const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const app = express();
const PORT = 3000;
const publicPath = path.join(__dirname, "public");

app.use(express.json({ limit: "50kb" }));

// Connect the API route files
app.use("/api/content", require("./routes/content"));
app.use("/api/news", require("./routes/news"));
app.use("/api/games", require("./routes/games")); // NEW

// Check that a page exists in public/
async function isValidPage(page) {
    if (
        typeof page !== "string" ||
        !/^[a-zA-Z0-9_-]+$/.test(page) ||
        ["edit", "404"].includes(page)
    ) {
        return false;
    }

    try {
        const filePath = path.join(publicPath, `${page}.html`);
        const stats = await fs.stat(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
}

// Open the editor for a valid page
async function serveEditorPage(req, res) {
    if (!(await isValidPage(req.params.page))) {
        return res.status(404).sendFile(
            path.join(publicPath, "404.html")
        );
    }

    res.sendFile(path.join(publicPath, "edit.html"));
}

app.get("/:page.html/edit", serveEditorPage);
app.get("/:page.html/add", serveEditorPage);

// Serve website files
app.use(express.static(publicPath));

// Handle unknown URLs
app.use((req, res) => {
    res.status(404).sendFile(path.join(publicPath, "404.html"));
});

app.listen(PORT, () => {
    console.log(`Website running at http://localhost:${PORT}`);
});
