class InjectableContainer {
        constructor(rootSelector) {
            this.rootSelector = rootSelector;
        }

        getRoot() {
            return document.querySelector(this.rootSelector);
        }

        Inject() {
            throw new Error("inject() must be implemented by a subclass")
        }
    }

    function decodeBio(str) {
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    }
window.UI = {
    Dialog: class Dialog {
        constructor(title, description = "", confirmText = "Confirm") {
            this.title = title, this.description = description, this.confirmText = confirmText;
        }
        content = "";
        onShow = async () => {};
        onClose = async () => {};
        onConfirm = async () => {};
        async show() {
            const dialog = document.createElement("div");
            const dialogCover = document.createElement("div");
            dialogCover.classList = "luduvoDialogCover"
            dialog.setAttribute("data-state", "open")
            dialog.setAttribute("role", "dialog")
            dialog.setAttribute("tabindex", "-1")
            dialog.classList = "luduvoDialog";
            dialog.innerHTML = `<div class="flex flex-col gap-2 text-center sm:text-left">
            <h2 role="title" class="text-lg leading-none font-semibold">${this.title}</h2>
            <p role="description" class="text-muted-foreground text-sm">${this.description}</p>
            </div>
            <div class="space-y-4">
                ${this.content}
            </div>
            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button role="cancelButton" class="luduvoButton" data-slot="dialog-close">${this.confirmText ? "Cancel" : "Okay"}</button>
                ${this.confirmText ? `<button role="confirmButton" class="luduvoButton red" data-slot="dialog-close">${this.confirmText}</button>` : ""}
            </div>
            <button type="button" data-slot="dialog-close" class="close"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-x "><path d="M18 6l-12 12"></path><path d="M6 6l12 12"></path></svg><span class="sr-only">Close</span></button>`;
            this.dialog = dialog;
            if (this.confirmText) dialog.querySelector(`[role="confirmButton"]`).addEventListener("click", this.onConfirm);
            dialog.querySelectorAll(`[data-slot="dialog-close"]`).forEach(i => {
                i.onclick = e => {
                    dialog.setAttribute("data-state", "closed");
                    this.onClose();
                    setTimeout(e => {
                        dialogCover.remove();
                    }, 220);
                }
            });
            this.onShow();
            document.body.appendChild(dialogCover);
            dialogCover.appendChild(dialog);
        }
    },

    InjectableContainer: InjectableContainer,

    DataPanel: class DataPanel extends InjectableContainer {
        constructor() {
            super('span');
        }

        getRoot() {
            const netWorthEl = Selectors.netWorthLabel();

            return netWorthEl?.parentElement?.parentElement?.parentElement;
        }

        InjectDataPanel(ID, title, value) {
            const root = this.getRoot();
            if (!root || document.querySelector(`[data-lududark="${ID}"]`)) return;

            const containerEl = document.createElement("div");
            containerEl.className = "flex flex-col items-center";

            containerEl.setAttribute("data-lududark", ID);

            const titleEl = document.createElement("span");
            titleEl.className = "font-semibold";
            titleEl.textContent = title;

            const rowEl = document.createElement("div");
            rowEl.className = "flex items-center gap-1";

            const emptySpanEl = document.createElement("span");

            const valueBoxEl = document.createElement("div");
            valueBoxEl.className = "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm";
            valueBoxEl.setAttribute("data-lududark", "7");
            valueBoxEl.textContent = value;

            rowEl.appendChild(emptySpanEl);
            rowEl.appendChild(valueBoxEl);

            containerEl.appendChild(titleEl);
            containerEl.appendChild(rowEl);

            root.querySelector("div")?.appendChild(containerEl);
        }
    },

    Menu: class Menu extends InjectableContainer {
        constructor() {
            super('[role="menu"]');
        }

        getRoot() {
            const root = document.querySelector(this.rootSelector);
            if (!root) return;

            const hasInventoryLink = Array.from(root.parentElement?.querySelectorAll("a[href]") || [])
                .some(el => el.getAttribute("href")?.includes("inventory"));

            if (hasInventoryLink) {
                return root;
            }
        }

        InjectMenuItem(ID, text, clickCallback) {
            const menu = this.getRoot()
            if (!menu) return;

            if (document.querySelector(`[data-lududark="${ID}"]`)) return;

            const item = document.createElement("div");
            item.setAttribute("role", "menuitem");
            item.setAttribute("data-slot", "dropdown-menu-item");
            item.setAttribute("data-lududark", ID);

            item.className =
                "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm";

            item.textContent = text;

            item.addEventListener("click", clickCallback);

            menu.appendChild(item);
        }

        InjectMenuSeparator(ID) {
            const menu = this.getRoot();
            if (!menu) return;

            if (document.querySelector(`[data-lududark="${ID}"]`)) return;

            const separator = document.createElement("div");
            separator.setAttribute("role", "separator");
            separator.setAttribute("aria-orientation", "horizontal");
            separator.setAttribute("data-lududark", ID);

            separator.className = "bg-border -mx-1 my-1 h-px";

            menu.appendChild(separator)
        }
    },

    TopBar: class TopBar extends InjectableContainer {
        constructor() {
            super('a[href="/marketplace"]');
        }

        getRoot() {
            this.button = document.querySelector(this.rootSelector);
            return this.button ? this.button.parentElement : null;
        }

        InjectA(ID, href, text) {
            const menu = this.getRoot()
            if (!menu) return;

            if (document.querySelector(`[data-lududark="${ID}"]`)) return;

            const item = document.createElement("a");
            item.setAttribute("href", href);
            item.setAttribute("role", "menuitem");
            item.setAttribute("data-lududark", ID);

            const hiddenSpan = document.createElement("span")
            hiddenSpan.className = "hidden md:block";
            hiddenSpan.textContent = text;
            item.appendChild(hiddenSpan);

            item.className =
                "flex items-center justify-center rounded-sm text-base font-medium outline-hidden select-none px-2 py-1 max-[420px]:px-1.5 max-[420px]:py-0.5";

            menu.appendChild(item);
        }
    },

    decodeBio,

    FormatBio() {
        const AboutEl = Selectors.aboutHeader();

        if (!AboutEl) return;

        const BioEl = AboutEl.parentElement;
        const BioTextEl = BioEl.querySelector("span");
        BioTextEl.className = "text-white text-lg drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]";

        if (!BioTextEl || BioTextEl?.dataset.formatted === "true") return;

        const decodedBioText = decodeBio(BioTextEl.innerHTML);

        const cleanBioText = DOMPurify.sanitize(decodedBioText, {
            ADD_TAGS: ['style']
        });
        BioTextEl.innerHTML = cleanBioText;

        BioTextEl.dataset.formatted = "true";
    },

    GetUsername() {
        const path = document.location.pathname;
        if (!path.includes("/profile")) return;

        const el = Selectors.profileAtName();

        if (!el) return null;

        return el.textContent.trim().slice(1);
    },

    GetPageUserId() {
        const path = document.location.pathname;
        const id = path.split("/").pop();

        return Number(id);
    },

    injectDataPanelText(id, title, value) {
        const netWorthEl = Selectors.netWorthLabel();

        if (!netWorthEl) return;

        const container = netWorthEl.closest("div")?.querySelector("div");
        if (!container) return;

        if (container.querySelector(`[data-lududark="${id}"]`)) return;

        const item = document.createElement("div");
        item.className =
            "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm";
        item.setAttribute("data-lududark", id);

        item.textContent = value;

        container.appendChild(item);
    }

};