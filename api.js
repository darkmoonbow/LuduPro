window.Api = {
    async getUserData(user_id) {
        const res = await fetch("https://rtdifkkdloqfiazlndez.supabase.co/functions/v1/get-user-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id })
        });

        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }

        return res.json();
    },

    async getForumData(username) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: "GET_FORUM_DATA", username },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }

                    if (response?.error) {
                        reject(new Error(response.error));
                        return;
                    }

                    resolve(response);
                }
            );
        });
    },

    async getItems(userID) {
        const res = await fetch(`https://api.luduvo.com/users/${userID}/inventory`);

        if (!res.ok) {
            throw new Error("Request failed");
        }

        return res.json();
    },

    async setBackground({ userId, deviceId, url }) {
        const res = await fetch("https://rtdifkkdloqfiazlndez.supabase.co/functions/v1/set-background", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                device_id: deviceId,
                background: {
                    type: "image",
                    image: url
                }
            })
        });

        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }

        return res.json();
    },

    async setPanels({ userId, deviceId, urls }) {
        const res = await fetch("https://rtdifkkdloqfiazlndez.supabase.co/functions/v1/set-panels", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                device_id: deviceId,
                panels: urls.map((url, i) => ({
                    id: i,
                    media_url: url
                }))
            })
        });

        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }

        return res.json();
    },

    async getLoggedInUserID() {
        const cachedUserID = localStorage.getItem("current_user_id");
        if (cachedUserID) return cachedUserID;

        const loggedInUserImageEl = Selectors.loggedInUserImage();
        if (!loggedInUserImageEl) return null;

        const loggedInPanelEl = loggedInUserImageEl.parentElement.parentElement;
        const usernameEl = Selectors.usernameFromPanel(loggedInPanelEl);

        const username = usernameEl.textContent?.trim()?.replace(/^@/, "");
        if (!username) return null;

        const res = await fetch(`https://api.luduvo.com/users?q=${username}`);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const user_id = data?.[0]?.id;

        localStorage.setItem("current_user_id", user_id);

        return user_id;
    }
};