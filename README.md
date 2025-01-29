
# Baremetal

A browser extension that empowers users to create highly customized new tab pages and browser themes.

## Features:

* **Unleash Your Creativity:** Design and implement your own unique new tab page using HTML, CSS, and JavaScript. Upload your `index.html`, `index.css`, `index.js`, and `background.js` files to bring your vision to life.
* **Enhanced Aesthetics (Firefox Only):** Personalize your browser’s visual appearance by setting custom themes.
* **Native Functionality Integration (Optional):** Seamlessly interact with native JavaScript functions within your extension scripts, unlocking powerful system-level APIs.

## Setup

### **Installation:**

1. Download the Baremetal browser extension/add-on from your browser’s official extension marketplace.
2. Install the extension to integrate it seamlessly into your browsing experience.

### **Access and Explore:**

- Open a new tab, where you'll find comprehensive documentation to guide you through the extension's usage and features.

## Creating a Custom New Tab Page

1. **Prepare Your New Tab Page Files:**
   - **index.html**: Contains the structure of your new tab page.
   - **index.css**: Handles the styles for your page.
   - **index.js**: Manages interactivity and functionality.
   - **background.js (Optional)**: Contains background scripts that run in the background.

2. **Upload Your Files:**
   - Press `Ctrl + Enter` to open the upload interface.
   - Drag and drop your files, or click to browse and upload them.

3. **Execution Order:**
   - The **index.html**, **index.css**, and **index.js** files will execute in the specified order to create your custom new tab page.
   - The **background.js** file will run as the extension's background script, so it should only include code designed for background tasks.

--- 

## Native Function Integration

Baremetal allows you to directly interact with native JavaScript functions defined in your system, providing access to advanced system-level APIs.

### **Installation and Configuration:**

1. **Download the Native App:**  
   Get the native app from the official GitHub releases page.

2. **Generate the Manifest:**  
   Run the following command in your terminal to generate the app's `manifest.json` file:  
   ```bash
   sudo baremetal /path/to/binary
   ```

3. **Install Globally:**  
   Move the native app binary to your system’s global binary directory:  
   ```bash
   sudo mv baremetal /path/to/binary
   ```  
   By default, `/path/to/binary` is `/usr/bin`. For the default setup, run:  
   ```bash
   sudo baremetal
   sudo mv baremetal /usr/bin
   ```

### **Define and Export Native Functions:**

1. **Modify the Configuration File:**  
   Open or create the `~/.config/baremetal/main.js` file.

2. **Define Native Functions:**  
   Add your desired native functions in this file, ensuring they are properly exported for use in browser scripts.
   ```javascript
   export function fun1(data) { // data = "hello from the browser"
     return "Hello from native function";
   }
   ```

### **Calling Native Functions in Browser Scripts:**

1. **Initialization:**  
   Use the following syntax to initialize native functions in your browser scripts:  
   ```javascript
   const [fun1, fun2] = NativeFunctions("fun1", "fun2");
   // or
   const [fun1, fun2] = new NativeFunctions("fun1", "fun2");
   ```

   - **Note:** Using `new NativeFunctions("fun1", "fun2")` creates a new instance of the native app, ideal for parallel execution. Without the `new` keyword, all function executions are queued sequentially, which may introduce delays for long-running operations.

2. **Calling Functions:**  
   All native functions return a promise that resolves with the function’s return value.
   ```javascript
   const result = await fun1("hello from the browser");
   console.log(result); // result = "Hello from native function"
   ```

### **Important Considerations:**

1. **Execution Context:**  
   Native functions are executed via the native app, ensuring a secure and controlled environment.

2. **Data Serialization:**  
   All arguments passed to native functions and any return values must be serializable in JSON format to ensure seamless data exchange.

---

## Shared State Between `background.js` and `index.js`

Data (state) can be shared between the background script and content script using a built-in utility like this:

```javascript
// Can be called in background.js and index.js like this:
const [setState, onChange] = SharedState("stateName");
```

- The `SharedState()` function takes a state name as an argument and returns two handler functions.  
- These handler functions can be used to manage state changes and updates, as shown below:

### **Set or Update State**
```javascript
setState("newValue");
// or
setState(oldValue => oldValue + 1);
```

### **Handle State Changes**
```javascript
onChange(newState => {
  // Perform actions based on the new state value
});
```
---

## Example / Guide  

We are going to implement a simple new tab page extension with the following features:  
- The new tab page will display a digital clock at the center of the page with a background wallpaper.  
- The wallpaper will be fetched using a native function.  

**index.html**  
```html
<h1>time</h1>
<h6>date</h6>
```  

**index.js**  
```javascript
const [setWall, onChange] = SharedState("wall");

const applyBackground = (newWall) => {
  document.body.style.backgroundImage = `url(${newWall.source})`;
};

// Set initial wallpaper and update on change
setWall((wall) => {
  applyBackground(wall);
  return wall;
});
onChange(applyBackground);

function updateDateTime() {
  const now = new Date();
  document.querySelector("h1").innerText = now.toLocaleTimeString("en-GB", {
    hour12: false,
  });
  document.querySelector("h6").innerText = now.toISOString().split("T")[0];
}

// Initial update and set interval for real-time updates
updateDateTime();
setInterval(updateDateTime, 1000);
```  

**index.css**  
```css
body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  margin: 0;
  font-size: 4rem;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;
}

* {
  margin: 0;
  padding: 0;
}
```  

**background.js**  
```javascript
const [getWallpaper] = NativeFunctions("getWallpaper");
let lastWallpaperMTime;
const setWallpaper = () =>
  getWallpaper(lastWallpaperMTime).then((wallpaper) => {
    lastWallpaperMTime = wallpaper.mTime;
    const [setWallpaperState] = SharedState("wall");
    setWallpaperState(wallpaper);
  }).then(setWallpaper);

setWallpaper();
```  

**~/.config/baremetal/main.js**  
```javascript
import * as os from "os";
import * as std from "std";

const cachePath = std.getenv("HOME") + "/.cache/baremetal/pathToWallpaper.txt";
export async function getWallpaper(lastMTime) {
  while (true) {
    // Check file stats
    const [fileStats, err] = os.stat(cachePath);
    if (err !== 0) {
      throw Error(`Failed to read ${cachePath} stats.\nError code: ${err}`);
    }
    // Skip if file hasn't changed
    if (lastMTime && fileStats.mtime <= lastMTime) {
      os.sleep(500);
      continue;
    }

    // Load and validate target file path
    const targetPath = std.loadFile(cachePath)?.trim();
    if (!targetPath) {
      throw Error(`Failed to read path from cache file: ${cachePath}`);
    }

    // Load and validate target file content
    const content = await execAsync(["base64", "-w", 0, targetPath]);

    return {
      mTime: fileStats.mtime,
      source: content,
    };
  }
}
```  
**Result**

https://github.com/user-attachments/assets/020ca07b-a40f-4b1b-a2fb-38b3f46e26df




