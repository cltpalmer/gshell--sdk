import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';


const baseURL = "https://api.gshell.cloud";

export const gShell = {
  registerUser,
  loginUser,
  
  getPublicUserRows,
  getPublicRow,
  deletePublicRow,
  updatePublicRow,

  addMyRow,
  getMyRow,
  getAllMyRows,
  updateMyRow,
  getMyRow,
  uploadMyRow,
  deleteMyRow,

  refreshMyRow,

  logoutUser,
};




export function autoParseLists(rows, columnTypes = {}) {
  if (!Array.isArray(rows)) {
    console.error("❌ autoParseLists expected array but got:", rows);
    return []; 
  }

  return rows.map((row) => {
    const parsed = { ...row };

    for (const [key, type] of Object.entries(columnTypes)) {
      if (type === 'list' && key in parsed) {
        const value = parsed[key];

        if (typeof value === 'string') {
          // ✅ Handle empty strings
          if (!value || value.trim() === '') {
            parsed[key] = [];
            continue;
          }

          try {
            const parsedValue = JSON.parse(value);
            parsed[key] = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
          } catch (e) {
            console.warn(`⚠️ Failed to parse list field "${key}":`, value);
            console.warn(`⚠️ Parse error:`, e.message);
            parsed[key] = value.split(',').map(s => s.trim()).filter(Boolean);
          }

        } else if (Array.isArray(value)) {
          parsed[key] = value; // ✅ Already valid list
          
        } else if (typeof value === 'object' && value !== null) {
          parsed[key] = [value]; // ✅ Wrap object in array
          
        } else {
          parsed[key] = value ? [value] : [];
        }
      }
    }

    return parsed;
  });
}



//subUser Tools

