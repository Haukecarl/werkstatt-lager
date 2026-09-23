const STORAGE_KEY =
    "werkstatt-lager-items-v1";

const DB_NAME =
    "WerkstattLagerDB";

const DB_VERSION =
    1;

const STORE_NAME =
    "items";


let db = null;

let items = [];

let currentFilter = "all";

let deleteItemId = null;

let scanner = null;

let scannerRunning = false;

let previousPage = "inventoryPage";

let currentPhoto = "";


// --------------------------------------------------
// ID
// --------------------------------------------------

function createId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {

        return window.crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );

}


// --------------------------------------------------
// BEISPIELDATEN
// --------------------------------------------------

function createExampleItems() {

    return [

        {
            id: createId(),
            name: "Sechskantschraube M6×30",
            category: "Schrauben",
            quantity: 84,
            minimum: 30,
            unit: "Stück",
            location: "R1-E3-B04",
            note: "Verzinkt",
            photo: ""
        },

        {
            id: createId(),
            name: "Schleifscheiben 125 mm",
            category: "Schleifmittel",
            quantity: 6,
            minimum: 10,
            unit: "Stück",
            location: "R1-E2-B02",
            note: "Körnung 80",
            photo: ""
        },

        {
            id: createId(),
            name: "Kabelbinder 200 mm",
            category: "Elektro",
            quantity: 18,
            minimum: 25,
            unit: "Stück",
            location: "R1-E4-B01",
            note: "Schwarz",
            photo: ""
        }

    ];

}


// --------------------------------------------------
// DATEN NORMALISIEREN
// --------------------------------------------------

function normalizeItem(item) {

    return {

        id:
            item.id ||
            createId(),

        name:
            item.name ||
            "Unbenannter Artikel",

        category:
            item.category ||
            "",

        quantity:
            Math.max(
                0,
                Number(
                    item.quantity
                ) || 0
            ),

        minimum:
            Math.max(
                0,
                Number(
                    item.minimum
                ) || 0
            ),

        unit:
            item.unit ||
            "Stück",

        location:
            item.location ||
            "",

        note:
            item.note ||
            "",

        photo:
            item.photo ||
            ""

    };

}


// --------------------------------------------------
// INDEXEDDB ÖFFNEN
// --------------------------------------------------

function openDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );


            request.onupgradeneeded =
                event => {

                    const database =
                        event.target.result;


                    if (
                        !database
                            .objectStoreNames
                            .contains(
                                STORE_NAME
                            )
                    ) {

                        const store =
                            database.createObjectStore(
                                STORE_NAME,
                                {
                                    keyPath: "id"
                                }
                            );


                        store.createIndex(
                            "name",
                            "name",
                            {
                                unique: false
                            }
                        );


                        store.createIndex(
                            "category",
                            "category",
                            {
                                unique: false
                            }
                        );


                        store.createIndex(
                            "location",
                            "location",
                            {
                                unique: false
                            }
                        );

                    }

                };


            request.onsuccess =
                event => {

                    db =
                        event.target.result;


                    db.onversionchange =
                        () => {

                            db.close();

                        };


                    resolve(
                        db
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// --------------------------------------------------
// ALLE ARTIKEL AUS INDEXEDDB LADEN
// --------------------------------------------------

function getAllItemsFromDatabase() {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.getAll();


            request.onsuccess =
                () => {

                    const result =
                        Array.isArray(
                            request.result
                        )
                            ? request.result
                            : [];


                    resolve(
                        result.map(
                            normalizeItem
                        )
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// --------------------------------------------------
// EINEN ARTIKEL SPEICHERN
// --------------------------------------------------

function putItemInDatabase(item) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            store.put(
                normalizeItem(
                    item
                )
            );


            transaction.oncomplete =
                () => {

                    resolve();

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// --------------------------------------------------
// ARTIKEL LÖSCHEN
// --------------------------------------------------

function deleteItemFromDatabase(id) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            store.delete(
                id
            );


            transaction.oncomplete =
                () => {

                    resolve();

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// --------------------------------------------------
// DATENBANK LEEREN
// --------------------------------------------------

function clearDatabase() {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            store.clear();


            transaction.oncomplete =
                () => {

                    resolve();

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// --------------------------------------------------
// MEHRERE ARTIKEL SPEICHERN
// --------------------------------------------------

function putManyItemsInDatabase(
    newItems
) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            newItems.forEach(
                item => {

                    store.put(
                        normalizeItem(
                            item
                        )
                    );

                }
            );


            transaction.oncomplete =
                () => {

                    resolve();

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// --------------------------------------------------
// ALTE LOCALSTORAGE DATEN ÜBERNEHMEN
// --------------------------------------------------

async function migrateOldLocalStorageData() {

    const existingDatabaseItems =
        await getAllItemsFromDatabase();


    if (
        existingDatabaseItems.length > 0
    ) {

        return existingDatabaseItems;

    }


    const oldData =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (oldData) {

        try {

            const parsed =
                JSON.parse(
                    oldData
                );


            if (
                Array.isArray(
                    parsed
                ) &&
                parsed.length > 0
            ) {

                const migrated =
                    parsed.map(
                        normalizeItem
                    );


                await putManyItemsInDatabase(
                    migrated
                );


                localStorage.setItem(
                    "werkstatt-lager-migrated",
                    "true"
                );


                return migrated;

            }

        }
        catch (error) {

            console.error(
                "Alte Daten konnten nicht übernommen werden:",
                error
            );

        }

    }


    const examples =
        createExampleItems();


    await putManyItemsInDatabase(
        examples
    );


    return examples;

}


// --------------------------------------------------
// DATEN NEU LADEN
// --------------------------------------------------

async function reloadItems() {

    items =
        await getAllItemsFromDatabase();


    renderEverything();

}


// --------------------------------------------------
// HTML SICHER
// --------------------------------------------------

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// --------------------------------------------------
// BESTAND
// --------------------------------------------------

function isLowStock(item) {

    return (
        Number(
            item.quantity
        ) <=
        Number(
            item.minimum
        )
    );

}


// --------------------------------------------------
// LAGERPLÄTZE
// --------------------------------------------------

function getLocations() {

    const locations =
        items
            .map(
                item =>
                    String(
                        item.location ||
                        ""
                    ).trim()
            )
            .filter(
                Boolean
            );


    return [
        ...new Set(
            locations
        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                "de",
                {
                    numeric: true
                }
            )
    );

}


// --------------------------------------------------
// KATEGORIEN
// --------------------------------------------------

function getCategories() {

    const defaults = [

        "Schrauben",
        "Muttern",
        "Unterlegscheiben",
        "Elektro",
        "Kabel",
        "Schleifmittel",
        "Bohrer",
        "Sägeblätter",
        "Ersatzteile",
        "Öle & Schmierstoffe",
        "Klebstoffe",
        "Holz",
        "Metall",
        "Werkzeug",
        "Verbrauchsmaterial"

    ];


    const existing =
        items
            .map(
                item =>
                    String(
                        item.category ||
                        ""
                    ).trim()
            )
            .filter(
                Boolean
            );


    return [
        ...new Set(
            [
                ...defaults,
                ...existing
            ]
        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                "de"
            )
    );

}


function renderCategorySuggestions() {

    const datalist =
        document.getElementById(
            "categorySuggestions"
        );


    datalist.innerHTML =
        getCategories()
            .map(
                category => `

                    <option
                        value="${escapeHtml(category)}"
                    ></option>

                `
            )
            .join("");

}


// --------------------------------------------------
// SEITEN
// --------------------------------------------------

function showPage(pageId) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            page => {

                page.classList.remove(
                    "active"
                );

            }
        );


    const page =
        document.getElementById(
            pageId
        );


    if (page) {

        page.classList.add(
            "active"
        );

    }


    const mainPages = [

        "homePage",
        "inventoryPage",
        "shoppingPage",
        "qrPage"

    ];


    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                const target =
                    button.dataset.pageTarget;


                button.classList.toggle(
                    "active",
                    target === pageId
                );

            }
        );


    if (
        !mainPages.includes(
            pageId
        )
    ) {

        document
            .querySelectorAll(
                ".nav-button"
            )
            .forEach(
                button => {

                    button.classList.remove(
                        "active"
                    );

                }
            );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// --------------------------------------------------
// STATISTIK
// --------------------------------------------------

function renderStats() {

    document.getElementById(
        "articleCount"
    ).textContent =
        items.length;


    document.getElementById(
        "lowStockCount"
    ).textContent =
        items.filter(
            isLowStock
        ).length;


    document.getElementById(
        "locationCount"
    ).textContent =
        getLocations().length;


    document.getElementById(
        "storageSummary"
    ).textContent =
        `${items.length} Artikel · ${getLocations().length} Lagerplätze · ${getCategories().length} Kategorien · IndexedDB aktiv`;

}


// --------------------------------------------------
// ARTIKELKARTE
// --------------------------------------------------

function createItemCard(item) {

    const low =
        isLowStock(
            item
        );


    const photo =
        item.photo
            ? `

                <img
                    class="item-image"
                    src="${item.photo}"
                    alt=""
                >

            `
            : "";


    return `

        <article
            class="item-card ${
                low
                    ? "low-stock"
                    : ""
            }"
            data-item-id="${escapeHtml(item.id)}"
        >

            ${photo}


            <div class="item-main">

                <div class="item-top">

                    <div>

                        <h3 class="item-name">
                            ${escapeHtml(item.name)}
                        </h3>

                        <p class="item-category">

                            ${
                                escapeHtml(
                                    item.category ||
                                    "Ohne Kategorie"
                                )
                            }

                        </p>

                    </div>


                    <span
                        class="stock-badge ${
                            low
                                ? "low"
                                : ""
                        }"
                    >

                        ${
                            low
                                ? "NACHKAUFEN"
                                : "BESTAND OK"
                        }

                    </span>

                </div>


                <div class="item-info">

                    <div class="info-box">

                        <span>
                            LAGERPLATZ
                        </span>

                        <strong>

                            ${
                                escapeHtml(
                                    item.location ||
                                    "Nicht festgelegt"
                                )
                            }

                        </strong>

                    </div>


                    <div class="info-box">

                        <span>
                            MINDESTBESTAND
                        </span>

                        <strong>

                            ${Number(item.minimum)}
                            ${escapeHtml(item.unit)}

                        </strong>

                    </div>

                </div>


                ${
                    item.note
                        ? `

                            <p class="item-note">
                                ${escapeHtml(item.note)}
                            </p>

                        `
                        : ""
                }

            </div>


            <div class="item-controls">

                <button
                    class="quantity-button"
                    data-change="-10"
                    type="button"
                >
                    −10
                </button>


                <button
                    class="quantity-button"
                    data-change="-1"
                    type="button"
                >
                    −1
                </button>


                <div class="quantity-display">

                    ${Number(item.quantity)}
                    ${escapeHtml(item.unit)}

                </div>


                <button
                    class="quantity-button"
                    data-change="1"
                    type="button"
                >
                    +1
                </button>


                <button
                    class="quantity-button"
                    data-change="10"
                    type="button"
                >
                    +10
                </button>

            </div>


            <div class="item-actions">

                <button
                    class="small-action"
                    data-details
                    type="button"
                >
                    Details
                </button>


                <button
                    class="small-action qr"
                    data-item-qr
                    type="button"
                >
                    QR-Code
                </button>


                <button
                    class="small-action"
                    data-edit
                    type="button"
                >
                    Bearbeiten
                </button>


                <button
                    class="small-action delete"
                    data-delete
                    type="button"
                >
                    Löschen
                </button>

            </div>

        </article>

    `;

}


// --------------------------------------------------
// INVENTAR
// --------------------------------------------------

function renderInventory() {

    const container =
        document.getElementById(
            "inventoryList"
        );


    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .trim()
            .toLowerCase();


    let result =
        [...items];


    if (
        currentFilter === "low"
    ) {

        result =
            result.filter(
                isLowStock
            );

    }


    if (search) {

        result =
            result.filter(
                item => {

                    const text = `

                        ${item.name}
                        ${item.category}
                        ${item.location}
                        ${item.note}

                    `.toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    result.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name,
                "de"
            )
    );


    if (
        result.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">
                    📦
                </div>

                <h3>
                    Nichts gefunden
                </h3>

                <p>
                    Lege einen Artikel an
                    oder ändere deine Suche.
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        result
            .map(
                createItemCard
            )
            .join("");

}


// --------------------------------------------------
// EINKAUF
// --------------------------------------------------

function renderShopping() {

    const container =
        document.getElementById(
            "shoppingList"
        );


    const result =
        items
            .filter(
                isLowStock
            )
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name,
                        "de"
                    )
            );


    if (
        result.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    Alles ausreichend vorhanden
                </h3>

                <p>
                    Aktuell muss nichts
                    nachgekauft werden.
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        result
            .map(
                createItemCard
            )
            .join("");

}


// --------------------------------------------------
// STARTSEITE
// --------------------------------------------------

function renderHome() {

    const container =
        document.getElementById(
            "homeLowStockList"
        );


    const result =
        items
            .filter(
                isLowStock
            )
            .slice(
                0,
                3
            );


    if (
        result.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    Bestände sehen gut aus
                </h3>

                <p>
                    Momentan muss nichts
                    nachgekauft werden.
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        result
            .map(
                item => `

                    <article
                        class="item-card low-stock"
                    >

                        <div class="item-main">

                            <div class="item-top">

                                <div>

                                    <h3 class="item-name">
                                        ${escapeHtml(item.name)}
                                    </h3>

                                    <p class="item-category">

                                        ${
                                            escapeHtml(
                                                item.location ||
                                                "Kein Lagerplatz"
                                            )
                                        }

                                    </p>

                                </div>


                                <span
                                    class="stock-badge low"
                                >

                                    ${Number(item.quantity)}
                                    ${escapeHtml(item.unit)}

                                </span>

                            </div>

                        </div>

                    </article>

                `
            )
            .join("");

}


// --------------------------------------------------
// LAGERPLÄTZE
// --------------------------------------------------

function createLocationListHtml() {

    const locations =
        getLocations();


    if (
        locations.length === 0
    ) {

        return `

            <div class="empty-card">

                <div class="empty-icon">
                    🗄️
                </div>

                <h3>
                    Noch keine Lagerplätze
                </h3>

                <p>
                    Sobald du einem Artikel einen
                    Lagerplatz gibst, erscheint er hier.
                </p>

            </div>

        `;

    }


    return locations
        .map(
            location => {

                const count =
                    items.filter(
                        item =>
                            item.location ===
                            location
                    ).length;


                return `

                    <button
                        class="location-card"
                        data-location="${escapeHtml(location)}"
                        type="button"
                    >

                        <span>

                            <strong>
                                ${escapeHtml(location)}
                            </strong>

                            <small>
                                ${count} Artikel
                            </small>

                        </span>


                        <span class="location-arrow">
                            ›
                        </span>

                    </button>

                `;

            }
        )
        .join("");

}


function renderLocations() {

    const html =
        createLocationListHtml();


    document.getElementById(
        "locationList"
    ).innerHTML =
        html;


    document.getElementById(
        "qrLocationList"
    ).innerHTML =
        html;

}


// --------------------------------------------------
// ALLES RENDERN
// --------------------------------------------------

function renderEverything() {

    renderStats();

    renderInventory();

    renderShopping();

    renderHome();

    renderLocations();

    renderCategorySuggestions();

}


// --------------------------------------------------
// LAGERPLATZ FORMULAR
// --------------------------------------------------

function buildLocationFromFields() {

    const rack =
        document
            .getElementById(
                "locationRack"
            )
            .value
            .trim();


    const level =
        document
            .getElementById(
                "locationLevel"
            )
            .value
            .trim();


    const box =
        document
            .getElementById(
                "locationBox"
            )
            .value
            .trim();


    const custom =
        document
            .getElementById(
                "customLocation"
            )
            .value
            .trim();


    if (custom) {

        return custom;

    }


    const parts = [];


    if (rack) {

        parts.push(
            `R${rack}`
        );

    }


    if (level) {

        parts.push(
            `E${level}`
        );

    }


    if (box) {

        parts.push(
            `B${box}`
        );

    }


    return parts.join(
        "-"
    );

}


function updateGeneratedLocation() {

    const location =
        buildLocationFromFields();


    document.getElementById(
        "generatedLocation"
    ).textContent =
        location ||
        "—";

}


function parseStructuredLocation(location) {

    const match =
        String(
            location ||
            ""
        ).match(
            /^R(.+?)-E(.+?)-B(.+)$/
        );


    if (!match) {

        return null;

    }


    return {

        rack:
            match[1],

        level:
            match[2],

        box:
            match[3]

    };

}


// --------------------------------------------------
// FOTO
// --------------------------------------------------

function renderPhotoPreview() {

    const preview =
        document.getElementById(
            "photoPreview"
        );


    const removeButton =
        document.getElementById(
            "removePhotoButton"
        );


    if (currentPhoto) {

        preview.innerHTML = `

            <img
                src="${currentPhoto}"
                alt="Materialfoto"
            >

        `;


        removeButton.classList.remove(
            "hidden"
        );

    }
    else {

        preview.innerHTML = `

            <span>
                📷
            </span>

            <p>
                Noch kein Foto
            </p>

        `;


        removeButton.classList.add(
            "hidden"
        );

    }

}


// --------------------------------------------------
// FOTO VERKLEINERN
// --------------------------------------------------

function resizeImageFile(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            const maxSize =
                                1200;


                            let width =
                                image.width;


                            let height =
                                image.height;


                            if (
                                width > height &&
                                width > maxSize
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        maxSize /
                                        width
                                    );


                                width =
                                    maxSize;

                            }


                            if (
                                height >= width &&
                                height > maxSize
                            ) {

                                width =
                                    Math.round(
                                        width *
                                        maxSize /
                                        height
                                    );


                                height =
                                    maxSize;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.78
                                )
                            );

                        };


                    image.onerror =
                        reject;


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


// --------------------------------------------------
// ARTIKEL MODAL
// --------------------------------------------------

function openItemModal() {

    document
        .getElementById(
            "itemModal"
        )
        .classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


function closeItemModal() {

    document
        .getElementById(
            "itemModal"
        )
        .classList.add(
            "hidden"
        );


    document.body.style.overflow =
        "";

}


// --------------------------------------------------
// NEUER ARTIKEL
// --------------------------------------------------

function openNewItemModal() {

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Artikel hinzufügen";


    document.getElementById(
        "itemForm"
    ).reset();


    document.getElementById(
        "itemId"
    ).value =
        "";


    document.getElementById(
        "itemQuantity"
    ).value =
        "0";


    document.getElementById(
        "itemMinimum"
    ).value =
        "0";


    currentPhoto =
        "";


    renderPhotoPreview();

    updateGeneratedLocation();

    openItemModal();

}


// --------------------------------------------------
// ARTIKEL BEARBEITEN
// --------------------------------------------------

function openEditItemModal(id) {

    const item =
        items.find(
            item =>
                item.id ===
                id
        );


    if (!item) {

        return;

    }


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Artikel bearbeiten";


    document.getElementById(
        "itemId"
    ).value =
        item.id;


    document.getElementById(
        "itemName"
    ).value =
        item.name;


    document.getElementById(
        "itemCategory"
    ).value =
        item.category;


    document.getElementById(
        "itemQuantity"
    ).value =
        item.quantity;


    document.getElementById(
        "itemMinimum"
    ).value =
        item.minimum;


    document.getElementById(
        "itemUnit"
    ).value =
        item.unit;


    document.getElementById(
        "itemNote"
    ).value =
        item.note;


    const structured =
        parseStructuredLocation(
            item.location
        );


    if (structured) {

        document.getElementById(
            "locationRack"
        ).value =
            structured.rack;


        document.getElementById(
            "locationLevel"
        ).value =
            structured.level;


        document.getElementById(
            "locationBox"
        ).value =
            structured.box;


        document.getElementById(
            "customLocation"
        ).value =
            "";

    }
    else {

        document.getElementById(
            "locationRack"
        ).value =
            "";


        document.getElementById(
            "locationLevel"
        ).value =
            "";


        document.getElementById(
            "locationBox"
        ).value =
            "";


        document.getElementById(
            "customLocation"
        ).value =
            item.location;

    }


    currentPhoto =
        item.photo ||
        "";


    renderPhotoPreview();

    updateGeneratedLocation();

    openItemModal();

}


// --------------------------------------------------
// FORMULAR SPEICHERN
// --------------------------------------------------

document
    .getElementById(
        "itemForm"
    )
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const id =
                document
                    .getElementById(
                        "itemId"
                    )
                    .value;


            const data = {

                id:
                    id ||
                    createId(),

                name:
                    document
                        .getElementById(
                            "itemName"
                        )
                        .value
                        .trim(),

                category:
                    document
                        .getElementById(
                            "itemCategory"
                        )
                        .value
                        .trim(),

                quantity:
                    Math.max(
                        0,
                        Number(
                            document
                                .getElementById(
                                    "itemQuantity"
                                )
                                .value
                        ) || 0
                    ),

                minimum:
                    Math.max(
                        0,
                        Number(
                            document
                                .getElementById(
                                    "itemMinimum"
                                )
                                .value
                        ) || 0
                    ),

                unit:
                    document
                        .getElementById(
                            "itemUnit"
                        )
                        .value,

                location:
                    buildLocationFromFields(),

                note:
                    document
                        .getElementById(
                            "itemNote"
                        )
                        .value
                        .trim(),

                photo:
                    currentPhoto

            };


            if (!data.name) {

                return;

            }


            try {

                await putItemInDatabase(
                    data
                );


                await reloadItems();


                closeItemModal();


                showPage(
                    "inventoryPage"
                );

            }
            catch (error) {

                console.error(
                    error
                );


                alert(
                    "Der Artikel konnte nicht gespeichert werden."
                );

            }

        }
    );


// --------------------------------------------------
// BESTAND ÄNDERN
// --------------------------------------------------

async function changeQuantity(
    id,
    amount
) {

    const item =
        items.find(
            item =>
                item.id === id
        );


    if (!item) {

        return;

    }


    item.quantity =
        Math.max(
            0,
            Number(
                item.quantity
            ) +
            Number(
                amount
            )
        );


    try {

        await putItemInDatabase(
            item
        );


        await reloadItems();


        if (
            document
                .getElementById(
                    "detailPage"
                )
                .classList
                .contains(
                    "active"
                )
        ) {

            openItemDetail(
                id
            );

        }

    }
    catch (error) {

        console.error(
            error
        );


        alert(
            "Der Bestand konnte nicht gespeichert werden."
        );

    }

}


// --------------------------------------------------
// ARTIKEL DETAIL
// --------------------------------------------------

function openItemDetail(id) {

    const item =
        items.find(
            item =>
                item.id === id
        );


    if (!item) {

        return;

    }


    const low =
        isLowStock(
            item
        );


    document.getElementById(
        "detailContent"
    ).innerHTML = `

        ${
            item.photo
                ? `

                    <img
                        class="detail-photo"
                        src="${item.photo}"
                        alt=""
                    >

                `
                : ""
        }


        <div class="detail-hero">

            <p class="eyebrow light">

                ${
                    escapeHtml(
                        item.category ||
                        "MATERIAL"
                    )
                }

            </p>


            <h2>
                ${escapeHtml(item.name)}
            </h2>


            <p>

                ${
                    escapeHtml(
                        item.location ||
                        "Kein Lagerplatz"
                    )
                }

            </p>


            <div class="detail-stock">

                ${Number(item.quantity)}

                <small>
                    ${escapeHtml(item.unit)}
                </small>

            </div>

        </div>


        <div class="detail-grid">

            <div class="detail-box">

                <span>
                    MINDESTBESTAND
                </span>

                <strong>

                    ${Number(item.minimum)}
                    ${escapeHtml(item.unit)}

                </strong>

            </div>


            <div class="detail-box">

                <span>
                    STATUS
                </span>

                <strong>

                    ${
                        low
                            ? "Nachkaufen"
                            : "Bestand OK"
                    }

                </strong>

            </div>

        </div>


        ${
            item.note
                ? `

                    <div
                        class="detail-box"
                        style="margin-top:10px"
                    >

                        <span>
                            NOTIZ
                        </span>

                        <strong>
                            ${escapeHtml(item.note)}
                        </strong>

                    </div>

                `
                : ""
        }


        <div class="detail-buttons">

            <button
                class="detail-action"
                data-detail-change="-1"
                data-detail-id="${escapeHtml(item.id)}"
                type="button"
            >
                −1
            </button>


            <button
                class="detail-action"
                data-detail-change="1"
                data-detail-id="${escapeHtml(item.id)}"
                type="button"
            >
                +1
            </button>


            <button
                class="detail-action secondary"
                data-detail-qr="${escapeHtml(item.id)}"
                type="button"
            >
                QR-Code
            </button>


            <button
                class="detail-action secondary"
                data-detail-edit="${escapeHtml(item.id)}"
                type="button"
            >
                Bearbeiten
            </button>

        </div>

    `;


    showPage(
        "detailPage"
    );

}


// --------------------------------------------------
// LAGERPLATZ DETAIL
// --------------------------------------------------

function openLocationDetail(location) {

    const locationItems =
        items.filter(
            item =>
                item.location ===
                location
        );


    document.getElementById(
        "locationDetailContent"
    ).innerHTML = `

        <div class="location-detail-title">

            <p class="eyebrow light">
                LAGERPLATZ
            </p>

            <h2>
                ${escapeHtml(location)}
            </h2>

        </div>


        <div class="detail-buttons">

            <button
                class="detail-action"
                data-location-qr="${escapeHtml(location)}"
                type="button"
            >
                QR-Code anzeigen
            </button>

        </div>


        <div class="section-heading">

            <div>

                <p class="eyebrow">
                    INHALT
                </p>

                <h2>
                    ${locationItems.length}
                    Artikel
                </h2>

            </div>

        </div>


        <div class="card-list">

            ${
                locationItems.length
                    ? locationItems
                        .map(
                            createItemCard
                        )
                        .join("")
                    : `

                        <div class="empty-card">

                            <h3>
                                Lagerplatz leer
                            </h3>

                        </div>

                    `
            }

        </div>

    `;


    showPage(
        "locationDetailPage"
    );

}


// --------------------------------------------------
// QR DATEN
// --------------------------------------------------

function createItemQrValue(item) {

    return (
        "WL|ITEM|" +
        item.id
    );

}


function createLocationQrValue(location) {

    return (
        "WL|LOCATION|" +
        encodeURIComponent(
            location
        )
    );

}


// --------------------------------------------------
// QR ANZEIGEN
// --------------------------------------------------

function showQrCode(
    title,
    subtitle,
    value
) {

    document.getElementById(
        "qrModalTitle"
    ).textContent =
        title;


    document.getElementById(
        "qrModalSubtitle"
    ).textContent =
        subtitle;


    document.getElementById(
        "qrReadableCode"
    ).textContent =
        value;


    const container =
        document.getElementById(
            "qrCodeContainer"
        );


    container.innerHTML =
        "";


    if (
        typeof QRCode ===
        "undefined"
    ) {

        container.innerHTML = `

            <p>
                QR-Bibliothek konnte
                nicht geladen werden.
            </p>

        `;

    }
    else {

        new QRCode(
            container,
            {
                text:
                    value,

                width:
                    220,

                height:
                    220,

                correctLevel:
                    QRCode
                        .CorrectLevel
                        .H
            }
        );

    }


    document
        .getElementById(
            "qrModal"
        )
        .classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


function showItemQr(id) {

    const item =
        items.find(
            item =>
                item.id === id
        );


    if (!item) {

        return;

    }


    showQrCode(
        item.name,
        item.location ||
        "Kein Lagerplatz",
        createItemQrValue(
            item
        )
    );

}


function showLocationQr(location) {

    showQrCode(
        location,
        "Lagerplatz",
        createLocationQrValue(
            location
        )
    );

}


function closeQrModal() {

    document
        .getElementById(
            "qrModal"
        )
        .classList.add(
            "hidden"
        );


    document.body.style.overflow =
        "";

}


// --------------------------------------------------
// SCANNER
// --------------------------------------------------

async function openScanner() {

    document
        .getElementById(
            "scannerModal"
        )
        .classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";


    document.getElementById(
        "scannerStatus"
    ).textContent =
        "";


    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        document.getElementById(
            "scannerStatus"
        ).textContent =
            "Die Scanner-Bibliothek konnte nicht geladen werden.";


        return;

    }


    if (
        scannerRunning
    ) {

        return;

    }


    scanner =
        new Html5Qrcode(
            "qrReader"
        );


    try {

        await scanner.start(

            {
                facingMode:
                    "environment"
            },

            {
                fps:
                    10,

                qrbox: {
                    width:
                        240,

                    height:
                        240
                }
            },

            scannedText => {

                handleScannedCode(
                    scannedText
                );

            },

            () => {}

        );


        scannerRunning =
            true;

    }
    catch (error) {

        console.error(
            error
        );


        document.getElementById(
            "scannerStatus"
        ).textContent =
            "Kamera konnte nicht gestartet werden. Auf dem iPhone benötigt der Scanner HTTPS und Kamerazugriff.";

    }

}


async function closeScanner() {

    if (
        scanner &&
        scannerRunning
    ) {

        try {

            await scanner.stop();

        }
        catch (error) {

            console.error(
                error
            );

        }

    }


    if (scanner) {

        try {

            scanner.clear();

        }
        catch (error) {

            console.error(
                error
            );

        }

    }


    scanner =
        null;

    scannerRunning =
        false;


    document
        .getElementById(
            "scannerModal"
        )
        .classList.add(
            "hidden"
        );


    document.body.style.overflow =
        "";

}


// --------------------------------------------------
// SCAN AUSWERTEN
// --------------------------------------------------

async function handleScannedCode(text) {

    if (
        !text ||
        !text.startsWith(
            "WL|"
        )
    ) {

        document.getElementById(
            "scannerStatus"
        ).textContent =
            "Dieser QR-Code gehört nicht zu Werkstatt Lager.";


        return;

    }


    const parts =
        text.split(
            "|"
        );


    const type =
        parts[1];


    const value =
        parts
            .slice(2)
            .join("|");


    if (
        type ===
        "ITEM"
    ) {

        const item =
            items.find(
                item =>
                    item.id ===
                    value
            );


        if (!item) {

            document.getElementById(
                "scannerStatus"
            ).textContent =
                "Artikel wurde nicht gefunden.";


            return;

        }


        await closeScanner();


        previousPage =
            "inventoryPage";


        openItemDetail(
            item.id
        );


        return;

    }


    if (
        type ===
        "LOCATION"
    ) {

        let location;


        try {

            location =
                decodeURIComponent(
                    value
                );

        }
        catch {

            location =
                value;

        }


        if (
            !getLocations()
                .includes(
                    location
                )
        ) {

            document.getElementById(
                "scannerStatus"
            ).textContent =
                "Lagerplatz wurde nicht gefunden.";


            return;

        }


        await closeScanner();


        openLocationDetail(
            location
        );


        return;

    }


    document.getElementById(
        "scannerStatus"
    ).textContent =
        "Unbekannter Werkstatt-Lager-Code.";

}


// --------------------------------------------------
// LÖSCHEN
// --------------------------------------------------

function openDeleteModal(id) {

    const item =
        items.find(
            item =>
                item.id === id
        );


    if (!item) {

        return;

    }


    deleteItemId =
        id;


    document.getElementById(
        "deleteText"
    ).textContent =
        `"${item.name}" wird dauerhaft aus deinem Lager entfernt.`;


    document
        .getElementById(
            "deleteModal"
        )
        .classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


function closeDeleteModal() {

    deleteItemId =
        null;


    document
        .getElementById(
            "deleteModal"
        )
        .classList.add(
            "hidden"
        );


    document.body.style.overflow =
        "";

}


// --------------------------------------------------
// BACKUP EXPORT
// --------------------------------------------------

function exportBackup() {

    const backup = {

        app:
            "Werkstatt Lager",

        version:
            4,

        database:
            "IndexedDB",

        created:
            new Date()
                .toISOString(),

        items:
            items

    };


    const json =
        JSON.stringify(
            backup,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const date =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );


    link.href =
        url;


    link.download =
        `werkstatt-lager-backup-${date}.json`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


// --------------------------------------------------
// BACKUP IMPORT
// --------------------------------------------------

function importBackupFile(file) {

    const reader =
        new FileReader();


    reader.onload =
        async event => {

            try {

                const backup =
                    JSON.parse(
                        event.target.result
                    );


                if (
                    !backup ||
                    !Array.isArray(
                        backup.items
                    )
                ) {

                    throw new Error(
                        "Ungültiges Backup"
                    );

                }


                const confirmed =
                    confirm(
                        `Backup mit ${backup.items.length} Artikeln importieren? Dein aktuelles Lager wird dadurch ersetzt.`
                    );


                if (
                    !confirmed
                ) {

                    return;

                }


                const importedItems =
                    backup.items.map(
                        normalizeItem
                    );


                await clearDatabase();


                await putManyItemsInDatabase(
                    importedItems
                );


                await reloadItems();


                alert(
                    "Backup wurde erfolgreich importiert."
                );


                showPage(
                    "homePage"
                );

            }
            catch (error) {

                console.error(
                    error
                );


                alert(
                    "Diese Datei ist kein gültiges Werkstatt-Lager-Backup."
                );

            }

        };


    reader.readAsText(
        file
    );

}


// --------------------------------------------------
// KLICK EVENTS
// --------------------------------------------------

document.addEventListener(
    "click",
    event => {

        const card =
            event.target.closest(
                ".item-card[data-item-id]"
            );


        if (card) {

            const id =
                card.dataset.itemId;


            const changeButton =
                event.target.closest(
                    "[data-change]"
                );


            if (changeButton) {

                changeQuantity(
                    id,
                    Number(
                        changeButton
                            .dataset
                            .change
                    )
                );


                return;

            }


            if (
                event.target.closest(
                    "[data-details]"
                )
            ) {

                previousPage =
                    document
                        .querySelector(
                            ".page.active"
                        )
                        ?.id ||
                    "inventoryPage";


                openItemDetail(
                    id
                );


                return;

            }


            if (
                event.target.closest(
                    "[data-item-qr]"
                )
            ) {

                showItemQr(
                    id
                );


                return;

            }


            if (
                event.target.closest(
                    "[data-edit]"
                )
            ) {

                openEditItemModal(
                    id
                );


                return;

            }


            if (
                event.target.closest(
                    "[data-delete]"
                )
            ) {

                openDeleteModal(
                    id
                );


                return;

            }

        }


        const detailChange =
            event.target.closest(
                "[data-detail-change]"
            );


        if (detailChange) {

            changeQuantity(

                detailChange
                    .dataset
                    .detailId,

                Number(
                    detailChange
                        .dataset
                        .detailChange
                )

            );


            return;

        }


        const detailQr =
            event.target.closest(
                "[data-detail-qr]"
            );


        if (detailQr) {

            showItemQr(
                detailQr
                    .dataset
                    .detailQr
            );


            return;

        }


        const detailEdit =
            event.target.closest(
                "[data-detail-edit]"
            );


        if (detailEdit) {

            openEditItemModal(
                detailEdit
                    .dataset
                    .detailEdit
            );


            return;

        }


        const locationCard =
            event.target.closest(
                "[data-location]"
            );


        if (locationCard) {

            previousPage =
                document
                    .querySelector(
                        ".page.active"
                    )
                    ?.id ||
                "locationsPage";


            openLocationDetail(
                locationCard
                    .dataset
                    .location
            );


            return;

        }


        const locationQr =
            event.target.closest(
                "[data-location-qr]"
            );


        if (locationQr) {

            showLocationQr(
                locationQr
                    .dataset
                    .locationQr
            );

        }

    }
);


// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

document
    .querySelectorAll(
        "[data-page-target]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button
                            .dataset
                            .pageTarget
                    );

                }
            );

        }
    );


// --------------------------------------------------
// FILTER
// --------------------------------------------------

document
    .querySelectorAll(
        ".filter-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    currentFilter =
                        button
                            .dataset
                            .filter;


                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(
                            filterButton => {

                                filterButton
                                    .classList
                                    .remove(
                                        "active"
                                    );

                            }
                        );


                    button
                        .classList
                        .add(
                            "active"
                        );


                    renderInventory();

                }
            );

        }
    );


// --------------------------------------------------
// SUCHE
// --------------------------------------------------

document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "input",
        renderInventory
    );


// --------------------------------------------------
// LAGERPLATZ EINGABEN
// --------------------------------------------------

[
    "locationRack",
    "locationLevel",
    "locationBox",
    "customLocation"

].forEach(
    id => {

        document
            .getElementById(
                id
            )
            .addEventListener(
                "input",
                updateGeneratedLocation
            );

    }
);


// --------------------------------------------------
// FOTO
// --------------------------------------------------

document
    .getElementById(
        "itemPhoto"
    )
    .addEventListener(
        "change",
        async event => {

            const file =
                event.target.files[0];


            if (!file) {

                return;

            }


            try {

                currentPhoto =
                    await resizeImageFile(
                        file
                    );


                renderPhotoPreview();

            }
            catch (error) {

                console.error(
                    error
                );


                alert(
                    "Das Foto konnte nicht verarbeitet werden."
                );

            }


            event.target.value =
                "";

        }
    );


document
    .getElementById(
        "removePhotoButton"
    )
    .addEventListener(
        "click",
        () => {

            currentPhoto =
                "";


            renderPhotoPreview();

        }
    );


// --------------------------------------------------
// ADD
// --------------------------------------------------

document
    .getElementById(
        "addButton"
    )
    .addEventListener(
        "click",
        openNewItemModal
    );


document
    .getElementById(
        "quickAddButton"
    )
    .addEventListener(
        "click",
        openNewItemModal
    );


// --------------------------------------------------
// MODALS
// --------------------------------------------------

document
    .querySelectorAll(
        "[data-close-item-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                closeItemModal
            );

        }
    );


