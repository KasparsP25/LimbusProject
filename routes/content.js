
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const router = express.Router();

const publicPath = path.join(__dirname, "../public");
const contentPath = path.join(__dirname, "../data/content.json");

// Check that the requested HTML page exists
async function isValidPage(page) {
    if (
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

// Read saved content
async function readContent() {
    try {
        const data = await fs.readFile(contentPath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            return {};
        }
        throw error;
    }
}

// GET: Load content for a page
router.get("/:page", async (req, res) => {
    try {
        const { page } = req.params;

        if (!(await isValidPage(page))) {
            return res.status(404).json({ error: "Page not found" });
        }

        const content = await readContent();

        res.json(content[page] || (
            page === "index"
                ? { text1: "", text2: "", text3: "" }
                : { title: "", paragraph: "" }
        ));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not load content" });
    }
});

// PUT: Save content for a page
router.put("/:page", async (req, res) => {
    try {
        const { page } = req.params;
        const data = req.body;

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return res.status(400).json({ error: "Invalid content format" });
        }

        if (!(await isValidPage(page))) {
            return res.status(404).json({ error: "Page not found" });
        }

        let pageContent;

        if (
            typeof data.text1 === "string" &&
            typeof data.text2 === "string" &&
            typeof data.text3 === "string"
        ) {
            if (
                data.text1.length > 1000 ||
                data.text2.length > 1000 ||
                data.text3.length > 1000
            ) {
                return res.status(400).json({ error: "Text is too long" });
            }

            pageContent = {
                text1: data.text1,
                text2: data.text2,
                text3: data.text3
            };
        } else if (
            typeof data.title === "string" &&
            typeof data.paragraph === "string"
        ) {
            if (
                data.title.length > 200 ||
                data.paragraph.length > 10000
            ) {
                return res.status(400).json({ error: "Text is too long" });
            }

            pageContent = {
                title: data.title,
                paragraph: data.paragraph
            };
        } else {
            return res.status(400).json({
                error: "Invalid content format"
            });
        }

        const content = await readContent();
        content[page] = pageContent;

        await fs.mkdir(path.dirname(contentPath), { recursive: true });
        await fs.writeFile(
            contentPath,
            JSON.stringify(content, null, 2),
            "utf8"
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not save content" });
    }
});

module.exports = router;
