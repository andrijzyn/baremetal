const modal = document.getElementById("uploadModal");
const fileInput = document.getElementById("fileUpload");
const dropZone = document.getElementById("dropZone");

// Function to show modal
function showModal() {
  modal.classList.add("show");
}

// Function to hide modal
function hideModal() {
  modal.classList.remove("show");
}

// Function to handle file selection
function handleFiles(files) {
  const filesArray = Array.from(files);
  storeDataInIndexedDB("files", filesArray);
  window.location.reload();
}

// Event listeners
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#3b82f6";
  dropZone.style.backgroundColor = "#f8fafc";
};

dropZone.ondragleave = () => {
  dropZone.style.borderColor = "#e5e7eb";
  dropZone.style.backgroundColor = "transparent";
};

dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#e5e7eb";
  dropZone.style.backgroundColor = "transparent";
  handleFiles(e.dataTransfer.files);
};

modal.onclick = (e) => {
  if (e.target === modal) hideModal();
};

// ensures file type checking and loading order
const fileNames = ["background.js", "index.css", "index.html", "index.js"];

async function handleFileUpload(e) {
  const filesArray = Array.from(e.target.files);
  await storeDataInIndexedDB("files", filesArray);
  processFiles(filesArray);
}

function processFiles(filesArray, updateBackgroundScript) {
  for (const fileName of fileNames) {
    const files = filesArray.filter((file) => file.name === fileName);

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const content = e.target.result;
        await injectUserContent(
          content,
          file.name,
          updateBackgroundScript,
        );
      };
      reader.onerror = function (error) {
        console.error("Error reading file:", error);
        alert("Failed to read file. Check console for error.");
      };
      reader.readAsText(file);
    }
  }
}

async function injectUserContent(content, type, updateBackgroundScript = true) {
  try {
    switch (type) {
      case "index.js": {
        try {
          const userScript = new Function(content);
          await userScript();
        } catch (error) {
          console.error("Failed to inject index.js");
          throw error;
        }
        break;
      }

      case "index.html": {
        try {
          const tempElement = document.createElement("div");
          tempElement.innerHTML = content;
          const elementsToInject = Array.from(tempElement.childNodes); // Convert to array for safe iteration
          const body = document.body;
          elementsToInject.forEach((element) => {
            body.appendChild(element);
          });
        } catch (error) {
          console.error("Failed to inject html.");
          throw error;
        }
        break;
      }

      case "index.css": {
        try {
          const styleElement = document.createElement("style");
          styleElement.textContent = content;
          document.head.appendChild(styleElement);
        } catch (error) {
          console.error("Failed to inject css.");
          throw error;
        }
        break;
      }

      case "background.js": {
        const [_, setBgScript] = SharedState("bgScript");
        if (updateBackgroundScript) setBgScript(content);
        break;
      }

      default:
        console.error("Invalid content type:", type);
        return;
    }
  } catch (error) {
    console.error(`Error injecting ${type}:`, error);
  }
}
