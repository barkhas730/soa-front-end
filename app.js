var AUTH_URL = "https://lionfish-app-sptgr.ondigitalocean.app/auth";
var JSON_URL = "https://lionfish-app-sptgr.ondigitalocean.app/users";
var FILE_URL = "https://octopus-app-phhnx.ondigitalocean.app/files";
var uploadedImageUrl = "";

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

function saveSession(token, userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileId");
}

function redirectToLogin(message) {
    clearSession();
    setFlashMessage(message || "Ta dahin nevterne uu.");
    window.location.href = "login.html";
}

function isAuthFailure(result) {
    var message = result && result.data && result.data.message ? String(result.data.message) : "";
    return result && (result.status === 401 || result.status === 403 || /token|authorization|auth/i.test(message));
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
    if (!preview) {
        return;
    }

    if (imageUrl) {
        preview.src = imageUrl;
        preview.classList.remove("hidden");
    } else {
        preview.src = "";
        preview.classList.add("hidden");
    }
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
    if (!getStoredToken() || !getStoredUserId()) {
        redirectToLogin("Session oldsongui baina. Nevterne uu.");
    } else {
        validateStoredSession().then(function (isValid) {
            if (!isValid) {
                redirectToLogin("Token huchingui baina. Dahin nevterne uu.");
            }
        });
    }

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
                setImagePreview(uploadedImageUrl);
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
