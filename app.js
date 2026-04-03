var AUTH_URL = "https://lionfish-app-sptgr.ondigitalocean.app/auth";
var JSON_URL = "https://lionfish-app-sptgr.ondigitalocean.app/users";
var FILE_URL = "https://octopus-app-phhnx.ondigitalocean.app/files";
var uploadedImageUrl = "";
var uploadedFilesCount = Number(localStorage.getItem("uploadedFilesCount") || "0");

if (typeof window !== "undefined") {
    window.frontendLoaded = true;
}

function showMessage(text) {
    var message = document.getElementById("message");
    if (message) {
        message.textContent = text || "";
    }
}

function setFlashMessage(text) {
    if (text) {
        localStorage.setItem("flashMessage", text);
    } else {
        localStorage.removeItem("flashMessage");
    }
}

function showFlashMessage() {
    var flashMessage = localStorage.getItem("flashMessage");
    if (flashMessage) {
        showMessage(flashMessage);
        localStorage.removeItem("flashMessage");
    }
}

function getStoredToken() {
    return localStorage.getItem("token");
}

function getStoredUserId() {
    return localStorage.getItem("userId");
}

function getStoredProfileId() {
    return localStorage.getItem("profileId");
}

function getStoredUsername() {
    return localStorage.getItem("username");
}

function saveSession(token, userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
}

function saveUsername(username) {
    localStorage.setItem("username", username);
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileId");
    localStorage.removeItem("username");
}

function redirectToLogin(message) {
    clearSession();
    setFlashMessage(message || "Ta dahin nevterne uu.");
    window.location.href = "login.html";
}

function isAuthFailure(result) {
    return result && (result.status === 401 || result.status === 403);
}

function parseJsonResponse(response) {
    return response.json().then(function (data) {
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    });
}

function registerUser(username, password) {
    return fetch(AUTH_URL + "/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    }).then(parseJsonResponse);
}

function loginUser(username, password) {
    return fetch(AUTH_URL + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    }).then(parseJsonResponse);
}

function validateStoredSession() {
    var token = getStoredToken();

    if (!token || !getStoredUserId()) {
        return Promise.resolve(false);
    }

    return fetch(AUTH_URL + "/validate", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(parseJsonResponse)
        .then(function (result) {
            return result.ok && result.data.valid === true;
        })
        .catch(function () {
            return false;
        });
}

function getProfileByUserId() {
    return fetch(JSON_URL + "/by-user?userId=" + getStoredUserId(), {
        headers: {
            "Authorization": "Bearer " + getStoredToken()
        }
    });
}

function saveProfile(payload) {
    var currentProfileId = getStoredProfileId();
    var method = currentProfileId ? "PUT" : "POST";
    var url = currentProfileId ? JSON_URL + "/" + currentProfileId : JSON_URL;

    return fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getStoredToken()
        },
        body: JSON.stringify(payload)
    });
}

function deleteProfile() {
    var profileId = getStoredProfileId();
    if (!profileId) {
        return Promise.reject(new Error("Ustgah profile alga baina."));
    }

    return fetch(JSON_URL + "/" + profileId, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + getStoredToken()
        }
    });
}

function uploadProfileImage(file) {
    var formData;

    if (!file) {
        return Promise.reject(new Error("Zurag songono uu."));
    }

    formData = new FormData();
    formData.append("file", file);

    return fetch(FILE_URL + "/upload", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + getStoredToken()
        },
        body: formData
    }).then(parseJsonResponse);
}

function setImagePreview(imageUrl) {
    var preview = document.getElementById("imagePreview");
    var placeholder = document.getElementById("imagePlaceholder");
    var uploadedLink = document.getElementById("uploadedLink");

    if (!preview) {
        return;
    }

    if (imageUrl) {
        preview.src = imageUrl;
        preview.classList.remove("hidden");
        if (placeholder) {
            placeholder.classList.add("hidden");
        }
        if (uploadedLink) {
            uploadedLink.href = imageUrl;
            uploadedLink.classList.remove("hidden");
        }
    } else {
        preview.src = "";
        preview.classList.add("hidden");
        if (placeholder) {
            placeholder.classList.remove("hidden");
        }
        if (uploadedLink) {
            uploadedLink.href = "#";
            uploadedLink.classList.add("hidden");
        }
    }
}

function getInitials(value) {
    var words = (value || "User").trim().split(/\s+/).filter(Boolean);

    if (!words.length) {
        return "U";
    }

    return words.slice(0, 2).map(function (word) {
        return word.charAt(0).toUpperCase();
    }).join("");
}

