const newsList = document.getElementById("news-list");
const searchInput = document.getElementById("news-search");
const searchMessage = document.getElementById("search-message");

let allNewsPosts = [];

// Display the posts that match the search
function displayNews(posts) {
    newsList.replaceChildren();

    for (const post of posts) {
        const article = document.createElement("article");

        // Category
        const category = document.createElement("p");
        category.textContent = post.category || "";
        category.className = "news-category";

        // Title
        const title = document.createElement("h2");
        title.textContent = post.title || "";

        // Description
        const description = document.createElement("p");
        description.textContent = post.description || "";

        article.append(category, title, description);

        // Image
        if (post.image) {
            const image = document.createElement("img");
            image.src = post.image;
            image.alt = post.title || "News image";
            image.loading = "lazy";
            image.className = "news-image";
            article.appendChild(image);
        }

        // Full content
        const content = document.createElement("div");
        content.textContent = post.content || "";
        content.className = "news-content";

        // Date
        const date = document.createElement("small");
        date.textContent = post.date
            ? new Date(post.date + "T12:00:00").toLocaleDateString()
            : "";

        article.append(content, date);
        newsList.appendChild(article);
    }
}

// Search by title, category, description, content, or date
function searchNews() {
    const query = searchInput.value.trim().toLowerCase();

    const matchingPosts = allNewsPosts.filter(post => {
        const searchableText = [
            post.title,
            post.category,
            post.description,
            post.content,
            post.date
        ].join(" ").toLowerCase();

        return searchableText.includes(query);
    });

    displayNews(matchingPosts);

    searchMessage.textContent =
        query && matchingPosts.length === 0 ? "No results found." : "";
}

// Load news once, then search the saved results as the user types
async function loadNews() {
    newsList.textContent = "Loading news...";

    try {
        const response = await fetch("/api/news");

        if (!response.ok) {
            throw new Error("Could not load news");
        }

        allNewsPosts = await response.json();

        if (allNewsPosts.length === 0) {
            newsList.textContent = "No news as of now.";
            return;
        }

        displayNews(allNewsPosts);
    } catch (error) {
        console.error("Error loading news:", error);
        newsList.textContent = "Failed to load news.";
    }
}

searchInput.addEventListener("input", searchNews);

loadNews();
