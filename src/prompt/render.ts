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
  const message = document.getElementById('promptMessage')!
  const input = document.getElementById('promptInput')! as HTMLInputElement
  const inputLabel = document.getElementById('promptInputLabel')!
  const buttons = document.getElementById('promptButtons')!

  window.PromptAPI.onPrompt(data => {
    title.textContent = data.title || ''
    message.innerHTML = data.message || ''
    input.style.display = data.type === 'input' ? '' : 'none'
    input.value = data.defaultValue || ''
    input.placeholder = data.inputPlaceholder || ''
    buttons.innerHTML = ''

    showIf(title, !!data.title)
    showIf(message, !!data.message)
    showIf(input, data.type === 'input')

    if (data.type === 'input') {
      const confirmBtn = createButton(
        data.confirmText || 'OK',
        'confirm',
        () => {
          if (data.inputType === 'userscript') {
            const error = userScriptRegex.test(input.value)
            if (!error) {
              if (data.inputError) {
                inputLabel.textContent = data.inputError
                inputLabel.style.display = ''
              }
              input.focus()
              return
            }
          }
          defaultConfirm(input.value)
        }
      )
      const cancelBtn = createButton(
        data.cancelText || 'Cancel',
        'cancel',
        defaultCancel
      )
      buttons.appendChild(confirmBtn)
      buttons.appendChild(cancelBtn)
      input.onkeydown = e => {
        if (e.key === 'Enter') confirmBtn.click()
        if (e.key === 'Escape') cancelBtn.click()
      }
      input.focus()
    } else if (data.type === 'confirmCancel') {
      const confirmBtn = createButton(
        data.confirmText || 'OK',
        'confirm',
        defaultConfirm
      )
      const cancelBtn = createButton(
        data.cancelText || 'Cancel',
        'cancel',
        defaultCancel
      )
      buttons.appendChild(confirmBtn)
      buttons.appendChild(cancelBtn)
    } else if (data.type === 'info') {
      buttons.appendChild(
        createButton(data.confirmText || 'OK', 'confirm', defaultConfirm)
      )
    }
  })
})
