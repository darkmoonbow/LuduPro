chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_FORUM_DATA") {
        fetch(`https://forum.luduvo.com/u/${msg.username}/summary.json`)
            .then(r => r.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({error: err.message}));
        
        return true;
    }
});