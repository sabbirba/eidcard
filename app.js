const nameInput = document.getElementById("nameInput");
const noteInput = document.getElementById("noteInput");
const svgContainer = document.getElementById("svgContainer");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const templateThumbnailsContainer =
  document.getElementById("templateThumbnails");

const templates = [
  { path: "templates/template1.svg", color: "#3f3b3a" },
  { path: "templates/template2.svg", color: "#ffb400" },
  { path: "templates/template3.svg", color: "#ffffff" },
  { path: "templates/template4.svg", color: "#ffffff" },
  { path: "templates/template5.svg", color: "#3f3b3a" },
];

let currentTemplateIndex = 0;
let currentSVG = "";
let currentTextColor = "#333333";

document.addEventListener("DOMContentLoaded", () => {
  populateTemplateThumbnails();
  changeTemplate(currentTemplateIndex);
  updateArrowVisibility();
  nameInput.addEventListener("input", () =>
    updateSVGText(nameInput.value, noteInput.value),
  );
  noteInput.addEventListener("input", () =>
    updateSVGText(nameInput.value, noteInput.value),
  );
  prevButton.addEventListener("click", showPreviousTemplate);
  nextButton.addEventListener("click", showNextTemplate);
  document
    .getElementById("downloadCardButton")
    .addEventListener("click", downloadCard);
  document
    .getElementById("shareCardButton")
    .addEventListener("click", shareCard);
  document
    .getElementById("downloadQRCodeButton")
    .addEventListener("click", generateQRCode);
  handleIncomingShare();
});

function populateTemplateThumbnails() {
  templateThumbnailsContainer.innerHTML = "";
  templates.forEach((template, index) => {
    const img = document.createElement("img");
    img.src = template.path;
    img.dataset.templatePath = template.path;
    img.dataset.templateColor = template.color;
    img.className =
      "template-thumbnail w-24 h-24 rounded-xl cursor-pointer hover:scale-105 hover:shadow-md transition transform object-cover border-2 border-gray-300";
    img.addEventListener("click", () => changeTemplate(index));
    templateThumbnailsContainer.appendChild(img);
  });
}

function changeTemplate(index) {
  if (index < 0 || index >= templates.length) return;
  currentTemplateIndex = index;
  const { path, color } = templates[index];
  fetch(path)
    .then((response) => (response.ok ? response.text() : Promise.reject()))
    .then((svgText) => {
      currentSVG = svgText;
      currentTextColor = color;
      updateSVGText(nameInput.value, noteInput.value);
      updateThumbnailSelection();
    })
    .catch(() => {
      svgContainer.innerHTML =
        '<p class="text-red-500 text-center p-4">Error loading template.</p>';
    });
}

function updateThumbnailSelection() {
  const thumbs = templateThumbnailsContainer.querySelectorAll(
    ".template-thumbnail",
  );
  thumbs.forEach((t, i) =>
    t.classList.toggle("selected", i === currentTemplateIndex),
  );
  const sel = thumbs[currentTemplateIndex];
  if (sel)
    sel.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
}

function updateArrowVisibility() {
  if (!prevButton || !nextButton) return;
  if (templates.length <= 1) {
    prevButton.style.display = "none";
    nextButton.style.display = "none";
  } else {
    prevButton.style.display = "flex";
    nextButton.style.display = "flex";
  }
}

function showPreviousTemplate() {
  currentTemplateIndex =
    (currentTemplateIndex - 1 + templates.length) % templates.length;
  changeTemplate(currentTemplateIndex);
}

function showNextTemplate() {
  currentTemplateIndex = (currentTemplateIndex + 1) % templates.length;
  changeTemplate(currentTemplateIndex);
}