document
    .querySelectorAll(
        "[data-close-delete-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                closeDeleteModal
            );

        }
    );


document
    .querySelectorAll(
        "[data-close-qr-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                closeQrModal
            );

        }
    );


// --------------------------------------------------
// LÖSCHEN BESTÄTIGEN
// --------------------------------------------------

document
    .getElementById(
        "confirmDeleteButton"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                !deleteItemId
            ) {

                return;

            }


            const id =
                deleteItemId;


            try {

                await deleteItemFromDatabase(
                    id
                );


                await reloadItems();


                closeDeleteModal();


                showPage(
                    "inventoryPage"
                );

            }
            catch (error) {

                console.error(
                    error
                );


                alert(
                    "Der Artikel konnte nicht gelöscht werden."
                );

            }

        }
    );


// --------------------------------------------------
// SCANNER
// --------------------------------------------------

document
    .getElementById(
        "homeScanButton"
    )
    .addEventListener(
        "click",
        openScanner
    );


document
    .getElementById(
        "qrScanButton"
    )
    .addEventListener(
        "click",
        openScanner
    );


document
    .getElementById(
        "closeScannerButton"
    )
    .addEventListener(
        "click",
        closeScanner
    );


// --------------------------------------------------
// ZURÜCK
// --------------------------------------------------

