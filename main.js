const form = document.getElementById("apiForm");
const apiUrlInput = document.getElementById("apiUrl");
const statusText = document.getElementById("statusText");
const loadBtn = document.getElementById("loadBtn");

const jsonPanel = document.getElementById("jsonPanel");
const audioPanel = document.getElementById("audioPanel");
const imagePanel = document.getElementById("imagePanel");
const jsonViewer = document.getElementById("jsonViewer");
const jsonMeta = document.getElementById("jsonMeta");
const expandBtn = document.getElementById("expandBtn");
const collapseBtn = document.getElementById("collapseBtn");
const copyBtn = document.getElementById("copyBtn");

const audio = document.getElementById("apiAudio");
const playBtn = document.getElementById("playBtn");
const backwardBtn = document.getElementById("backwardBtn");
const forwardBtn = document.getElementById("forwardBtn");
const volumeRange = document.getElementById("volumeRange");
const speedSelect = document.getElementById("speedSelect");

const apiImage = document.getElementById("apiImage");
const sizeSelect = document.getElementById("sizeSelect");
const fitSelect = document.getElementById("fitSelect");

const panels = {
    json: jsonPanel,
    audio: audioPanel,
    image: imagePanel,
};

const imageKeys = ["image", "imageUrl", "img", "src", "url", "file", "path", "thumbnail"];
const audioKeys = ["audio", "audioUrl", "sound", "voice", "mp3", "m4a", "ogg", "recitation", "src", "url", "file", "path"];

let currentJsonText = "";
let localObjectUrl = "";

function setStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.classList.toggle("is-error", isError);
}

function showOnlyPanel(mode) {
    Object.entries(panels).forEach(([panelMode, panel]) => {
        panel.hidden = panelMode !== mode;
    });
}

function getType(value) {
    if (Array.isArray(value)) {
        return "array";
    }

    if (value === null) {
        return "null";
    }

    return typeof value;
}

function createValueElement(value) {
    const valueElement = document.createElement("span");
    const type = getType(value);

    valueElement.className = `json-${type}`;
    valueElement.textContent = type === "string" ? JSON.stringify(value) : String(value);

    return valueElement;
}

function createKeyElement(key) {
    const fragment = document.createDocumentFragment();

    if (key !== null) {
        const keyElement = document.createElement("span");
        keyElement.className = "json-key";
        keyElement.textContent = JSON.stringify(String(key));
        fragment.append(keyElement);

        const colon = document.createElement("span");
        colon.className = "json-colon";
        colon.textContent = ": ";
        fragment.append(colon);
    }

    return fragment;
}

function createToggleButton(childrenContainer) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "json-toggle";
    button.textContent = "-";
    button.setAttribute("aria-label", "طي العنصر");
    button.setAttribute("aria-expanded", "true");

    button.addEventListener("click", () => {
        const willExpand = childrenContainer.hidden;
        childrenContainer.hidden = !willExpand;
        button.textContent = willExpand ? "-" : "+";
        button.setAttribute("aria-label", willExpand ? "طي العنصر" : "فك العنصر");
        button.setAttribute("aria-expanded", String(willExpand));
    });

    return button;
}

function createNode(key, value) {
    const item = document.createElement("li");
    const type = getType(value);
    item.className = "json-node";
    item.append(createKeyElement(key));

    if (type !== "object" && type !== "array") {
        item.append(createValueElement(value));
        return item;
    }

    const entries = type === "array" ? value.map((child, index) => [index, child]) : Object.entries(value);
    const childrenContainer = document.createElement("ul");
    const toggleButton = createToggleButton(childrenContainer);
    const typeElement = document.createElement("span");

    typeElement.className = "json-type";
    typeElement.textContent = type === "array" ? `Array(${value.length})` : `Object(${entries.length})`;

    item.prepend(toggleButton);
    item.append(typeElement);

    if (entries.length === 0) {
        const emptyElement = document.createElement("span");
        emptyElement.className = "json-empty";
        emptyElement.textContent = type === "array" ? " []" : " {}";
        item.append(emptyElement);
        toggleButton.disabled = true;
        toggleButton.textContent = "";
        return item;
    }

    entries.forEach(([childKey, childValue]) => {
        childrenContainer.append(createNode(childKey, childValue));
    });

    item.append(childrenContainer);
    return item;
}

function renderJson(data) {
    const rootList = document.createElement("ul");
    jsonViewer.replaceChildren();
    rootList.append(createNode("root", data));
    jsonViewer.append(rootList);
}

function setAllJsonNodes(expanded) {
    jsonViewer.querySelectorAll(".json-node > ul").forEach((list) => {
        list.hidden = !expanded;
    });

    jsonViewer.querySelectorAll(".json-toggle:not(:disabled)").forEach((button) => {
        button.textContent = expanded ? "-" : "+";
        button.setAttribute("aria-label", expanded ? "طي العنصر" : "فك العنصر");
        button.setAttribute("aria-expanded", String(expanded));
    });
}