//RegisterUser
export async function registerUser({ accessKey, formData, role = "customer" }) {
  const res = await fetch(`${baseURL}/user-access/auth/register/${accessKey}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role,
      row: formData
    })
  });

  const raw = await res.text();
  console.log("🧾 Raw response:", raw);
  console.log("📊 Response status:", res.status);
  console.log("📋 Response headers:", res.headers);

  // Check if response is empty
  if (!raw || raw.trim() === '') {
    throw new Error("❌ Empty response from server");
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    console.error("❌ Raw response that failed to parse:", raw);
    throw new Error(`❌ Invalid JSON response from server: ${raw.substring(0, 100)}`);
  }

  if (!json.success) throw new Error(json.message || "Registration failed");
  return json.data;
}

//LoginUser
export async function loginUser({ username, password, accessKey }) {
  if (!accessKey) throw new Error("AccessKey is required.");

  const res = await fetch(`${baseURL}/user-access/user-login/access/${accessKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Login failed");

  return json.data;
}

// LogoutUser
export async function logoutUser() {
  try {
    const res = await fetch(`${baseURL}/user-access/logout`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Logout failed");
    
    return true; // ✅ Just return a boolean!
  } catch (err) {
    console.error("❌ Failed to logout:", err);
    return false;
  }
}



// 🌐 Updated SDK - v2 getMyRow
export async function getMyRow({ accessKey, sheetName, matchWith, baseUrl = baseURL }) {
  if (!accessKey || !sheetName) {
    throw new Error("Missing required fields: accessKey and sheetName");
  }

  const params = new URLSearchParams();
  if (matchWith) params.set("matchWith", matchWith); // 👈 inject if present

  const url = `${baseUrl}/user-access/user-row/${accessKey}/${sheetName}?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "❌ Failed to fetch user row");
  }

  return json.data;
}

// 🌐 Updated SDK - v2 getAllMyRows
export async function getAllMyRows({
  accessKey,
  sheetName,
  filters = {},
  baseUrl = baseURL
}) {
  if (!accessKey || !sheetName) throw new Error("Missing required fields");

  const params = new URLSearchParams({ mode: "all" });

  // 🧠 Add flexible filters
  Object.entries(filters).forEach(([key, val]) => {
    if (val != null) params.append(key, val);
  });

  const url = `${baseUrl}/user-access/user-row/${accessKey}/${sheetName}?${params.toString()}`;

  const res = await fetch(url, { method: "GET", credentials: "include" });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// 🌐 Updated SDK - v2 addMyRow
export async function addMyRow({
  accessKey,
  sheetName,
  row,
  baseUrl = baseURL,
  options = {}
}) {
  if (!accessKey || !sheetName || !row) {
    throw new Error("Missing required fields: accessKey, sheetName, and row");
  }

  const {
    usernameField,
    mergeUserRows = false,
    mergeKey = null,
    mergeAction = "replace",
    incrementField = "quantity",
    appendField = "items",
    skipMerge = false
  } = options;

  const url = `${baseUrl}/user-access/user-row/${accessKey}/add/${sheetName}`;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      row,
      usernameField,
      mergeUserRows,
      mergeKey,
      mergeAction,
      incrementField,
      appendField,
      skipMerge
    })
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "❌ Failed to add row");
  }

  return json.data;
}

// 🌐 Updated SDK - v2 updateMyRow
export async function updateMyRow({ accessKey, sheetName, updates, baseUrl = baseURL }) {
  if (!accessKey || !sheetName) {
    throw new Error("Missing required fields: accessKey and sheetName");
  }

  const patchUrl = `${baseUrl}/user-access/user-row/${accessKey}/${sheetName}`;

  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ updates })
  });

  const patchJson = await patchRes.json();
  if (!patchJson.success) {
    throw new Error(patchJson.message || "❌ Failed to update user row");
  }

  return patchJson.data;
}

// 🌐 Updated SDK - v2 deleteMyRow
export async function deleteMyRow({
  accessKey,
  sheetName,
  mode,
  field,
  value,
  baseUrl = baseURL
}) {
  const res = await fetch(`${baseUrl}/user-access/user-row/${accessKey}/${sheetName}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mode, field, value })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// 🌐 Updated SDK - v2 uploadMyImage
/**
 * @param {Object} options
 * @param {string} options.accessKey - The accessKey for the current session
 * @param {string} options.sheetName - The sheet where the image should be stored
 * @param {File} options.file - The image file (from input[type="file"])
 * @param {string} options.column - Column in the sheet to store the image URL (must be type 'image')
 * @returns {Promise<string>} - Returns the uploaded image URL
 */
export async function uploadMyRow({ accessKey, sheetName, file, column }) {
  if (!accessKey || !sheetName || !file || !column) {
    throw new Error("❌ Missing required fields: accessKey, sheetName, file, or column");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("column", column);

  const res = await fetch(`${baseURL}/user-access/user-row/${accessKey}/${sheetName}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "❌ Failed to upload image");

  return json.url; // 🖼️ Use this in your UI if needed
}






// WIP 🧼 SDK Helper to refresh the current user's row
export async function refreshMyRow({ accessKey, sheetName }) {
  const res = await fetch(`${baseURL}/user-access/user-row/${accessKey}/${sheetName}`, {
    method: 'GET',
    credentials: 'include'
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return json.data;
}


//----

//publicTools


// 🌐 Updated SDK - v2 getPublicUserRows (Multiple Rows)
export async function getPublicUserRows({
  accessKey,
  sheetName,
  matchWith,
  matchValue,
  mode = "all",
  baseUrl = baseURL
}) {
  if (!accessKey || !sheetName) {
    throw new Error("Missing accessKey or sheetName");
  }

  const params = new URLSearchParams();
  if (matchWith && matchValue) {
    params.set("matchWith", matchWith);
    params.set("matchValue", matchValue);
  }
  if (mode) params.set("mode", mode);

  const url = `${baseUrl}/user-access/user-row/${accessKey}/${sheetName}/public?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "❌ Failed to fetch public user rows");

  return json.data;
}


// 🌐 Updated SDK - v2 updatePublicRow
export async function updatePublicRow({
  accessKey,
  sheetName,
  rowId,
  updates,
  role = "customer",
  baseUrl = baseURL
}) {
  if (!accessKey || !sheetName || !rowId || !updates) {
    throw new Error("Missing required fields: accessKey, sheetName, rowId, and updates");
  }

  const res = await fetch(`${baseUrl}/user-access/public-row/${accessKey}/${sheetName}/${rowId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      updates,
      role
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}


// 🌐 Updated SDK - v2 getPublicRow (1)
export async function getPublicRow({ accessKey, sheetName, matchWith, matchValue, baseUrl = baseURL }) {
  if (!accessKey || !sheetName) {
    throw new Error("Missing accessKey or sheetName");
  }

  const params = new URLSearchParams();
  if (matchWith && matchValue) {
    params.set("matchWith", matchWith);
    params.set("matchValue", matchValue);
  }

  const url = `${baseUrl}/user-access/public-row/${accessKey}/${sheetName}?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "❌ Failed to fetch public row");

  return json.data;
}




// WIP 🧼  SDK - v1 deletePublicRow
export async function deletePublicRow({
  accessKey,
  sheetName,
  uuid,       // ✅ Their uuid (required if rowId isn't given)
  rowId,      // ✅ Their rowId (preferred if already known)
  field,      // e.g. "friends"
  value,      // value to remove (your uuid)
  role = "customer",
  baseUrl = baseURL
}) {
  if (!accessKey || !sheetName || !field || typeof value === "undefined") {
    throw new Error("Missing required fields");
  }

  // 🛠️ Send patch request to backend
  const res = await fetch(`${baseUrl}/user-access/public-row/${accessKey}/${sheetName}/${rowId}/remove-from-array`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, value, role })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}



  