function updateSVGText(name, note, textColor = currentTextColor) {
  if (!currentSVG) return;
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(currentSVG, "image/svg+xml");
    if (svgDoc.getElementsByTagName("parsererror").length > 0) {
      svgContainer.innerHTML =
        '<p class="text-red-500 text-center p-4">Error parsing SVG.</p>';
      return;
    }
    const svgElement = svgDoc.querySelector("svg");
    if (!svgElement) return;
    let width = 500,
      height = 800;
    const viewBox = svgElement.getAttribute("viewBox");
    if (viewBox) {
      const vals = viewBox.split(/\s+|,/).map(Number);
      if (vals.length === 4 && !vals.some(isNaN)) {
        width = vals[2];
        height = vals[3];
      }
    } else {
      const w = parseInt(svgElement.getAttribute("width"));
      const h = parseInt(svgElement.getAttribute("height"));
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    }
    svgElement.querySelectorAll(".custom-text").forEach((n) => n.remove());
    const nameY = height - height * 0.05;
    if (name && name.trim()) {
      const fs = (height * 0.037).toFixed(2);
      const el = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
      el.setAttribute("x", width / 2);
      el.setAttribute("y", nameY.toFixed(2));
      el.setAttribute("text-anchor", "middle");
  el.setAttribute("font-family", "li-shamim-chitranee");
      el.setAttribute("font-size", fs);
      el.setAttribute("fill", textColor);
      el.setAttribute("font-weight", "500");
      el.textContent = name;
      el.classList.add("custom-text");
      svgElement.appendChild(el);
    }
    if (note && note.trim()) {
      const noteFs = height * 0.035;
      const lines = note.split("\n");
      const startY = nameY - lines.length * noteFs * 1.2 - height * 0.05;
      lines.forEach((line, i) => {
        const el = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
        const y = startY + i * noteFs * 1.2;
        el.setAttribute("x", width / 2);
        el.setAttribute("y", y.toFixed(2));
        el.setAttribute("text-anchor", "middle");
  el.setAttribute("font-family", "li-shamim-chitranee");
        el.setAttribute("font-size", noteFs.toFixed(2));
        el.setAttribute("fill", textColor);
        el.setAttribute("font-weight", "400");
        el.textContent = line;
        el.classList.add("custom-text");
        svgElement.appendChild(el);
      });
    }
    const styleEl = svgDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "style",
    );
    styleEl.textContent =
      "@font-face{font-family:'li-shamim-chitranee';src:url('assets/Li Shamim Chitranee Unicode.ttf') format('truetype')}";
    svgElement.insertBefore(styleEl, svgElement.firstChild);
    svgElement.removeAttribute("width");
    svgElement.removeAttribute("height");
    const serializer = new XMLSerializer();
    svgContainer.innerHTML = serializer.serializeToString(
      svgDoc.documentElement,
    );
  } catch (e) {
    svgContainer.innerHTML =
      '<p class="text-red-500 text-center p-4">Error processing SVG.</p>';
  }
}

function generateQRCode() {
  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  if (!name) {
    return;
  }
  const templateId = currentTemplateIndex + 1;
  let shareUrl = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(name)}&id=${templateId}`;
  if (note) shareUrl += `&note=${encodeURIComponent(note)}`;
  const qr = new QRious({ value: shareUrl, size: 250 });
  const link = document.createElement("a");
  link.href = qr.toDataURL();
  link.download = "lamppost-card-qr-code.png";
  link.click();
}

function shareCard() {
  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  if (!name) {
    return;
  }
  const templateId = currentTemplateIndex + 1;
  let shareUrl = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(name)}&id=${templateId}`;
  if (note) shareUrl += `&note=${encodeURIComponent(note)}`;
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {})
    .catch(() => {
      if (navigator.share) {
        navigator
          .share({ title: "Lamppost Card", text: shareUrl })
          .catch(() => {});
      } else {
        try {
        } catch (e) {}
      }
    });
}

