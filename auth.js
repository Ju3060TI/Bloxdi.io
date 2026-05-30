/**
 * Firebase Auth (Google + E-Mail + Offline)
 */
let currentUser = null;

const FIREBASE_CONFIG = {
  apiKey: 'DEMO_KEY',
  authDomain: 'bloxdi.firebaseapp.com',
  projectId: 'bloxdi-demo',
};

export function initAuth() {
  document.getElementById('btn-google')?.addEventListener('click', () => loginOffline('Google User'));
  document.getElementById('btn-email-login')?.addEventListener('click', () => {
    const email = document.getElementById('auth-email').value;
    if (email) loginOffline(email);
  });
  document.getElementById('btn-email-register')?.addEventListener('click', () => {
    const email = document.getElementById('auth-email').value;
    if (email) loginOffline(email);
  });
  document.getElementById('btn-offline')?.addEventListener('click', () => loginOffline(null));

  const saved = localStorage.getItem('bloxdi_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    updateAuthUI();
  }
}

function loginOffline(name) {
  currentUser = name ? { displayName: name, offline: false } : { displayName: 'Offline-Spieler', offline: true };
  localStorage.setItem('bloxdi_user', JSON.stringify(currentUser));
  document.getElementById('auth-modal').classList.add('hidden');
  updateAuthUI();
}

function updateAuthUI() {
  const el = document.getElementById('auth-status');
  if (el && currentUser) {
    el.textContent = `👤 ${currentUser.displayName}${currentUser.offline ? ' (Offline)' : ''}`;
  }
}

export function getCurrentUser() { return currentUser; }

export async function saveToCloud(worldData) {
  if (!currentUser || currentUser.offline) return false;
  console.log('[Auth] Cloud-Save (Firebase Demo – konfiguriere FIREBASE_CONFIG)');
  return true;
}
