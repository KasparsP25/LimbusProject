
// ========================================
// EDITOR SETUP
// ========================================

const match = window.location.pathname.match(
    /^\/([a-zA-Z0-9_-]+)\.html\/(edit|add)$/
);

if (!match) {
    throw new Error("Invalid editor URL");
}

const page = match[1];
const mode = match[2];
const postId = new URLSearchParams(window.location.search).get("id");

const isNewsPage = page.toLowerCase() === "news";

const pageEditor = document.getElementById("page-editor");
const newsMenu = document.getElementById("news-menu");
const postList = document.getElementById("post-list");
const deleteConfirmation = document.getElementById("delete-confirmation");
const newsFormSection = document.getElementById("news-form-section");

const editForm = document.getElementById("edit-form");
const status = document.getElementById("status");

const newsForm = document.getElementById("news-form");
const newsFormFields = document.getElementById("news-form-fields");
const newsStatus = document.getElementById("news-status");

const postsContainer = document.getElementById("posts-container");

const newsFields = [
    "category",
    "title",
    "description",
    "content",
    "image",
    "date"
];

let pageFields = [];
let selectedPost = null;
let listMode = "";

// ========================================
// GENERAL HELPERS
// ========================================

function showSection(section) {
    const sections = [
        pageEditor,
        newsMenu,
        postList,
        deleteConfirmation,
        newsFormSection
    ];

    for (const item of sections) {
        item.hidden = item !== section;
    }
}

function todayLocal() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ========================================
// REGULAR PAGE EDITOR
// ========================================

function buildPageForm(content) {
    editForm.replaceChildren();

    for (const field of pageFields) {
        const label = document.createElement("label");
        label.htmlFor = field;
        label.textContent =
            field === "paragraph" ? "Page paragraph" :
            field.charAt(0).toUpperCase() + field.slice(1);

        const input = document.createElement(
            ["paragraph", "text1", "text2", "text3"].includes(field)
                ? "textarea"
                : "input"
        );

        input.id = field;
        input.name = field;
        input.required = true;
        input.value = content[field] ?? "";

        editForm.append(
            label,
            document.createElement("br"),
            input,
            document.createElement("br"),
            document.createElement("br")
        );
    }

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save changes";

    editForm.appendChild(saveButton);
}

async function loadPageEditor() {
    showSection(pageEditor);
    status.textContent = "Loading...";

    try {
        const response = await fetch(
            `/api/content/${encodeURIComponent(page)}`
        );

        if (!response.ok) {
            throw new Error("Could not load page content");
        }

        const content = await response.json();

        if (
            "text1" in content ||
            "text2" in content ||
            "text3" in content ||
            page.toLowerCase() === "index"
        ) {
            pageFields = ["text1", "text2", "text3"];
        } else {
            pageFields = ["title", "paragraph"];
        }

        buildPageForm(content);
        status.textContent = `Editing: ${page}.html`;
    } catch (error) {
        console.error(error);
        status.textContent = error.message;
    }
}

editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Saving...";

    try {
        const content = {};

        for (const field of pageFields) {
            content[field] = document.getElementById(field).value;
        }

        const response = await fetch(
            `/api/content/${encodeURIComponent(page)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(content)
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || "Could not save changes");
        }

        status.textContent = "Changes saved successfully!";
    } catch (error) {
        console.error(error);
        status.textContent = error.message;
    }
});

// ========================================
// NEWS MANAGEMENT MENU
// ========================================

function showNewsMenu() {
    showSection(newsMenu);
}

document.getElementById("add-post").addEventListener("click", () => {
    window.location.href = "/News.html/add";
});

document.getElementById("edit-post").addEventListener("click", () => {
    loadPostList("edit");
});

document.getElementById("delete-post").addEventListener("click", () => {
    loadPostList("delete");
});

// ========================================
// LOAD AND DISPLAY POSTS
// ========================================

async function loadPostList(action) {
    listMode = action;

    showSection(postList);

    document.getElementById("list-heading").textContent =
        action === "edit" ? "Choose a post to edit" : "Choose a post to delete";

    postsContainer.textContent = "Loading posts...";

    try {
        const response = await fetch("/api/news");

        if (!response.ok) {
            throw new Error("Could not load news posts");
        }

        const posts = await response.json();

        postsContainer.replaceChildren();

        if (posts.length === 0) {
            postsContainer.textContent = "There are no news posts yet.";
            return;
        }

        for (const post of posts) {
            const button = document.createElement("button");
            button.type = "button";

            const title = document.createElement("strong");
            title.textContent = post.title;

            const date = document.createElement("small");
            date.textContent = ` — ${post.date || "No date"}`;

            button.append(title, date);
            button.style.display = "block";
            button.style.width = "100%";
            button.style.marginBottom = "10px";
            button.style.padding = "12px";

            button.addEventListener("click", () => {
                if (listMode === "edit") {
                    window.location.href =
                        `/News.html/edit?id=${encodeURIComponent(post.id)}`;
                } else {
                    showDeleteConfirmation(post);
                }
            });

            postsContainer.appendChild(button);
        }
    } catch (error) {
        console.error(error);
        postsContainer.textContent = error.message;
    }
}

document.getElementById("back-to-menu").addEventListener("click", () => {
    showNewsMenu();
});

// ========================================
// ADD / EDIT NEWS FORM
// ========================================

function buildNewsForm(post = {}) {
    newsFormFields.replaceChildren();

    for (const field of newsFields) {
        const label = document.createElement("label");
        label.htmlFor = field;

        label.textContent =
            field === "image" ? "Image (optional)" :
            field === "date" ? "Date (optional)" :
            field.charAt(0).toUpperCase() + field.slice(1);

        let input;

        if (field === "image") {
            input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
        } else if (["description", "content"].includes(field)) {
            input = document.createElement("textarea");
        } else {
            input = document.createElement("input");
            input.type = field === "date" ? "date" : "text";
        }

        input.id = field;
        input.name = field;
        input.required = !["image", "date"].includes(field);

        if (field !== "image") {
            input.value = post[field] ?? "";
        }

        if (field === "date" && !post.date) {
            input.value = todayLocal();
        }

        newsFormFields.append(
            label,
            document.createElement("br"),
            input,
            document.createElement("br"),
            document.createElement("br")
        );

        // Preview the existing image when editing
        if (field === "image" && post.image) {
            const preview = document.createElement("img");

            preview.src = post.image;
            preview.alt = "Current post image";
            preview.style.maxWidth = "200px";
            preview.style.maxHeight = "150px";
            preview.style.objectFit = "contain";
            preview.style.display = "block";
            preview.style.marginBottom = "15px";

            newsFormFields.appendChild(preview);
        }
    }
}

async function openNewsForm(id = null) {
    showSection(newsFormSection);

    newsForm.reset();
    newsStatus.textContent = "";

    if (!id) {
        document.getElementById("news-form-heading").textContent =
            "Add a post";

        buildNewsForm({});
        return;
    }

    document.getElementById("news-form-heading").textContent =
        "Edit a post";

    newsStatus.textContent = "Loading post...";

    try {
        const response = await fetch(
            `/api/news/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
            throw new Error("Could not load news post");
        }

        const post = await response.json();

        buildNewsForm(post);
        newsStatus.textContent = "";
    } catch (error) {
        console.error(error);
        newsStatus.textContent = error.message;
    }
}

// ========================================
// SAVE NEWS POST
// ========================================

newsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    newsStatus.textContent = "Saving...";

    try {
        const formData = new FormData();

        for (const field of newsFields) {
            const input = document.getElementById(field);

            if (field === "image") {
                if (input.files.length > 0) {
                    formData.append("image", input.files[0]);
                }
            } else {
                formData.append(field, input.value);
            }
        }

        const editingId = postId && mode === "edit" ? postId : null;

        const response = await fetch(
            editingId
                ? `/api/news/${encodeURIComponent(editingId)}`
                : "/api/news",
            {
                method: editingId ? "PUT" : "POST",
                body: formData
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || "Could not save post");
        }

        alert(editingId
            ? "Post updated successfully!"
            : "Post created successfully!");

        window.location.href = "/News.html/edit";
    } catch (error) {
        console.error(error);
        newsStatus.textContent = error.message;
    }
});

document.getElementById("cancel-news-form").addEventListener("click", () => {
    window.location.href = "/News.html/edit";
});

// ========================================
// DELETE CONFIRMATION
// ========================================

function showDeleteConfirmation(post) {
    selectedPost = post;

    document.getElementById("delete-message").textContent =
        `Would you like to delete "${post.title}"?`;

    document.getElementById("delete-status").textContent = "";

    showSection(deleteConfirmation);
}

document.getElementById("confirm-delete").addEventListener("click", async () => {
    if (!selectedPost) return;

    const deleteStatus = document.getElementById("delete-status");
    deleteStatus.textContent = "Deleting...";

    try {
        const response = await fetch(
            `/api/news/${encodeURIComponent(selectedPost.id)}`,
            { method: "DELETE" }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || "Could not delete post");
        }

        selectedPost = null;
        alert("Post deleted successfully!");
        showNewsMenu();
    } catch (error) {
        console.error(error);
        deleteStatus.textContent = error.message;
    }
});

document.getElementById("cancel-delete").addEventListener("click", () => {
    selectedPost = null;
    loadPostList("delete");
});

// ========================================
// STARTUP: CHOOSE THE CORRECT INTERFACE
// ========================================

async function startEditor() {
    if (!isNewsPage) {
        await loadPageEditor();
        return;
    }

    // /News.html/add
    if (mode === "add") {
        await openNewsForm();
        return;
    }

    // /News.html/edit?id=POST_ID
    if (mode === "edit" && postId) {
        await openNewsForm(postId);
        return;
    }

    // /News.html/edit
    showNewsMenu();
}

startEditor();
