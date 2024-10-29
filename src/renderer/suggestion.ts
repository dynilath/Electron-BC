const styleSrc = `
.ebc-suggestions {
    border: 1px solid #ccc;
    /* max-height: 150px; */
    overflow-y: auto;
    position: absolute;
    z-index: 1000;
    background-color: white;
    width: 200px;
    display: none;
    border-radius: 8px; 
    padding: 8px; 
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.ebc-suggestion-list {
    border:none;
    max-height: 200px;
}
.ebc-suggestion-item {
    padding: 8px;
    cursor: pointer;
}
.ebc-suggestion-item:hover {
    background-color: #f0f0f0;
}
`;

function createStyle() {
  const styleID = "ebc-suggestion-style";
  if (document.getElementById(styleID)) return;
  const style = document.createElement("style");
  style.id = styleID;
  style.innerHTML = styleSrc;
  document.head.appendChild(style);
}

class HTMLSuggestion {
  _main!: HTMLElement;
  _list!: HTMLElement;

  _follow?: HTMLInputElement;

  constructor(id: string) {
    const createElement = (id: string) => {
      this._main = document.createElement("div");
      this._main.id = id;
      this._main.classList.add("ebc-suggestion");
      this._list = document.createElement("div");
      this._list.id = id + "-list";
      this._list.classList.add("ebc-suggestion-list");
    };

    const main = document.getElementById(id);
    const list = document.getElementById(id + "-list");
    if (main && list) {
      this._main = main;
      this._list = list;
    } else {
      createElement(id);
    }
  }

  reShow() {
    if (this._main.style.display === "block") {
      this.show();
    }
  }

  update(suggestoins: string[], select: (src: string) => void) {
    this._list.innerHTML = "";
    for (const suggestion of suggestoins) {
      const item = document.createElement("div");
      item.classList.add("ebc-suggestion-item");
      item.innerText = suggestion;
      item.addEventListener("click", () => {
        select(suggestion);
        this._main.style.display = "none";
      });
      this._list.appendChild(item);
    }
  }

  show(input?: HTMLInputElement) {
    if (input) this._follow = input;

    if (!this._follow) return;

    const rect = this._follow.getBoundingClientRect();
    this._main.style.top = `${rect.bottom}px`;
    this._main.style.left = `${rect.left}px`;
    this._main.style.width = `${rect.width}px`;
    this._main.style.display = "block";
  }

  hide() {
    this._main.style.display = "none";
  }

  containsClick(event: Event) {
    return event.target && this._main.contains(event.target as Node);
  }
}

class Suggestions {
  _ele: HTMLSuggestion;
  constructor(
    input: HTMLInputElement,
    query: (src: string) => Promise<string[]>,
    select: (src: string) => void
  ) {
    this._ele = new HTMLSuggestion(input.id + "-suggestions");

    input.addEventListener("input", async () => {
      const src = input.value;
      const suggestions = await query(src);
      this._ele.show(input);
      this._ele.update(suggestions, select);
    });

    input.addEventListener("focus", () => {
      this._ele.show(input);
    });

    window.addEventListener("resize", () => {
      this._ele.reShow();
    });

    window.addEventListener("click", (event) => {
      if (!this._ele.containsClick(event)) this._ele.hide();
    });
  }
}

createStyle();
