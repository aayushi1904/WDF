const datasetFiles = {
    students: "practical6.json",
    events: "event.json",
    faqs: "faqs.json"
};
const itemsPerPage = 6;
let allData = [];
let filteredData = [];
let currentPage = 1;
let currentType = "students";
let dataLoaded = false;

const dataContainer = document.getElementById("dataContainer");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");
const statusMessage = document.getElementById("statusMessage");
const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const datasetButtons = document.querySelectorAll(".dataset-btn");

async function fetchData(type) {
    if (!Object.hasOwn(datasetFiles, type)) {
        showError(`Unknown dataset: ${type}.`);
        return;
    }

    currentType = type;
    currentPage = 1;
    dataLoaded = false;
    allData = [];
    filteredData = [];
    showLoading();
    updateSortOptions();
    updatePagination(0);

    try {
        const fileName = datasetFiles[type];
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(
                `${fileName} returned ${response.status} ${response.statusText}`.trim()
            );
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error(`${fileName} must contain a JSON array.`);
        }

        allData = data;
        dataLoaded = true;
        updateFilterOptions();
        updateSortOptions();
        applyFilters();
    } catch (error) {
        dataLoaded = false;
        allData = [];
        filteredData = [];
        updateFilterOptions();
        updateSortOptions();
        updatePagination(0);
        console.error(`Failed to load ${datasetFiles[type]}.`, error);
        showError(
            `Could not load ${datasetFiles[type]}. Check that the file exists and open this page using VS Code Live Server.`
        );
    }
}

function showLoading() {
    if (statusMessage) {
        statusMessage.replaceChildren();
        const spinner = document.createElement("div");
        spinner.className = "loading-spinner";
        spinner.setAttribute("aria-hidden", "true");

        const message = document.createElement("span");
        message.textContent = `Loading ${currentType} data...`;
        statusMessage.append(spinner, message);
        statusMessage.style.display = "flex";
    }
    dataContainer?.replaceChildren();
}

function showError(message) {
    if (statusMessage) {
        statusMessage.replaceChildren();
        const errorMessage = document.createElement("span");
        errorMessage.className = "error-box";
        errorMessage.textContent = message;
        statusMessage.appendChild(errorMessage);
        statusMessage.classList.add("error");
        statusMessage.style.display = "flex";
    }
    dataContainer?.replaceChildren();
    updatePagination(0);
}

function hideStatus() {
    if (statusMessage) {
        statusMessage.style.display = "none";
        statusMessage.classList.remove("error");
        statusMessage.replaceChildren();
    }
}

function updateFilterOptions() {
    if (!filterSelect) return;

    filterSelect.replaceChildren(new Option("All", "all"));
    const field = currentType === "students" ? "department" : "category";
    const values = [...new Set(allData.map(item => item[field]).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right));

    values.forEach(value => filterSelect.add(new Option(value, value)));
    filterSelect.value = "all";
}

function updateSortOptions() {
    if (!sortSelect) return;

    sortSelect.querySelectorAll("optgroup[data-sort-type]").forEach(group => {
        group.hidden = group.dataset.sortType !== currentType;
    });
    sortSelect.value = "default";
}

function applyFilters() {
    if (!dataLoaded) return;

    const searchText = searchInput?.value.trim().toLowerCase() || "";
    const selectedFilter = filterSelect?.value || "all";
    const selectedSort = sortSelect?.value || "default";
    const filterField = currentType === "students" ? "department" : "category";

    filteredData = allData.filter(item => {
        const matchesSearch = Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchText);
        const matchesFilter = selectedFilter === "all" ||
            item[filterField] === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const nameField = currentType === "students"
        ? "name"
        : currentType === "events" ? "title" : "question";
    const sortComparators = {
        nameAsc: (left, right) =>
            left[nameField].localeCompare(right[nameField]),
        nameDesc: (left, right) =>
            right[nameField].localeCompare(left[nameField]),
        marksHigh: (left, right) => right.marks - left.marks,
        marksLow: (left, right) => left.marks - right.marks,
        dateAsc: (left, right) => Date.parse(left.date) - Date.parse(right.date),
        dateDesc: (left, right) => Date.parse(right.date) - Date.parse(left.date),
        categoryAsc: (left, right) =>
            left.category.localeCompare(right.category)
    };
    if (sortComparators[selectedSort]) {
        filteredData.sort(sortComparators[selectedSort]);
    }

    currentPage = 1;
    renderData();
}

function renderData() {
    hideStatus();
    if (!dataContainer) return;

    if (filteredData.length === 0) {
        const noResults = document.createElement("div");
        noResults.className = "no-results";
        const heading = document.createElement("h2");
        heading.textContent = "No Results Found";
        const message = document.createElement("p");
        message.textContent = "Try another search or filter.";
        noResults.append(heading, message);
        dataContainer.replaceChildren(noResults);
        updatePagination(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    dataContainer.replaceChildren(...pageData.map(createCard));
    updatePagination(Math.ceil(filteredData.length / itemsPerPage));
}

function createCard(item) {
    const card = document.createElement("article");
    card.className = "data-card";

    const icon = document.createElement("div");
    icon.className = "card-icon";
    icon.textContent = currentType === "students"
        ? "🎓"
        : currentType === "events" ? "🎉" : "❓";
    card.appendChild(icon);

    if (currentType === "students") {
        addTextElement(card, "h3", item.name);
        addField(card, "ID:", item.id);
        addField(card, "Department:", item.department);
        addField(card, "Semester:", item.semester);
        addTextElement(card, "div", `Marks: ${item.marks}`, "marks");
    } else if (currentType === "events") {
        addTextElement(card, "h3", item.title);
        addField(card, "📅 Date:", item.date);
        addField(card, "📍 Venue:", item.venue);
        addTextElement(card, "span", item.category, "category");
        addTextElement(card, "p", item.description, "description");
    } else {
        addTextElement(card, "h3", item.question);
        addTextElement(card, "p", item.answer, "faq-answer");
        addTextElement(card, "span", item.category, "category");
    }
    return card;
}

function addField(card, label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = label;
    paragraph.append(strong, ` ${value}`);
    card.appendChild(paragraph);
}

function addTextElement(parent, tagName, text, className = "") {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
}

function updatePagination(totalPages) {
    if (!pageInfo || !previousBtn || !nextBtn) return;

    const pageCount = Math.max(totalPages, 1);
    pageInfo.textContent = `Page ${currentPage} of ${pageCount}`;
    previousBtn.disabled = currentPage <= 1 || totalPages === 0;
    nextBtn.disabled = currentPage >= pageCount || totalPages === 0;
}

previousBtn?.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderData();
    }
});

nextBtn?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderData();
    }
});

searchInput?.addEventListener("input", applyFilters);
filterSelect?.addEventListener("change", applyFilters);
sortSelect?.addEventListener("change", applyFilters);

datasetButtons.forEach(button => {
    button.addEventListener("click", () => {
        datasetButtons.forEach(datasetButton => {
            const isActive = datasetButton === button;
            datasetButton.classList.toggle("active", isActive);
            datasetButton.setAttribute("aria-pressed", String(isActive));
        });
        if (searchInput) searchInput.value = "";
        fetchData(button.dataset.type);
    });
});

fetchData("students");