const showIf = (el: HTMLElement, cond: boolean) => {
  el.style.display = cond ? '' : 'none'
}

// from https://stackoverflow.com/questions/3809401 with '.js' added
const userScriptRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,32}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\.js$/

const ebcPackageRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,32}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\.ebcspkg$/;

const defaultConfirm = (value?: string) =>
  window.PromptAPI.sendResult({ ok: true, value });
const defaultCancel = () =>
  window.PromptAPI.sendResult({ ok: true, value: undefined });

function createButton(
  text: string | undefined,
  className: string,
  onclick: () => void
) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.textContent = text || "OK";
  btn.onclick = onclick;
  return btn;
}

document.addEventListener("DOMContentLoaded", () => {
  const title = document.getElementById("promptTitle")!;
  const content = document.getElementById("promptMessage")!;
  const input = document.getElementById("promptInput")! as HTMLInputElement;
  const inputLabel = document.getElementById("promptInputLabel")!;
  const buttons = document.getElementById("promptButtons")!;

  window.PromptAPI.onPrompt((data) => {
    title.textContent = data.title || "";
    content.innerHTML = data.content || "";
    input.style.display = data.type === "input" ? "" : "none";
    input.value = data.defaultValue || "";
    input.placeholder = data.inputPlaceholder || "";
    buttons.innerHTML = "";

    showIf(title, !!data.title);
    showIf(content, !!data.content);
    showIf(input, data.type === "input");

    const e_resize = () => {
      let height = 0;
      height += title.style.display !== "none" ? title.scrollHeight : 0;
      height += content.style.display !== "none" ? content.scrollHeight : 0;
      height +=
        inputLabel.style.display !== "none" ? inputLabel.offsetHeight : 0;
      height += input.style.display !== "none" ? input.offsetHeight : 0;
      height += buttons.offsetHeight;

      height += 20;
      height += 16 * 4;

      const totalHeight = Math.max(120, height);
      const totalWidth = Math.max(480, Math.min(600, content.scrollWidth + 80));

      window.PromptAPI.resizeWindow(totalWidth, totalHeight);
    };

    setTimeout(e_resize, 50);

    const showErr = (text: string) => {
      inputLabel.textContent = text;
      inputLabel.style.display = "";
      setTimeout(e_resize, 50);
    };

    const validateInput = () => {
      if (data.inputType === "userscript") {
        return userScriptRegex.test(input.value);
      } else if (data.inputType === "ebcspackage") {
        return ebcPackageRegex.test(input.value);
      } else {
        return true;
      }
    };

    if (data.type === "input") {
      const confirmBtn = createButton(
        data.confirmText || "OK",
        "confirm",
        () => {
          if (!validateInput()) {
            if (data.inputError) {
              showErr(data.inputError);
            }
            input.focus();
          } else {
            defaultConfirm(input.value);
          }
        }
      );
      const cancelBtn = createButton(
        data.cancelText || "Cancel",
        "cancel",
        defaultCancel
      );
      buttons.appendChild(confirmBtn);
      buttons.appendChild(cancelBtn);
      input.onkeydown = (e) => {
        if (e.key === "Enter") confirmBtn.click();
        if (e.key === "Escape") cancelBtn.click();
      };
      input.focus();
    } else if (data.type === "confirmCancel") {
      const confirmBtn = createButton(
        data.confirmText || "OK",
        "confirm",
        defaultConfirm
      );
      const cancelBtn = createButton(
        data.cancelText || "Cancel",
        "cancel",
        defaultCancel
      );
      buttons.appendChild(confirmBtn);
      buttons.appendChild(cancelBtn);
    } else if (data.type === "info") {
      buttons.appendChild(
        createButton(data.confirmText || "OK", "confirm", defaultConfirm)
      );
    }
  });
});
