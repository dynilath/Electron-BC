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

export class Suggestions {
  static init(
    input: HTMLInputElement,
    query: (src: string) => Promise<string[]>,
    select: (src: string) => void
  ) {
    const _ele = new HTMLSuggestion(input.id + "-suggestions");

    input.addEventListener("input", async () => {
      const src = input.value;
      const suggestions = await query(src);
      _ele.show(input);
      _ele.update(suggestions, select);
    });

    input.addEventListener("focus", () => {
      _ele.show(input);
    });

    window.addEventListener("resize", () => {
      _ele.reShow();
    });

    window.addEventListener("click", (event) => {
      if (!_ele.containsClick(event)) _ele.hide();
    });
  }
}