function updateSidebar(profile) {
    var sidebarName = document.getElementById("sidebarName");
    var sidebarRole = document.getElementById("sidebarRole");
    var sidebarUserMeta = document.getElementById("sidebarUserMeta");
    var avatarCircle = document.getElementById("avatarCircle");
    var displayName = (profile && profile.name) || getStoredUsername() || "Хэрэглэгч";
    var role = (profile && profile.bio) || "System User";

    if (sidebarName) {
        sidebarName.textContent = displayName;
    }

    if (sidebarRole) {
        sidebarRole.textContent = role;
    }

    if (sidebarUserMeta) {
        sidebarUserMeta.textContent = "ID: " + (getStoredUserId() || "-") + ((profile && profile.email) ? " | " + profile.email : "");
    }

    if (avatarCircle) {
        avatarCircle.textContent = getInitials(displayName);
    }
}

function setStatusBadge(elementId, text, tone) {
    var element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = text;
    element.className = "status-pill " + (tone || "warning");
}

function updateFilesCardMeta(text) {
    var filesCardValue = document.getElementById("filesCardValue");
    var filesCardMeta = document.getElementById("filesCardMeta");

    if (filesCardValue) {
        filesCardValue.textContent = uploadedFilesCount + " File" + (uploadedFilesCount === 1 ? "" : "s");
    }

    if (filesCardMeta && text) {
        filesCardMeta.textContent = text;
    }
}

function setDashboardView(viewId) {
    var views = document.querySelectorAll(".view-section");
    var links = document.querySelectorAll(".nav-link");
    var titles = {
        dashboardView: {
            title: "Lab Demo Dashboard",
            subtitle: "Системийн ерөнхий хэсэг"
        },
        profileView: {
            title: "Профайл",
            subtitle: "Хэрэглэгчийн мэдээлэл удирдах хэсэг"
        },
        fileView: {
            title: "File Manager",
            subtitle: "Зураг upload болон preview хэсэг"
        }
    };
    var currentTitle = titles[viewId] || titles.dashboardView;
    var viewTitle = document.getElementById("viewTitle");
    var viewSubtitle = document.getElementById("viewSubtitle");

    views.forEach(function (view) {
        view.classList.toggle("active", view.id === viewId);
    });

    links.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("data-view") === viewId);
    });

    if (viewTitle) {
        viewTitle.textContent = currentTitle.title;
    }

    if (viewSubtitle) {
        viewSubtitle.textContent = currentTitle.subtitle;
    }
}

function initializeDashboardUi() {
    var navLinks = document.querySelectorAll(".nav-link");

    updateSidebar(null);
    updateFilesCardMeta("Uploaded in this browser");
    setDashboardView("dashboardView");

    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            setDashboardView(link.getAttribute("data-view"));
        });
    });
}

function renderProfile(profile) {
    var profileInfo = document.getElementById("profileInfo");
    if (!profileInfo) {
        return;
    }

    profileInfo.textContent =
        "Profile ID: " + profile.id + "\n"
        + "User ID: " + profile.userId + "\n"
        + "Ner: " + profile.name + "\n"
        + "Email: " + profile.email + "\n"
        + "Taniltsuulga: " + (profile.bio || "") + "\n"
        + "Utas: " + (profile.phone || "") + "\n"
        + "Zurgiin holboos: " + (profile.imageUrl || "");

    updateSidebar(profile);
    updateFilesCardMeta(profile.imageUrl ? "Profile image linked" : "No uploaded image");

    if (document.getElementById("jsonCardValue")) {
        document.getElementById("jsonCardValue").textContent = "Connected";
    }

    if (document.getElementById("jsonCardMeta")) {
        document.getElementById("jsonCardMeta").textContent = "Profile data synced successfully";
    }
}

var registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        registerUser(username, password)
            .then(function (result) {
                showMessage((result.data && result.data.message) || "Burtguuleh huselt duussan.");
            })
            .catch(function () {
                showMessage("Burtguuleh huselt amjiltgui bolloo.");
            });
    });
}

var loginForm = document.getElementById("loginForm");
if (loginForm) {
    showFlashMessage();

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        loginUser(username, password)
            .then(function (result) {
                showMessage((result.data && result.data.message) || "Nevtreh huselt duussan.");
                if (result.data && result.data.token && result.data.userId) {
                    saveSession(result.data.token, result.data.userId);
                    saveUsername(username);
                    localStorage.removeItem("flashMessage");
                    window.location.href = "profile.html";
                }
            })
            .catch(function () {
                showMessage("Nevtreh huselt amjiltgui bolloo.");
            });
    });
}

