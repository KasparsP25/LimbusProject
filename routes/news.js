
const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const router = express.Router();

const newsPath = path.join(__dirname, "../data/news.json");
const uploadDir = path.join(__dirname, "../public/uploads");

// Configure image uploads
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => callback(null, uploadDir))
            .catch(callback);
    },
    filename: (req, file, callback) => {
        const extensions = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif"
        };

        callback(null, randomUUID() + extensions[file.mimetype]);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (allowed.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error("Please choose a JPG, PNG, WEBP, or GIF image."));
        }
    }
});

// Get today's date in the server's local timezone
function today() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Read saved posts
async function readNews() {
    try {
        const data = await fs.readFile(newsPath, "utf8");
        const news = JSON.parse(data);

        if (!Array.isArray(news)) {
            throw new Error("news.json must contain an array");
        }

        return news;
    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.mkdir(path.dirname(newsPath), { recursive: true });
            await fs.writeFile(newsPath, "[]", "utf8");
            return [];
        }

        throw error;
    }
}

// Save posts
async function writeNews(news) {
    await fs.mkdir(path.dirname(newsPath), { recursive: true });
    await fs.writeFile(newsPath, JSON.stringify(news, null, 2), "utf8");
}

// Delete an image saved in the uploads folder
async function removeUploadedImage(image) {
    if (!image || !image.startsWith("/uploads/")) return;

    const imagePath = path.join(uploadDir, path.basename(image));

    await fs.unlink(imagePath).catch(error => {
        if (error.code !== "ENOENT") throw error;
    });
}

// Validate the four required text fields and optional date
function validNews(data) {
    return (
        data &&
        typeof data.category === "string" &&
        data.category.trim().length > 0 &&
        data.category.length <= 100 &&
        typeof data.title === "string" &&
        data.title.trim().length > 0 &&
        data.title.length <= 200 &&
        typeof data.description === "string" &&
        data.description.trim().length > 0 &&
        data.description.length <= 5000 &&
        typeof data.content === "string" &&
        data.content.trim().length > 0 &&
        data.content.length <= 20000 &&
        (
            data.date === undefined ||
            data.date === "" ||
            (
                typeof data.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(data.date) &&
                !Number.isNaN(Date.parse(data.date))
            )
        )
    );
}

// GET: All posts
router.get("/", async (req, res) => {
    try {
        res.json(await readNews());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not load news" });
    }
});

// GET: One post
router.get("/:id", async (req, res) => {
    try {
        const news = await readNews();
        const post = news.find(item => item.id === req.params.id);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not load news post" });
    }
});

// POST: Create a post
router.post("/", upload.single("image"), async (req, res) => {
    try {
        if (!validNews(req.body)) {
            return res.status(400).json({
                error: "Please check the required fields."
            });
        }

        const news = await readNews();

        const post = {
            id: randomUUID(),
            category: req.body.category.trim(),
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            content: req.body.content.trim(),
            image: req.file ? "/uploads/" + req.file.filename : "",
            date: req.body.date || today(),
            createdAt: new Date().toISOString()
        };

        news.unshift(post);
        await writeNews(news);

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not create news post" });
    }
});

// PUT: Update a post
router.put("/:id", upload.single("image"), async (req, res) => {
    try {
        if (!validNews(req.body)) {
            return res.status(400).json({
                error: "Please check the required fields."
            });
        }

        const news = await readNews();
        const index = news.findIndex(item => item.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: "Post not found" });
        }

        const oldImage = news[index].image;

        news[index] = {
            ...news[index],
            category: req.body.category.trim(),
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            content: req.body.content.trim(),
            image: req.file
                ? "/uploads/" + req.file.filename
                : (oldImage || ""),
            date: req.body.date || news[index].date || today()
        };

        await writeNews(news);

        if (req.file && oldImage) {
            await removeUploadedImage(oldImage).catch(console.error);
        }

        res.json(news[index]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not update news post" });
    }
});

// DELETE: Remove a post
router.delete("/:id", async (req, res) => {
    try {
        const news = await readNews();
        const index = news.findIndex(item => item.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: "Post not found" });
        }

        const [removed] = news.splice(index, 1);
        await writeNews(news);

        // Remove the image file when its post is deleted
        await removeUploadedImage(removed.image);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not delete news post" });
    }
});

module.exports = router;
