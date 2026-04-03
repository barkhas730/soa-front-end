var AUTH_URL = "https://lionfish-app-sptgr.ondigitalocean.app/auth";
var JSON_URL = "https://lionfish-app-sptgr.ondigitalocean.app/users";
var FILE_URL = "https://octopus-app-phhnx.ondigitalocean.app/files";
var uploadedImageUrl = "";
var uploadedFilesCount = Number(localStorage.getItem("uploadedFilesCount") || "0");

if (typeof window !== "undefined") {
    window.frontendLoaded = true;
}

function showMessage(text) {
    var profilePanel = document.getElementById("profileMessagePanel");
    var filePanel = document.getElementById("fileMessagePanel");
    var profileMessage = document.getElementById("profileMessage");
    var fileMessage = document.getElementById("fileMessage");
    var activeView = document.querySelector(".view-section.active");
    var targetMessage = null;
    var targetPanel = null;

    if (profilePanel) {
        profilePanel.classList.add("hidden");
    }

    if (filePanel) {
        filePanel.classList.add("hidden");
    }

    if (activeView && activeView.id === "profileView") {
        targetMessage = profileMessage;
        targetPanel = profilePanel;
    } else if (activeView && activeView.id === "fileView") {
        targetMessage = fileMessage;
        targetPanel = filePanel;
    }

    if (targetMessage && targetPanel && text) {
        targetMessage.textContent = text;
        targetPanel.classList.remove("hidden");
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

function getStoredImageUrl() {
    return localStorage.getItem("imageUrl");
}

function saveSession(token, userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
}

function saveUsername(username) {
    localStorage.setItem("username", username);
}

function saveImageUrl(imageUrl) {
    if (imageUrl) {
        localStorage.setItem("imageUrl", imageUrl);
    } else {
        localStorage.removeItem("imageUrl");
    }
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileId");
    localStorage.removeItem("username");
    localStorage.removeItem("imageUrl");
}

function redirectToLogin(message) {
    clearSession();
    setFlashMessage(message || "Дахин нэвтэрнэ үү.");
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
        return Promise.reject(new Error("Устгах профайл алга байна."));
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
        return Promise.reject(new Error("Зураг сонгоно уу."));
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
    var sidebarAvatarImage = document.getElementById("sidebarAvatarImage");
    var displayName = (profile && profile.name) || getStoredUsername() || "Хэрэглэгч";
    var role = (profile && profile.bio) || "Системийн хэрэглэгч";
    var imageUrl = (profile && profile.imageUrl) || getStoredImageUrl();

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

    if (sidebarAvatarImage) {
        if (imageUrl) {
            sidebarAvatarImage.src = imageUrl;
            sidebarAvatarImage.classList.remove("hidden");
            avatarCircle.classList.add("hidden");
        } else {
            sidebarAvatarImage.src = "";
            sidebarAvatarImage.classList.add("hidden");
            avatarCircle.classList.remove("hidden");
        }
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
            subtitle: " "
        },
        profileView: {
            title: "Профайл",
            subtitle: "Хэрэглэгчийн мэдээлэл удирдах хэсэг"
        },
        fileView: {
            title: "Файл менежер",
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
    updateFilesCardMeta("Зөвхөн энэ browser дээр");
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
        + "Нэр: " + profile.name + "\n"
        + "Email: " + profile.email + "\n"
        + "Танилцуулга: " + (profile.bio || "") + "\n"
        + "Утас: " + (profile.phone || "") + "\n"
        + "Зургийн холбоос: " + (profile.imageUrl || "");

    updateSidebar(profile);
    saveImageUrl(profile.imageUrl || "");
    updateFilesCardMeta(profile.imageUrl ? "Профайлын зураг холбогдсон" : "Зураг одоогоор алга");

    if (document.getElementById("jsonCardValue")) {
        document.getElementById("jsonCardValue").textContent = "Холбогдсон";
    }

    if (document.getElementById("jsonCardMeta")) {
        document.getElementById("jsonCardMeta").textContent = "Профайлын өгөгдөл амжилттай синк хийгдлээ";
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
                showMessage((result.data && result.data.message) || "Бүртгүүлэх хүсэлт илгээгдлээ.");
            })
            .catch(function () {
                showMessage("Бүртгүүлэх хүсэлт амжилтгүй боллоо.");
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
                showMessage((result.data && result.data.message) || "Нэвтрэх хүсэлт илгээгдлээ.");
                if (result.data && result.data.token && result.data.userId) {
                    saveSession(result.data.token, result.data.userId);
                    saveUsername(username);
                    localStorage.removeItem("flashMessage");
                    window.location.href = "profile.html";
                }
            })
            .catch(function () {
                showMessage("Нэвтрэх хүсэлт амжилтгүй боллоо.");
            });
    });
}

