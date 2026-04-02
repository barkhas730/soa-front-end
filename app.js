var SOAP_URL = "https://soa-user-soap-ycgmc.ondigitalocean.app/ws";
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

function callSoap(operation, bodyXml) {
    var envelope = '<?xml version="1.0" encoding="UTF-8"?>'
        + '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:auth="http://lab06.com/usersoapservice/auth">'
        + '<soapenv:Header/>'
        + '<soapenv:Body>'
        + '<auth:' + operation + '>'
        + bodyXml
        + '</auth:' + operation + '>'
        + '</soapenv:Body>'
        + '</soapenv:Envelope>';

    return fetch(SOAP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/xml;charset=UTF-8"
        },
        body: envelope
    }).then(function (response) {
        return response.text();
    });
}

function getXmlValue(xmlText, tagName) {
    var regex = new RegExp("<(?:[A-Za-z0-9_-]+:)?" + tagName + ">([\\s\\S]*?)</(?:[A-Za-z0-9_-]+:)?" + tagName + ">", "i");
    var match = xmlText.match(regex);
    return match && match.length > 1 ? match[1] : "";
}

function registerUser(username, password) {
    var body = "<auth:username>" + username + "</auth:username>"
        + "<auth:password>" + password + "</auth:password>";

    return callSoap("RegisterUserRequest", body).then(function (xmlText) {
        return getXmlValue(xmlText, "message");
    });
}

function loginUser(username, password) {
    var body = "<auth:username>" + username + "</auth:username>"
        + "<auth:password>" + password + "</auth:password>";

    return callSoap("LoginUserRequest", body).then(function (xmlText) {
        return {
            message: getXmlValue(xmlText, "message"),
            token: getXmlValue(xmlText, "token"),
            userId: getXmlValue(xmlText, "userId")
        };
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
    }).then(function (response) {
        return response.json().then(function (data) {
            return {
                ok: response.ok,
                data: data
            };
        });
    });
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
        "Профайлын ID: " + profile.id + "\n"
        + "Хэрэглэгчийн ID: " + profile.userId + "\n"
        + "Нэр: " + profile.name + "\n"
        + "И-мэйл: " + profile.email + "\n"
        + "Танилцуулга: " + (profile.bio || "") + "\n"
        + "Утас: " + (profile.phone || "") + "\n"
        + "Зургийн холбоос: " + (profile.imageUrl || "");
}

var registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        registerUser(username, password)
            .then(function (message) {
                showMessage(message);
            })
            .catch(function () {
                showMessage("Бүртгүүлэх хүсэлт амжилтгүй боллоо.");
            });
    });
}

var loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        loginUser(username, password)
            .then(function (result) {
                showMessage(result.message);
                if (result.token && result.userId) {
                    saveSession(result.token, result.userId);
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
    if (!getStoredToken() || !getStoredUserId()) {
        window.location.href = "login.html";
    }

    document.getElementById("uploadButton").addEventListener("click", function () {
        var file = document.getElementById("profileImage").files[0];
        uploadProfileImage(file)
            .then(function (result) {
                if (!result.ok) {
                    showMessage(result.data.message || "Зураг хуулж чадсангүй.");
                    return;
                }

                uploadedImageUrl = result.data.fileUrl || "";
                setImagePreview(uploadedImageUrl);
                showMessage(result.data.message || "Зураг амжилттай хуулагдлаа.");
            })
            .catch(function (error) {
                showMessage(error.message || "Зураг хуулж чадсангүй.");
            });
    });

    document.getElementById("loadButton").addEventListener("click", function () {
        getProfileByUserId()
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, data: data };
                });
            })
            .then(function (result) {
                if (!result.ok) {
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
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, data: data };
                });
            })
            .then(function (result) {
                if (!result.ok) {
                    showMessage(result.data.message || "Профайлыг хадгалж чадсангүй.");
                    return;
                }

                uploadedImageUrl = result.data.imageUrl || uploadedImageUrl;
                localStorage.setItem("profileId", result.data.id);
                setImagePreview(uploadedImageUrl);
                renderProfile(result.data);
                showMessage(hadProfile ? "Профайл амжилттай шинэчлэгдлээ." : "Профайл амжилттай үүслээ.");
            })
            .catch(function () {
                showMessage("Профайлыг хадгалж чадсангүй.");
            });
    });

    document.getElementById("deleteButton").addEventListener("click", function () {
        deleteProfile()
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, data: data };
                });
            })
            .then(function (result) {
                if (!result.ok) {
                    showMessage(result.data.message || "Профайлыг устгаж чадсангүй.");
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
                showMessage(error.message || "Профайлыг устгаж чадсангүй.");
            });
    });

    document.getElementById("logoutButton").addEventListener("click", function () {
        clearSession();
        window.location.href = "login.html";
    });
}
