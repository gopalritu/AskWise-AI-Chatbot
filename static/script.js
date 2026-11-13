const form = document.getElementById("question-form");
const input = document.getElementById("question-input");
const chat = document.getElementById("chat");
const sendButton = document.getElementById("send-button");
const clearButton = document.getElementById("clear-button");
const welcome = document.getElementById("welcome");

const imageInput = document.getElementById("image-input");
const uploadButton = document.getElementById("upload-button");
const imagePreview = document.getElementById("image-preview");
const previewImage = document.getElementById("preview-image");
const imageName = document.getElementById("image-name");
const removeImageButton = document.getElementById("remove-image");

const micButton = document.getElementById("mic-button");
const voiceStatus = document.getElementById("voice-status");

let history = [];
let selectedImage = null;
let recognition = null;


function addMessage(text, sender, extraClass = "", imageUrl = null) {

    const row = document.createElement("div");
    row.className = `message ${sender} ${extraClass}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "Uploaded image";
        image.className = "message-image";
        bubble.appendChild(image);
    }

    const textNode = document.createElement("div");

    if (sender === "assistant" && window.marked && window.DOMPurify) {
        const html = marked.parse(text);
        textNode.innerHTML = DOMPurify.sanitize(html);
    } else {
        textNode.textContent = text;
    }

    bubble.appendChild(textNode);
    row.appendChild(bubble);
    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;

    return row;
}


function showImagePreview(file) {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        alert("Please choose a JPG, PNG or WebP image.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please choose an image smaller than 5 MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function () {
        selectedImage = reader.result;
        previewImage.src = selectedImage;
        imageName.textContent = file.name;
        imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
}

uploadButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
    showImagePreview(imageInput.files[0]);
});

function removeSelectedImage() {
    selectedImage = null;
    imageInput.value = "";

    imagePreview.hidden = true;
    previewImage.src = "";
    imageName.textContent = "";
}
removeImageButton.addEventListener("click", removeSelectedImage);

async function askQuestion(question) {
    if (!question.trim() && !selectedImage) return;

    welcome.style.display = "none";
    const imageForRequest = selectedImage;

    addMessage(question || "Please describe this image.", "user", "", imageForRequest);
    input.value = "";
    removeSelectedImage();
    sendButton.disabled = true;
    uploadButton.disabled = true;

    const loadingRow = addMessage("Thinking...", "assistant");

    try {
        const response = await fetch("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: question || "Describe this image and explain its important details.",
                history: history,
                image: imageForRequest
            })
        });

        const data = await response.json();
        loadingRow.remove();

        if (!response.ok) {
            addMessage(data.error || "Something went wrong.", "assistant", "error");
            return;
        }

        addMessage(data.answer, "assistant");
        history.push({ role: "user", text: question || "Please describe the uploaded image." });
        history.push({ role: "model", text: data.answer });
        history = history.slice(-8);

    } catch (error) {
        loadingRow.remove();
        addMessage("Could not connect to the server. Is Flask running?", "assistant", "error");
    } finally {
        sendButton.disabled = false;
        uploadButton.disabled = false;
        input.focus();
    }
}

form.addEventListener("submit", function (event) {
    event.preventDefault();
    askQuestion(input.value.trim());
});

clearButton.addEventListener("click", function () {
    history = [];
    chat.innerHTML = "";
    chat.appendChild(welcome);
    welcome.style.display = "block";
    removeSelectedImage();
});

document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => askQuestion(button.textContent));
});

// Browser speech recognition. Availability depends on browser and device.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function () {
        micButton.classList.add("listening");
        voiceStatus.textContent = "Listening... speak now";
    };

    recognition.onresult = function (event) {
        const spokenText = event.results[0][0].transcript;
        input.value = (input.value + " " + spokenText).trim();
        voiceStatus.textContent = "Voice converted to text. Review and press Send.";
    };

    recognition.onerror = function () {
        voiceStatus.textContent = "Microphone error. Check browser permission and try again.";
    };

    recognition.onend = function () {
        micButton.classList.remove("listening");
    };

    micButton.addEventListener("click", function () {
        try {
            recognition.start();
        } catch (error) {
            voiceStatus.textContent = "Microphone is already listening.";
        }
    });
} else {
    micButton.disabled = true;
    micButton.title = "Speech recognition is not supported in this browser.";
    voiceStatus.textContent = "Voice input is not supported in this browser. Try a supported browser.";
}

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});