async function downloadCard() {
  const svgElement = svgContainer.querySelector("svg");
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  const fontUrl = "assets/Li Shamim Chitranee Unicode.ttf";
  const fontData = await fetch(fontUrl)
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return `data:font/woff2;base64,${base64}`;
    })
    .catch(() => null);

  if (fontData) {
    const fontFace = `@font-face{font-family:'li-shamim-chitranee';src:url('${fontData}') format('truetype')}`;
    svgString = svgString.replace("</style>", `${fontFace}</style>`);
  }

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const name = nameInput.value.trim();
  const templateId = currentTemplateIndex + 1;
  const filename = name
    ? `lamppost-card-${name.replace(/\s+/g, "-")}-${templateId}-${Date.now()}.png`
    : `lamppost-card-${templateId}-${Date.now()}.png`;

  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const viewBox = svgElement.getAttribute("viewBox");
      if (viewBox) {
        const [, , w, h] = viewBox.split(/\s+|,/).map(Number);
        canvas.width = w * 1.5;
        canvas.height = h * 1.5;
      } else {
        canvas.width = 2000;
        canvas.height = 3200;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = filename;
      link.click();
    } catch (e) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename.replace(/\.png$/, ".svg");
      link.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  img.onerror = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.replace(/\.png$/, ".svg");
    link.click();
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

function handleIncomingShare() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  const id = params.get("id");
  if (!name || !id) return;
  const template = templates[Number(id) - 1];
  if (!template) return;
  const editor = document.querySelector(".main-container");
  const receiver = document.createElement("div");
  receiver.id = "receiverContainer";
  receiver.className =
    "hidden flex justify-center items-center bg-gray-100 border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full max-w-md m-auto p-0";
  document.body.appendChild(receiver);
  editor.style.display = "none";
  receiver.style.display = "flex";
  fetch(template.path)
    .then((r) => (r.ok ? r.text() : Promise.reject()))
    .then((svgText) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = svgDoc.querySelector("svg");
      if (!svgEl) {
        receiver.innerHTML =
          '<p class="text-red-500 text-center p-4">Error loading template.</p>';
        return;
      }
      const viewBox = svgEl.getAttribute("viewBox");
      let w = 500,
        h = 800;
      if (viewBox) {
        const vals = viewBox.split(/\s+|,/).map(Number);
        if (vals.length === 4 && !vals.some(isNaN)) {
          w = vals[2];
          h = vals[3];
        }
      }
      const nameEl = svgDoc.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      const nameY = h - h * 0.05;
      nameEl.setAttribute("x", w / 2);
      nameEl.setAttribute("y", nameY.toFixed(2));
      nameEl.setAttribute("text-anchor", "middle");
  nameEl.setAttribute("font-family", "li-shamim-chitranee");
      nameEl.setAttribute("font-size", (h * 0.037).toFixed(2));
      nameEl.setAttribute("fill", template.color);
      nameEl.setAttribute("font-weight", "500");
      nameEl.textContent = name;
      svgEl.appendChild(nameEl);
      const note = params.get("note");
      if (note) {
        const noteFs = h * 0.035;
        const lines = note.split("\n");
        const startY = nameY - lines.length * noteFs * 1.2 - h * 0.05;
        lines.forEach((ln, i) => {
          const el = svgDoc.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
          );
          el.setAttribute("x", w / 2);
          el.setAttribute("y", (startY + i * noteFs * 1.2).toFixed(2));
          el.setAttribute("text-anchor", "middle");
          el.setAttribute("font-family", "li-shamim-chitranee");
          el.setAttribute("font-size", noteFs.toFixed(2));
          el.setAttribute("fill", template.color);
          el.setAttribute("font-weight", "400");
          el.textContent = ln;
          svgEl.appendChild(el);
        });
      }
      svgEl.setAttribute("width", `${w}px`);
      svgEl.setAttribute("height", `${h}px`);
      receiver.innerHTML = "";
      receiver.appendChild(svgEl);
    })
    .catch(() => {
      receiver.innerHTML =
        '<p class="text-red-500 text-center p-4">Error loading template.</p>';
    });
}
