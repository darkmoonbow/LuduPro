const Api = window.Api;
const UI = window.UI;

const Selectors = {
    profileName: () =>
        Array.from(document.querySelectorAll("h1"))
            .find(el => !el.textContent.trim().startsWith("@")),

    profileAtName: () =>
        Array.from(document.querySelectorAll("h1"))
            .find(el => el.textContent.trim().startsWith("@")),

    netWorthLabel: () =>
        Array.from(document.querySelectorAll("span"))
            .find(e => e.textContent?.includes("Net Worth")),

    loggedInUserImage: () =>
        document.querySelector('img[alt*="User avatar"]'),

    usernameFromPanel: (root) =>
        Array.from(root.querySelectorAll("div"))
            .find(e => e.textContent.trim().startsWith("@")),

    aboutHeader: () =>
        Array.from(document.querySelectorAll("h3"))
            .find(el => el.textContent.includes("About")),

    dashboardHeadings: () =>
        Array.from(document.querySelectorAll("h3, h1"))
            .filter(el => !el.textContent.trim().startsWith("@"))
};

const ApprovedEmbedSites = new Set([
    "youtube.com",
    "youtu.be",
    "spotify.com",
    "open.spotify.com",
    "discord.com",
    "player.vimeo.com",
    "vimeo.com",
    "soundcloud.com",
    "w.soundcloud.com",
    "twitch.tv",
    "player.twitch.tv",
    "clips.twitch.tv",
    "kick.com",
    "dailymotion.com",
    "www.dailymotion.com"
]);

const supabaseClient = window._supabaseClient || ( 
   window._supabaseClient = window.supabase.createClient(
        "https://rtdifkkdloqfiazlndez.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZGlma2tkbG9xZmlhemxuZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjIxNDIsImV4cCI6MjA5MzQzODE0Mn0.PNyFWZdn9GeBSl9sZo5J2MsStDkExaMFT2XEVlwHF-Y"
    )
);

function getDeviceId() {
    let id = localStorage.getItem("device_id");

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("device_id", id);
    }

    return id;
}
getDeviceId();

class Alias {
    static Get(username) {
        const aliases = JSON.parse(localStorage.getItem("Aliases") || "{}");
        return aliases[username];
    }

    static Set(username, alias) {
        let aliases = JSON.parse(localStorage.getItem("Aliases") || "{}");
        if (!alias?.trim()) return;

        aliases[username] = alias;

        localStorage.setItem("Aliases", JSON.stringify(aliases))
    }
}






let forumPostsHandled = false;
let netWorthHandled = false;
let topbarHandled = false;
let panelsHandled = false;

let cachedProfileNameEl = null;
let cachedMain = null;
let cachedAtNameEl = null;
let cachedUserData = null;

let cachedUserID = null;
Api.getLoggedInUserID().then(id => {
    cachedUserID = id;
});




function getMediaType(url) {
    if (!url) return "unknown";

    const lower = url.toLowerCase();

    try {
        const cleanPath = new URL(url).pathname.toLowerCase();
        if (cleanPath.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v|ogg)$/)) {
            return "media";
        }
    } catch {
        
    }

    try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname
            .replace(/^www\./, "")
            .toLowerCase();

        const baseHost = host.split(".").slice(-2).join(".");

        if (
            ApprovedEmbedSites.has(host) ||
            ApprovedEmbedSites.has(baseHost)
        ) {
            return "embed";
        }

    } catch (err) {
        console.warn("Invalid URL passed to getMediaType:", url, err);
    }

    return "media";
}

const menu = new UI.Menu();
const topbar = new UI.TopBar();
const dataPanel = new UI.DataPanel();

function getReadableText(r, g, b) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
}

function parseRgb(rgbStr) {
    return rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
}

const style = document.createElement("style");
            style.textContent = `
            .panel {
                position: fixed;
                width: clamp(120px, 16vw, 300px);
                height: clamp(120px, 28vh, 300px);
                background: rgba(0, 0, 0, 0);
                z-index: 9999;
            }

            .left { left: 60px; }
            .right { right: 60px; }
            .top { top: 20px; }
            .bottom { bottom: 200px; }
            `;
            document.head.appendChild(style);


