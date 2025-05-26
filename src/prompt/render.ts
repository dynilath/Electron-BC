const showIf = (el: HTMLElement, cond: boolean) => {
  el.style.display = cond ? '' : 'none'
}

// from https://stackoverflow.com/questions/3809401 with '.js' added
const userScriptRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,32}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\.js$/

const defaultConfirm = (value?: string) =>
  window.PromptAPI.sendResult({ ok: true, value })
const defaultCancel = () =>
  window.PromptAPI.sendResult({ ok: true, value: undefined })

function createButton (
  text: string | undefined,
  className: string,
  onclick: () => void
) {
  const btn = document.createElement('button')
  btn.className = className
  btn.textContent = text || 'OK'
  btn.onclick = onclick
  return btn
}

document.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('promptTitle')!
  const content = document.getElementById("promptMessage")!;
  const input = document.getElementById('promptInput')! as HTMLInputElement
  const inputLabel = document.getElementById('promptInputLabel')!
  const buttons = document.getElementById('promptButtons')!

  window.PromptAPI.onPrompt(data => {
    title.textContent = data.title || "";
    content.innerHTML = data.content || "";
    input.style.display = data.type === "input" ? "" : "none";
    input.value = data.defaultValue || "";
    input.placeholder = data.inputPlaceholder || "";
    buttons.innerHTML = "";

    showIf(title, !!data.title);
    showIf(content, !!data.content);
    showIf(input, data.type === "input");

    // 计算并调整窗口大小以适应内容
    setTimeout(() => {
      const titleHeight =
        title.style.display !== "none" ? title.scrollHeight + 20 : 0;
      const contentHeight =
        content.style.display !== "none" ? content.scrollHeight + 20 : 0;
      const inputHeight =
        input.style.display !== "none" ? input.offsetHeight + 20 : 0;
      const buttonsHeight = buttons.offsetHeight + 20;

      const totalHeight = Math.max(
        120,
        titleHeight + contentHeight + inputHeight + buttonsHeight + 40
      );
      const totalWidth = Math.max(320, Math.min(600, content.scrollWidth + 60));

      window.PromptAPI.resizeWindow(totalWidth, totalHeight);
    }, 50);

    if (data.type === "input") {
      const confirmBtn = createButton(
        data.confirmText || "OK",
        "confirm",
        () => {
          if (data.inputType === "userscript") {
            const error = userScriptRegex.test(input.value);
            if (!error) {
              if (data.inputError) {
                inputLabel.textContent = data.inputError;
                inputLabel.style.display = "";
              }
              input.focus();
              return;
            }
          }
          defaultConfirm(input.value);
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
  })
})
