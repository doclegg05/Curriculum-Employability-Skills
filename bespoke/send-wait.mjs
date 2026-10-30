// Sending takes a minute or two, so this says the click worked until the outcome is known.
// The dialog never claims arrival: only Sent to Britt does that.
const TITLE = 'Sending to Britt';
const BODY = 'Your click worked. This can take a minute or two, so there is no need to click Send again. You will see Sent to Britt when it arrives.';

function waitDialog() {
  let dialog = document.getElementById('sendWaitDialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'sendWaitDialog';
  dialog.className = 'send-wait';
  dialog.setAttribute('aria-labelledby', 'sendWaitTitle');
  dialog.setAttribute('aria-describedby', 'sendWaitBody');
  const title = document.createElement('h2');
  title.id = 'sendWaitTitle';
  title.textContent = TITLE;
  const body = document.createElement('p');
  body.id = 'sendWaitBody';
  body.textContent = BODY;
  const ok = document.createElement('button');
  ok.id = 'sendWaitOk';
  ok.type = 'button';
  ok.className = 'btn btn-primary';
  ok.textContent = 'OK';
  ok.onclick = () => dialog.close();
  dialog.append(title, body, ok);
  document.body.append(dialog);
  return dialog;
}

export function openSendWait() {
  const dialog = waitDialog();
  if (!dialog.open) dialog.showModal();
}

export function closeSendWait() {
  const dialog = document.getElementById('sendWaitDialog');
  if (dialog?.open) dialog.close();
}