function runUpdate() {
    const path = document.location.pathname;

    if (path.includes("/profile")) {
        const username = UI.GetUsername();
        if (!username) return;

        const userId = UI.GetPageUserId();
        if (!userId) return;

        document.documentElement.style.zoom = "80%";

        if (!netWorthHandled) {
            netWorthHandled = true;

            Api.getItems(userId).then(data => {
                const items = data.items;

                if (items) {
                    const totalValue = items.reduce((acc, item) => {
                        return acc + item.price;
                    }, 0);

                    UI.injectDataPanelText(7, "Net Worth", totalValue);
                }
            });
        }

        if (!forumPostsHandled) {
            forumPostsHandled = true;

            Api.getForumData(username).then(data => {
                const summary = data.user_summary;

                const {
                    post_count,
                    likes_received
                } = summary ?? {};

                dataPanel.InjectDataPanel(8, "Forum Posts", post_count);
                dataPanel.InjectDataPanel(9, "Forum Reputation", likes_received);

            });

        }
        
        if (!cachedProfileNameEl) {
            cachedProfileNameEl = Selectors.profileName();
        } else {
            const alias = Alias.Get(username);
            cachedProfileNameEl.innerHTML = "";
            cachedProfileNameEl.style.display = "inline-flex";

            

            document.querySelectorAll('[data-slot="card"]').forEach(el => {
                const style = getComputedStyle(el);
                const bg = style.backgroundColor;

                
                const match = parseRgb(bg);
                if (!match) return;

                const [, r, g, b] = match.map(Number);
                const textColor = getReadableText(r, g, b);

                el.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.05)`;
                el.style.textShadow = "0px 4px 8px rgba(0, 0, 0, 0.5)";
                el.style.color = textColor;
            });

            if (!cachedUserData) {
                Api.getUserData(UI.GetPageUserId()).then(data => {
                    cachedUserData = data;
                })
            }

            if (cachedUserData?.is_verified) {
                const verifiedSvg = document.createElement("img");
                verifiedSvg.src = chrome.runtime.getURL("Assets/luduproChk.png");
                verifiedSvg.style.width = "48px";
                verifiedSvg.style.height = "48px";
                verifiedSvg.style.objectFit = "contain";
                verifiedSvg.style.flexShrink = "0";
                verifiedSvg.style.verticalAlign = "middle";
                verifiedSvg.style.marginRight = "8px";
                
                cachedProfileNameEl.appendChild(verifiedSvg);  
            } 

            cachedProfileNameEl.style.color = "#ffffff";
            cachedProfileNameEl.style.textShadow = "2px 2px 0 #000, 4px 4px 0 #000, 6px 6px 0 rgba(0,0,0,0.7)";

            const textNode = document.createTextNode(alias ?? username);
            cachedProfileNameEl.appendChild(textNode);   
            
        }

        if (!cachedMain) {
            cachedMain = document.querySelector("main");
        } else {
            const imageUrl = cachedUserData?.background?.image;

            if (cachedUserData?.background?.image && cachedMain) {
                cachedMain.style.backgroundImage =
                    `url(${cachedUserData.background.image})`;
                cachedMain.style.backgroundSize = "cover";
                cachedMain.style.backgroundPosition = "center";
                cachedMain.style.backgroundRepeat = "no-repeat";
            }
            

            if (!panelsHandled && cachedUserData) {
                panelsHandled = true;

                

                const main = document.querySelector("main");

                function createPanel(panelID, side, position) {
                    const panel = document.createElement("div");
                    panel.className = `panel ${side} ${position}`;

                    const panelData = cachedUserData?.panels[panelID];
                    if (!panelData) return;

                    const media_url = panelData.media_url;
                    const media_type = getMediaType(media_url);
                    
                    

                    if (media_type == "embed") {
                        panel.innerHTML = `
                        <iframe
                            class="clickablePanel"
                            width="100%"
                            height="100%"
                            src="${media_url}"
                            frameborder="0"
                            allowfullscreen>
                        </iframe>
                        `;
                    } else if (media_type == "media") {
                        console.log(media_type);
                        panel.style = `
                            background-image: url(${media_url});
                            background-size: contain;
                            background-position: center;
                            background-repeat: no-repeat;
                            
                        `;
                        //box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
                    }
                    main.appendChild(panel);
                }


                createPanel(0, "left", "top");
                createPanel(1, "left", "bottom");
                createPanel(2, "right", "top");
                createPanel(3, "right", "bottom");
            }

            

            UI.FormatBio();
        }

        const menuRoot = document.querySelector('[role="menu"]');
        if (!menuRoot) {
            menuHandled = false;
            return;
        }

        if (!cachedUserID) {
            return;
        }

        if (userId  != cachedUserID) {
                menu.InjectMenuSeparator(1);

                menu.InjectMenuItem(2, "Set Alias", () => {
                const username = UI.GetUsername();
                if (!username) return;

                const alias = prompt("Enter alias:");
                if (!alias?.trim()) return;

                Alias.Set(username, alias.trim());

                alert(`You have set the name to ${alias.trim()}`);
            });
            } 
            else { 
                menu.InjectMenuSeparator(1);

                menu.InjectMenuItem(6, "Set Background", () => {
                    const username = UI.GetUsername();
                    if (!username) return;

                    const dia = new UI.Dialog("Change background", "Right click GIF or image -> Copy image link");
                    dia.content = `
                        <p class="text-s text-red-500">Keep in mind that anyone else with LuduPro can see your background! Keep that in mind, otherwise you will be blacklisted from the extension if you choose something that breaks the Luduvo Terms of Service.</p>
                        <p class="text-xs text-muted-foreground">Paste the source URL for your image here</p>
                        <input data-slot="textarea" class="luduvoTextarea" placeholder="https://giphy.com/abcde/"></input></div>
                    `;

                    dia.onConfirm = async () => {
                        const value = dia.dialog.querySelector(".luduvoTextarea").value;
                        const url = ((value.startsWith("https://") || value.startsWith("data:")) ? value : "https://" + value).trim();

                        if (!url) return;

                        const { data } = await supabaseClient.auth.getSession();
                        const session = data.session;
                        
                        const device_id = getDeviceId();

                        await Api.setBackground({
                            userId,
                            deviceId: device_id,
                            url
                        });
                            
                            
                    };

                    dia.show();

                    
                });

                menu.InjectMenuItem(10, "Set Panels", () => {
                    const username = UI.GetUsername();
                    if (!username) return;

                    const panelsData = cachedUserData?.panels;

                    const dia = new UI.Dialog("Change background", "Right click GIF or image -> Copy image link");
                    dia.content = `
                        <p class="text-s text-red-500">
                            Keep in mind that anyone else with LuduPro can see your panels! Keep that in mind, otherwise you will be blacklisted from the extension if you choose something that breaks the Luduvo Terms of Service.
                        </p>

                        <p class="text-s text-muted-foreground">
                            You can use embed URLs and image/gif source URLs
                        </p>

                        <p class="text-xs text-muted-foreground">Paste the source URL for panel #1</p>
                        <input data-slot="textarea" class="luduvoTextarea" placeholder="https://giphy.com/abcde/" value="${panelsData?.[0]?.media_url ?? ""}"/>

                        <p class="text-xs text-muted-foreground">Paste the source URL for panel #2</p>
                        <input data-slot="textarea" class="luduvoTextarea" placeholder="https://youtube.com/embed/abcde/" value="${panelsData?.[1]?.media_url ?? ""}"/>

                        <p class="text-xs text-muted-foreground">Paste the source URL for panel #3</p>
                        <input data-slot="textarea" class="luduvoTextarea" placeholder="https://open.spotify.com/embed/track/abcde" value="${panelsData?.[2]?.media_url ?? ""}"/>

                        <p class="text-xs text-muted-foreground">Paste the source URL for panel #4</p>
                        <input data-slot="textarea" class="luduvoTextarea" placeholder="https://youtube.com/embed/abcde/" value="${panelsData?.[3]?.media_url ?? ""}"/>
                    `;

                    dia.onConfirm = async () => {
                        const inputs = dia.dialog.querySelectorAll(".luduvoTextarea");

                        const urls = Array.from(inputs)
                            .map(i => i.value.trim())
                            .filter(Boolean)
                            .map(v =>
                                (v.startsWith("https://") || v.startsWith("data:"))
                                    ? v
                                    : "https://" + v
                            );

                        if (urls.length === 0) return;

                        const { data } = await supabaseClient.auth.getSession();
                        const session = data.session;

                        const device_id = getDeviceId();

                        await Api.setPanels({
                            userId,
                            deviceId: device_id,
                            urls
                        });

                        cachedUserData = await UI.getUserData(userId);
                    };

                    dia.show();

                    
                });

                menu.InjectMenuItem(5, "Verify Account", async () => {
                const data = await getVerificationCode({
                    userId: GetPageUserId(),
                    deviceId: getDeviceId()
                });

                const dia = new UI.Dialog("User verification");

                if (data.hasCode) {
                    dia.content = "Your account is verified!";

                    localStorage.setItem("current_user_id", data.user_id); 
                } else {
                    dia.content = `Please put the following code in your bio and re-verify.\n${data.code}`;
                }

                dia.show();


            });
            }

    } else if (path.includes("/dashboard")) {
        const h3s = Selectors.dashboardHeadings();

        h3s.forEach(el => {
            const text = el.textContent;

            const alias = Alias.Get(text);
            if (!alias) return;
        
            el.textContent = alias;
        });
        
    } else if (path.includes("/marketplace")) {
        
    }

    topbar.InjectA(3, "/inventory", "Inventory")
}

let timeout = null;

const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(runUpdate, 150);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