var profileForm = document.getElementById("profileForm");
if (profileForm) {
    initializeDashboardUi();

    if (!getStoredToken() || !getStoredUserId()) {
        redirectToLogin("Session олдсонгүй. Нэвтэрнэ үү.");
    } else {
        validateStoredSession().then(function (isValid) {
            if (!isValid) {
                redirectToLogin("Токен хүчингүй байна. Дахин нэвтэрнэ үү.");
            } else {
                setStatusBadge("soapStatus", "SOAP Auth: Идэвхтэй", "success");
                setStatusBadge("restStatus", "REST API: Идэвхтэй", "success");

                if (document.getElementById("soapCardValue")) {
                    document.getElementById("soapCardValue").textContent = "Идэвхтэй";
                }

                if (document.getElementById("soapCardMeta")) {
                    document.getElementById("soapCardMeta").textContent = "Токен амжилттай баталгаажлаа";
                }
            }
        });
    }

    setStatusBadge("soapStatus", "SOAP Auth: Шалгаж байна", "warning");
    setStatusBadge("restStatus", "REST API: Шалгаж байна", "warning");

    document.getElementById("uploadZone").addEventListener("click", function () {
        document.getElementById("profileImage").click();
    });

    document.getElementById("profileImage").addEventListener("change", function () {
        if (this.files[0]) {
            showMessage("Сонгосон файл: " + this.files[0].name);
        }
    });

    document.getElementById("uploadButton").addEventListener("click", function () {
        var file = document.getElementById("profileImage").files[0];
        uploadProfileImage(file)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Токен хүчингүй байна. Дахин нэвтэрнэ үү.");
                        return;
                    }

                    showMessage(result.data.message || "Зураг хуулж чадсангүй.");
                    return;
                }

                uploadedImageUrl = result.data.fileUrl || "";
                saveImageUrl(uploadedImageUrl);
                uploadedFilesCount += 1;
                localStorage.setItem("uploadedFilesCount", String(uploadedFilesCount));
                setImagePreview(uploadedImageUrl);
                updateSidebar({ imageUrl: uploadedImageUrl });
                updateFilesCardMeta(result.data.originalFileName || "Файл амжилттай хууллаа");
                showMessage(result.data.message || "Зураг амжилттай хуулагдлаа.");
            })
            .catch(function (error) {
                showMessage(error.message || "Зураг хуулж чадсангүй.");
            });
    });

    document.getElementById("loadButton").addEventListener("click", function () {
        getProfileByUserId()
            .then(parseJsonResponse)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Токен хүчингүй байна. Дахин нэвтэрнэ үү.");
                        return;
                    }

                    showMessage(result.data.message || "Профайл дуудаж чадсангүй.");
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
                showMessage("Профайл амжилттай дуудагдлаа.");
            })
            .catch(function () {
                showMessage("Профайл дуудаж чадсангүй.");
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
                        redirectToLogin(result.data.message || "Токен хүчингүй байна. Дахин нэвтэрнэ үү.");
                        return;
                    }

                    showMessage(result.data.message || "Профайл хадгалж чадсангүй.");
                    return;
                }

                uploadedImageUrl = result.data.imageUrl || uploadedImageUrl;
                localStorage.setItem("profileId", result.data.id);
                setImagePreview(uploadedImageUrl);
                renderProfile(result.data);
                setDashboardView("profileView");
                showMessage(hadProfile ? "Профайл амжилттай шинэчлэгдлээ." : "Профайл амжилттай үүслээ.");
            })
            .catch(function () {
                showMessage("Профайл хадгалж чадсангүй.");
            });
    });

    document.getElementById("deleteButton").addEventListener("click", function () {
        deleteProfile()
            .then(parseJsonResponse)
            .then(function (result) {
                if (!result.ok) {
                    if (isAuthFailure(result)) {
                        redirectToLogin(result.data.message || "Токен хүчингүй байна. Дахин нэвтэрнэ үү.");
                        return;
                    }

                    showMessage(result.data.message || "Профайл устгаж чадсангүй.");
                    return;
                }

                uploadedImageUrl = "";
                saveImageUrl("");
                localStorage.removeItem("profileId");
                document.getElementById("profileForm").reset();
                document.getElementById("profileInfo").textContent = "";
                setImagePreview("");
                updateSidebar(null);
                if (document.getElementById("jsonCardValue")) {
                    document.getElementById("jsonCardValue").textContent = "Deleted";
                }
                if (document.getElementById("jsonCardMeta")) {
                    document.getElementById("jsonCardMeta").textContent = "Шинэ профайл үүсгэнэ үү";
                }
                showMessage(result.data.message);
            })
            .catch(function (error) {
                showMessage(error.message || "Профайл устгаж чадсангүй.");
            });
    });

    document.getElementById("logoutButton").addEventListener("click", function () {
        clearSession();
        window.location.href = "login.html";
    });
}