function updateJsonMeta(data, text) {
    const type = getType(data);
    const size = new Blob([text]).size;
    const formattedSize = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
    const typeLabel = type === "array" ? "مصفوفة" : type === "object" ? "كائن" : "قيمة";

    jsonMeta.textContent = `${typeLabel} - ${formattedSize}`;
}

function showJsonText(text) {
    const data = JSON.parse(text);
    currentJsonText = JSON.stringify(data, null, 2);
    renderJson(data);
    updateJsonMeta(data, currentJsonText);
    showOnlyPanel("json");
    setStatus("تم كشف الرابط كـ JSON وعرضه بنجاح.");
}

async function loadJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        },
    });
    const text = await response.text();

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    showJsonText(text);
}

function updatePlayButton() {
    playBtn.textContent = audio.paused ? "تشغيل" : "إيقاف";
}

function seekAudioBy(seconds) {
    if (!Number.isFinite(audio.duration)) {
        return;
    }

    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
}

function loadAudio(url) {
    audio.src = url;
    audio.load();
    showOnlyPanel("audio");
    setStatus("تم تحميل الرابط. يمكنك التشغيل الآن.");

    audio.play().catch(() => {
        setStatus("تم تجهيز الصوت. اضغط زر التشغيل إذا لم يبدأ تلقائيًا.");
    });
}

function clearLocalObjectUrl() {
    if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
        localObjectUrl = "";
    }
}

function applyImageSettings() {
    const isOriginalSize = fitSelect.value === "none";

    apiImage.classList.toggle("is-original-size", isOriginalSize);
    apiImage.style.transform = isOriginalSize ? "" : `scale(${Number(sizeSelect.value)})`;
    apiImage.style.objectFit = isOriginalSize ? "none" : fitSelect.value;
}

function isImageUrl(url) {
    return /\.(apng|avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(url);
}

function isAudioUrl(url) {
    return /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav|weba)(\?.*)?$/i.test(url);
}

function isJsonUrl(url) {
    return /\.(json)(\?.*)?$/i.test(url);
}

function normalizeUrl(url) {
    const trimmedUrl = url.trim();

    if (/^[a-z]:\\/i.test(trimmedUrl)) {
        return "";
    }

    return trimmedUrl;
}

function findUrlByKeys(data, keys, matcher) {
    if (typeof data === "string") {
        return matcher(data) ? data : "";
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findUrlByKeys(item, keys, matcher);
            if (found) {
                return found;
            }
        }
        return "";
    }

    if (!data || typeof data !== "object") {
        return "";
    }

    for (const key of keys) {
        const value = data[key];
        if (typeof value === "string" && value.trim() && matcher(value)) {
            return value;
        }
    }

    for (const value of Object.values(data)) {
        const found = findUrlByKeys(value, keys, matcher);
        if (found) {
            return found;
        }
    }

    return "";
}

function findImageUrl(data) {
    return findUrlByKeys(data, imageKeys, isImageUrl);
}

function findAudioUrl(data) {
    return findUrlByKeys(data, audioKeys, isAudioUrl);
}

function resolveApiUrl(imageUrl, sourceUrl) {
    try {
        return new URL(imageUrl, sourceUrl).href;
    } catch {
        return imageUrl;
    }
}

function showImage(url, successMessage = "تم تحميل الصورة بنجاح.") {
    apiImage.src = url;
    showOnlyPanel("image");
    applyImageSettings();
    setStatus(successMessage);
}

async function loadImage(rawUrl) {
    const url = normalizeUrl(rawUrl);

    if (!url) {
        setStatus("مسارات الجهاز المباشرة لا تعمل داخل المتصفح. استخدم رابطًا محليًا نسبيًا مثل logo.png أو رابطًا من سيرفر.", true);
        return;
    }

    clearLocalObjectUrl();

    if (isImageUrl(url) || url.startsWith("blob:") || url.startsWith("data:image/")) {
        showImage(url);
        return;
    }

    try {
        const response = await fetch(url);
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
            throw new Error("bad-response");
        }

        if (contentType.includes("application/json")) {
            const data = await response.json();
            const foundUrl = findImageUrl(data);

            if (!foundUrl) {
                setStatus("تم تحميل JSON، لكن لم أجد داخله رابط صورة واضح.", true);
                return;
            }

            showImage(resolveApiUrl(foundUrl, url), "تم استخراج رابط الصورة من API وعرضها.");
            return;
        }

        if (contentType.startsWith("image/")) {
            const blob = await response.blob();
            localObjectUrl = URL.createObjectURL(blob);
            showImage(localObjectUrl);
            return;
        }

        showImage(url, "تم إرسال الرابط للعارض. إذا لم تظهر الصورة فتأكد أن الرابط يرجع صورة مباشرة.");
    } catch {
        showImage(url, "تم إرسال الرابط للعارض مباشرة. إذا لم تظهر الصورة فقد يكون الرابط يمنع CORS أو ليس صورة مباشرة.");
    }
}

