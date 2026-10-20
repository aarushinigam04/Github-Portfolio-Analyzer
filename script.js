
const form = document.getElementById("analyze-form");
const usernameInput = document.getElementById("username");
const message = document.getElementById("message");
const analyzeButton = document.getElementById("analyze-button");
const results = document.getElementById("results");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = usernameInput.value.trim();

    const validUsername =
        /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username);

    if (!validUsername) {
        results.hidden = true;
        message.textContent = "Please enter a valid GitHub username.";
        return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";
    message.textContent = "Fetching public GitHub data...";
    results.hidden = true;

    try {
        // Request the profile and repositories at the same time.
        const [profileResponse, reposResponse] = await Promise.all([
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`)
        ]);

        if (profileResponse.status === 404) {
            throw new Error("GitHub username not found. Please check it.");
        }

        if (profileResponse.status === 403 ||
            reposResponse.status === 403) {
            throw new Error(
                "GitHub API rate limit or access restriction reached. Please try again later."
            );
        }

        if (!profileResponse.ok || !reposResponse.ok) {
            throw new Error("GitHub could not provide the data. Please try again.");
        }

        const profile = await profileResponse.json();
        const repos = await reposResponse.json();

        // Display profile information safely.
        document.getElementById("avatar").src = profile.avatar_url;
        document.getElementById("avatar").alt =
            `${profile.login}'s profile picture`;

        document.getElementById("profile-name").textContent =
            profile.name || profile.login;

        const profileLink = document.getElementById("profile-link");
        profileLink.href = profile.html_url;
        profileLink.textContent = `@${profile.login}`;

        document.getElementById("bio").textContent =
            profile.bio || "No public bio provided.";

        // Calculate simple portfolio statistics.
        const totalStars = repos.reduce(
            (sum, repo) => sum + repo.stargazers_count, 0
        );

        document.getElementById("repo-count").textContent =
            profile.public_repos;

        document.getElementById("followers").textContent =
            profile.followers;

        document.getElementById("following").textContent =
            profile.following;

        document.getElementById("stars").textContent = totalStars;

        // Display the five most-starred repositories in this result set.
        const repoList = document.getElementById("repo-list");
        repoList.replaceChildren();

        const topRepos = [...repos]
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 5);

        if (topRepos.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No public repositories found.";
            repoList.appendChild(emptyMessage);
        }

        topRepos.forEach(repo => {
            const card = document.createElement("article");
            card.className = "repo-card";

            const title = document.createElement("h3");
            const link = document.createElement("a");
            link.href = repo.html_url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = repo.name;
            title.appendChild(link);

            const description = document.createElement("p");
            description.textContent =
                repo.description || "No description provided.";

            const details = document.createElement("p");
            details.textContent =
                `Language: ${repo.language || "Not specified"} | ` +
                `Stars: ${repo.stargazers_count} | ` +
                `Forks: ${repo.forks_count}`;

            card.append(title, description, details);
            repoList.appendChild(card);
        });

        results.hidden = false;
        message.textContent = `Analysis data loaded for ${profile.login}.`;

    } catch (error) {
        message.textContent = error.message ||
            "Something went wrong. Please try again.";
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Profile";
    }
});