document
    .getElementById(
        "detailBackButton"
    )
    .addEventListener(
        "click",
        () => {

            showPage(
                previousPage ||
                "inventoryPage"
            );

        }
    );


document
    .getElementById(
        "locationBackButton"
    )
    .addEventListener(
        "click",
        () => {

            showPage(
                previousPage ||
                "locationsPage"
            );

        }
    );


// --------------------------------------------------
// QR DRUCK
// --------------------------------------------------

document
    .getElementById(
        "printQrButton"
    )
    .addEventListener(
        "click",
        () => {

            window.print();

        }
    );


// --------------------------------------------------
// BACKUP
// --------------------------------------------------

document
    .getElementById(
        "exportButton"
    )
    .addEventListener(
        "click",
        exportBackup
    );


document
    .getElementById(
        "importButton"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "importFileInput"
                )
                .click();

        }
    );


document
    .getElementById(
        "importFileInput"
    )
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (file) {

                importBackupFile(
                    file
                );

            }


            event.target.value =
                "";

        }
    );


// --------------------------------------------------
// APP STARTEN
// --------------------------------------------------

async function startApp() {

    try {

        if (
            !("indexedDB" in window)
        ) {

            throw new Error(
                "IndexedDB wird nicht unterstützt."
            );

        }


        await openDatabase();


        items =
            await migrateOldLocalStorageData();


        items =
            await getAllItemsFromDatabase();


        renderPhotoPreview();

        updateGeneratedLocation();

        renderEverything();


        console.log(
            "Werkstatt Lager Version 4 gestartet."
        );


        console.log(
            `${items.length} Artikel aus IndexedDB geladen.`
        );

    }
    catch (error) {

        console.error(
            "Startfehler:",
            error
        );


        alert(
            "Die Werkstatt-Datenbank konnte nicht gestartet werden."
        );

    }

}


startApp();