function getContentMode(contentType) {
    const normalizedType = contentType.toLowerCase();

    if (normalizedType.includes("application/json") || normalizedType.includes("+json")) {
        return "json";
    }

    if (normalizedType.startsWith("image/")) {
        return "image";
    }

    if (normalizedType.startsWith("audio/")) {
        return "audio";
    }

    return "";
}

function getUrlMode(url) {
    if (url.startsWith("data:image/") || isImageUrl(url)) {
        return "image";
    }

    if (url.startsWith("data:audio/") || isAudioUrl(url)) {
        return "audio";
    }

    if (isJsonUrl(url)) {
        return "json";
    }

    return "";
}

function showDetectedJson(data) {
    currentJsonText = JSON.stringify(data, null, 2);
    renderJson(data);
    updateJsonMeta(data, currentJsonText);
    showOnlyPanel("json");
    setStatus("تم كشف الرابط كـ JSON وعرضه بنجاح.");
}

async function detectAndLoad(rawUrl) {
    const url = normalizeUrl(rawUrl);

    if (!url) {
        setStatus("مسارات الجهاز المباشرة لا تعمل داخل المتصفح. استخدم رابطًا محليًا نسبيًا مثل logo.png أو رابطًا من سيرفر.", true);
        return;
    }

    const urlMode = getUrlMode(url);

    if (urlMode === "image") {
        showImage(url, "تم كشف الرابط كصورة وعرضها.");
        return;
    }

    if (urlMode === "audio") {
        loadAudio(url);
        setStatus("تم كشف الرابط كصوت وتجهيز المشغل.");
        return;
    }

    if (urlMode === "json") {
        await loadJson(url);
        return;
    }

    const response = await fetch(url, {
        headers: {
            Accept: "application/json, image/*, audio/*, text/plain;q=0.9, */*;q=0.8",
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const contentMode = getContentMode(contentType);

    if (contentMode === "image") {
        clearLocalObjectUrl();
        localObjectUrl = URL.createObjectURL(await response.blob());
        showImage(localObjectUrl, "تم كشف استجابة API كصورة وعرضها.");
        return;
    }

    if (contentMode === "audio") {
        loadAudio(url);
        setStatus("تم كشف استجابة API كصوت وتجهيز المشغل.");
        return;
    }

    const text = await response.text();

    try {
        const data = JSON.parse(text);
        showDetectedJson(data);
    } catch {
        throw new Error("unknown-type");
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = apiUrlInput.value.trim();

    if (!url) {
        setStatus("اكتب الرابط أولًا.", true);
        return;
    }

    loadBtn.disabled = true;
    loadBtn.textContent = "جاري...";
    setStatus("جاري كشف نوع الرابط...");

    try {
        await detectAndLoad(url);
    } catch {
        currentJsonText = "";
        setStatus("تعذر كشف نوع الرابط أو تحميله. تأكد أن الرابط مباشر أو أن CORS يسمح بالوصول من المتصفح.", true);
    } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = "عرض";
    }
});

expandBtn.addEventListener("click", () => setAllJsonNodes(true));
collapseBtn.addEventListener("click", () => setAllJsonNodes(false));

copyBtn.addEventListener("click", async () => {
    if (!currentJsonText) {
        setStatus("لا توجد بيانات لنسخها.", true);
        return;
    }

    try {
        await navigator.clipboard.writeText(currentJsonText);
        setStatus("تم نسخ JSON المنسق.");
    } catch {
        setStatus("تعذر النسخ من المتصفح. يمكنك تحديد النص من العارض ونسخه يدويًا.", true);
    }
});

playBtn.addEventListener("click", () => {
    if (!audio.src) {
        setStatus("اكتب رابط الصوت ثم اضغط عرض.", true);
        return;
    }

    if (audio.paused) {
        audio.play().catch(() => {
            setStatus("تعذر تشغيل الرابط. تأكد أن الرابط مباشر ويدعم التشغيل من المتصفح.", true);
        });
    } else {
        audio.pause();
    }
});

backwardBtn.addEventListener("click", () => seekAudioBy(-10));
forwardBtn.addEventListener("click", () => seekAudioBy(10));

volumeRange.addEventListener("input", () => {
    audio.volume = Number(volumeRange.value);
});

speedSelect.addEventListener("change", () => {
    audio.playbackRate = Number(speedSelect.value);
});

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);
audio.addEventListener("ended", updatePlayButton);
audio.addEventListener("error", () => {
    setStatus("تعذر تحميل الصوت. جرب رابط ملف صوت مباشر أو تحقق من إعدادات CORS في API.", true);
    updatePlayButton();
});

sizeSelect.addEventListener("change", applyImageSettings);
fitSelect.addEventListener("change", applyImageSettings);

apiImage.addEventListener("load", () => {
    setStatus("الصورة ظاهرة الآن.");
});

apiImage.addEventListener("error", () => {
    setStatus("تعذر عرض الصورة. تأكد من الرابط، أو إعدادات CORS، أو استخدم رابط صورة مباشر من السيرفر.", true);
});