var profileForm = document.getElementById("profileForm");
if (profileForm) {
    initializeDashboardUi();

    if (!getStoredToken() || !getStoredUserId()) {
        redirectToLogin("Session oldsongui baina. Nevterne uu.");
    } else {
        validateStoredSession().then(function (isValid) {
            if (!isValid) {
                redirectToLogin("Token huchingui baina. Dahin nevterne uu.");
            } else {
                setStatusBadge("soapStatus", "SOAP Auth: Active", "success");
                setStatusBadge("restStatus", "REST API: Active", "success");

                if (document.getElementById("soapCardValue")) {
                    document.getElementById("soapCardValue").textContent = "Active";
                }

                if (document.getElementById("soapCardMeta")) {
                    document.getElementById("soapCardMeta").textContent = "Token validated successfully";
                }
            }
        });
    }

    setStatusBadge("soapStatus", "SOAP Auth: Checking", "warning");
    setStatusBadge("restStatus", "REST API: Checking", "warning");

    document.getElementById("uploadZone").addEventListener("click", function () {
        document.getElementById("profileImage").click();
    });

    document.getElementById("profileImage").addEventListener("change", function () {
        if (this.files[0]) {
            showMessage("Songoson file: " + this.files[0].name);
        }
    });

    document.getElementById("uploadButton").addEventListener("click", function () {
        var file = document.getElementById("profileImage").files[0];
        uploadProfileImage(file)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Token huchingui baina. Dahin nevterne uu.");
                        return;
                    }

                    showMessage(result.data.message || "Zurag huulj chadsangui.");
                    return;
                }

                uploadedImageUrl = result.data.fileUrl || "";
                uploadedFilesCount += 1;
                localStorage.setItem("uploadedFilesCount", String(uploadedFilesCount));
                setImagePreview(uploadedImageUrl);
                updateFilesCardMeta(result.data.originalFileName || "File uploaded successfully");
                showMessage(result.data.message || "Zurag amjilttai huulagdlaa.");
            })
            .catch(function (error) {
                showMessage(error.message || "Zurag huulj chadsangui.");
            });
    });

    document.getElementById("loadButton").addEventListener("click", function () {
        getProfileByUserId()
            .then(parseJsonResponse)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Token huchingui baina. Dahin nevterne uu.");
                        return;
                    }

                    showMessage(result.data.message || "Profile duudaj chadsangui.");
                    return;
                }

                uploadedImageUrl = result.data.imageUrl || "";
                localStorage.setItem("profileId", result.data.id);
                document.getElementById("name").value = result.data.name || "";
                document.getElementById("email").value = result.data.email || "";
                document.getElementById("bio").value = result.data.bio || "";
                document.getElementById("phone").value = result.data.phone || "";
                setImagePreview(uploadedImageUrl);
                renderProfile(result.data);
                setDashboardView("profileView");
                showMessage("Profile amjilttai duudagdlaa.");
            })
            .catch(function () {
                showMessage("Profile duudaj chadsangui.");
            });
    });

    profileForm.addEventListener("submit", function (event) {
        var hadProfile;
        var payload;

        event.preventDefault();
        hadProfile = !!getStoredProfileId();
        payload = {
            userId: Number(getStoredUserId()),
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            bio: document.getElementById("bio").value,
            phone: document.getElementById("phone").value,
            imageUrl: uploadedImageUrl
        };

        saveProfile(payload)
            .then(parseJsonResponse)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Token huchingui baina. Dahin nevterne uu.");
                        return;
                    }

                    showMessage(result.data.message || "Profile hadgalj chadsangui.");
                    return;
                }

                uploadedImageUrl = result.data.imageUrl || uploadedImageUrl;
                localStorage.setItem("profileId", result.data.id);
                setImagePreview(uploadedImageUrl);
                renderProfile(result.data);
                setDashboardView("profileView");
                showMessage(hadProfile ? "Profile amjilttai shinechlegdlee." : "Profile amjilttai uuslee.");
            })
            .catch(function () {
                showMessage("Profile hadgalj chadsangui.");
            });
    });

    document.getElementById("deleteButton").addEventListener("click", function () {
        deleteProfile()
            .then(parseJsonResponse)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Token huchingui baina. Dahin nevterne uu.");
                        return;
                    }

                    showMessage(result.data.message || "Profile ustgaj chadsangui.");
                    return;
                }

                uploadedImageUrl = "";
                localStorage.removeItem("profileId");
                document.getElementById("profileForm").reset();
                document.getElementById("profileInfo").textContent = "";
                setImagePreview("");
                updateSidebar(null);
                if (document.getElementById("jsonCardValue")) {
                    document.getElementById("jsonCardValue").textContent = "Deleted";
                }
                if (document.getElementById("jsonCardMeta")) {
                    document.getElementById("jsonCardMeta").textContent = "Create a new profile to continue";
                }
                showMessage(result.data.message);
            })
            .catch(function (error) {
                showMessage(error.message || "Profile ustgaj chadsangui.");
            });
    });

    document.getElementById("logoutButton").addEventListener("click", function () {
        clearSession();
        window.location.href = "login.html";
    });
}
