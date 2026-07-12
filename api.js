const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQiM6ixf-CTIWwcuNHoosFbvrDzWmC056yRUGhTaWv0Nwxbm0dLeK3d5QVgqmS7P9G7A/exec';

function getToken()  { return localStorage.getItem('at_token')  || ''; }
function getClient() { return localStorage.getItem('at_client') || ''; }

async function api(action, params = {}) {
  const body = { action, token: getToken(), client: getClient(), params };
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'erreur_api');
  return json.data;
}
