// 1. Live Real-Time Clock
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Format for status bar and lock screen
    const timeString = `${hours}:${minutes}`;
    document.getElementById('current-time').innerText = timeString;
    document.getElementById('clockTime').innerText = timeString;

    // Format Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('clockDate').innerText = now.toLocaleDateString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// 2. Unlock Gesture (Swipe up or click lock screen)
const lockScreen = document.getElementById('lockScreen');
const homeScreen = document.getElementById('homeScreen');

lockScreen.addEventListener('click', () => {
    lockScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
});

// 3. App Navigation Logic
const appModal = document.getElementById('appModal');
const appContent = document.getElementById('appContent');

function openApp(appName) {
    homeScreen.classList.add('hidden');
    appModal.classList.remove('hidden');
    
    if (appName === 'photos') {
        appContent.innerHTML = `<h2>Photo Gallery</h2><div class="gallery">📷 Photo 1 📷 Photo 2</div>`;
    } else if (appName === 'chat') {
        appContent.innerHTML = `<h2>Chat Simulation</h2><p>Tap anywhere to chat!</p>`;
    }
}

function closeApp() {
    appModal.classList.add('hidden');
    homeScreen.classList.remove('hidden');
}