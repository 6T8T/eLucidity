let editMode = false;
let pressTimer = null;
let holdThreshold = 1000;
let held = false;

let closeBarHeld = false;
let closeBarTimer = null;
const closeBarThreshold = 500;


// Recent Apps Management
let recentApps = []; // Use a Set to avoid duplicates
const recentAppTimestamps = {}; // { panel-id: timestamp }


// Load recent apps from localStorage
const storedTimestamps = localStorage.getItem('recentAppTimestamps');
if (storedTimestamps) {
  Object.assign(recentAppTimestamps, JSON.parse(storedTimestamps));
}

const previewStateHandlers = {
  'panel-weather': function(preview) {
    const weatherPanel = preview.querySelector('#panel-weather');
    if (weatherPanel) {
      weatherPanel.classList.remove('hidden');
      weatherPanel.querySelectorAll('.weather-container, .location-info, .current-weather, .weather-detail-grid, .hourly-forecast, .daily-forecast, .air-quality').forEach(el => {
        el.classList.remove('hidden');
        el.style.display = '';
      });
    }
  }
};

previewStateHandlers['panel-messages'] = function(preview) {
  const realPanel = document.getElementById('panel-messages');

  const chatVisible = !realPanel.querySelector('#messages-chat')?.classList.contains('hidden');
  const threadsVisible = !realPanel.querySelector('#messages-threads')?.classList.contains('hidden');

  const previewChat = preview.querySelector('#messages-chat');
  const previewThreads = preview.querySelector('#messages-threads');

  if (chatVisible) {
    previewChat?.classList.remove('hidden');
    previewThreads?.classList.add('hidden');
    preview.querySelector('#chat-visible-section')?.classList.remove('hidden');
    preview.querySelectorAll('.chat-body')?.forEach(el => el.classList.remove('hidden'));

    const realName = realPanel.querySelector('.contact-name')?.textContent;
    const realAvatar = realPanel.querySelector('.contact-avatar')?.src;
    const previewName = preview.querySelector('.contact-name');
    const previewAvatar = preview.querySelector('.contact-avatar');

    if (previewName && realName) previewName.textContent = realName;
    if (previewAvatar && realAvatar) previewAvatar.src = realAvatar;

  } else {
    previewThreads?.classList.remove('hidden');
    previewChat?.classList.add('hidden');
  }
};




// 🔄 Default preview state handler - SETTINGS
previewStateHandlers['panel-settings'] = function(preview) {
  const pages = preview.querySelectorAll('.settings-page');
  if (pages.length > 0) {
    pages.forEach(page => page.classList.remove('hidden'));
  } else {
    // Fallback: unhide the preview itself if no settings-page exists
    preview.classList.remove('hidden');
  }
};




const threads = [
  {
      id: 'kai',
      name: 'Neo • Kai',
      message: 'Hey, want to meet?',
      avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  },
  {
      id: 'astra',
      name: 'Astra',
      message: 'Catch you at the docks?',
      avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  },
  {
      id: 'sol',
      name: 'Sol',
      message: 'I sent the files.',
      avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  },
  {
      id: 'kookie',
      name: 'Kookie',
      message: 'I sent the files but Im not sure how well they will transfer over the wifi that we have. ive been having trouble for a few weeks now and its starting to cause a big issue with the',
      avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  },
  {
    id: 'mark',
    name: 'Mark',
    message: 'Just checking in.',
    avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  },
  {
    id: 'blue',
    name: 'Blue',
    message: 'Almost there.',
    avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  },
  {
    id: 'mikey',
    name: 'Mikey',
    message: 'I know.',
    avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'
  }
];


// App Icon Interaction
function initAppIcons() {
  const appIcons = document.querySelectorAll('[data-app]');

  appIcons.forEach(icon => {
    const target = icon.getAttribute('data-target');

    let iconPressTimer = null;
    let iconHeld = false;

    icon.addEventListener('mousedown', (e) => {
      if (
        e.target.closest('#close-bar') || // ⛔ prevent from close bar
        e.target.closest('.close-bar-handle') || // ⛔ prevent from bar handle
        e.target.closest('.close-button')        // ⛔ prevent from delete buttons
      ) return;

      iconHeld = false;
      iconPressTimer = setTimeout(() => {
        iconHeld = true;
        toggleEditMode(true);
      }, holdThreshold);
    });

    icon.addEventListener('mouseup', (e) => {
      clearTimeout(iconPressTimer);
      if (!iconHeld && !editMode) {
        openPanel(target);
      }
    });

    icon.addEventListener('mouseleave', () => {
      clearTimeout(iconPressTimer);
    });

    icon.addEventListener('click', (e) => {
      if (editMode || e.target.closest('.close-button')) return;
      openPanel(target);
    });
  });
}


function toggleEditMode(forceOn = null) {
    editMode = forceOn !== null ? forceOn : !editMode;
    document.querySelectorAll('[data-app]').forEach(app => {
      app.classList.toggle('editing', editMode);
    });

    const doneBtn = document.getElementById('done-button');
    if (doneBtn) {
      doneBtn.classList.toggle('hidden', !editMode);
    }
  }

// Remove App Icon
function removeApp(btn) {
  btn.closest('.app-icon').remove();
}

// Panel Navigation
function openPanel(idToShow) {
  document.querySelectorAll('.hud-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(idToShow);
  if (target) {
    target.classList.add('active');
    recentApps = recentApps.filter(app => app !== idToShow);
    recentApps.unshift(idToShow);
    localStorage.setItem('recentApps', JSON.stringify(recentApps));
    updateAppSwitcher();
  }
}

// Open App Switcher
function openAppSwitcher() {
  const switcher = document.getElementById('app-switcher');
  if (!switcher) return;

  switcher.classList.remove('hidden');
  updateAppSwitcher(); // Ensure cards are generated
  initAppSwitcherGestures(); // Re-attach swipe listeners

  document.querySelectorAll('.switcher-card').forEach(card => {
    card.classList.remove('removing', 'animate-in');
    void card.offsetWidth; // Force reflow
    card.classList.add('animate-in');
  });
}


// Back navigation in messages
function initMessageNav() {
  const backArrow = document.querySelector('.back-arrow');
  if (!backArrow) return;

  backArrow.addEventListener('click', () => {
    document.getElementById('messages-chat')?.classList.add('hidden');
    document.getElementById('chat-visible-section')?.classList.add('hidden');
    document.getElementById('messages-threads')?.classList.remove('hidden');
    document.getElementById('messages-threads').style.display = 'flex';
    document.getElementById('threads-wrapper')?.classList.remove('hidden'); // ✅ Show threads/favs

  });
}

function openChatView(name, avatar) {
  // Hide threads view
  const threadsPanel = document.getElementById('messages-threads');
  if (threadsPanel) {
    threadsPanel.classList.add('hidden');
    threadsPanel.style.display = 'none';
  }



  // Show chat view
  document.getElementById('messages-chat')?.classList.remove('hidden');
  document.getElementById('chat-visible-section')?.classList.remove('hidden');

  // Set contact name and avatar
  const avatarEl = document.querySelector('#messages-chat .contact-avatar');
  const nameEl = document.querySelector('#messages-chat .contact-name');

  if (avatarEl && avatar) avatarEl.src = avatar;
  if (nameEl && name) nameEl.textContent = name;

  // Clear messages
  document.querySelector('.chat-body').innerHTML = '';
}

function initContactClicks() {
  // Threads
  document.querySelectorAll('.chat-preview, .thread-item').forEach(thread => {
    thread.addEventListener('click', () => {
      // Handle activity thread differently
      if (thread.classList.contains('activity-thread')) {
        const inboxScreen = document.getElementById('spiral-inbox');
        const activityScreen = document.getElementById('spiral-activity');
        
        if (inboxScreen) inboxScreen.style.display = 'none';
        if (activityScreen) {
          activityScreen.style.display = 'flex';
          activityScreen.classList.add('active');
        }
        return;
      }
      
      const name = thread.querySelector('.thread-names, .thread-title')?.textContent.trim() || 'Unknown';
      const avatarStyle = thread.querySelector('.chat-avatar, .thread-avatar');
      const avatar = avatarStyle?.src || avatarStyle?.style?.backgroundImage?.match(/url\(["']?(.*?)["']?\)/)?.[1] || '';
      
      if (thread.closest('#panel-spiral')) {
        // Show chat view within Spiral
        const inboxScreen = document.getElementById('spiral-inbox');
        const messagesScreen = document.getElementById('spiral-messages');
        const navItems = document.querySelectorAll('.spiral-nav .nav-item');
        const messagesNavItem = document.querySelector('.spiral-nav .nav-item[data-screen="spiral-messages"]');
        
        if (inboxScreen) inboxScreen.style.display = 'none';
        if (messagesScreen) {
          messagesScreen.classList.add('active');
          messagesScreen.style.display = 'flex';
        }
        
        // Update nav state
        if (navItems) navItems.forEach(nav => nav?.classList?.remove('active'));
        if (messagesNavItem) messagesNavItem.classList.add('active');
      } else {
        openPanel('panel-messages');
        openChatView(name, avatar);
      }
    });
  });

  // Favorite Contacts
  document.querySelectorAll('.favorite-contact').forEach(fav => {
    fav.addEventListener('click', () => {
      const name = fav.querySelector('.contact-name')?.textContent || 'Unknown';
      const avatar = fav.querySelector('.contact-avatar')?.src || '';
      openPanel('panel-messages');
      openChatView(name, avatar);
    });
  });
}





function renderThreads() {
  const container = document.getElementById('thread-list');
  if (!container) return;

  container.innerHTML = ''; // Clear any existing threads

  threads.forEach(thread => {
    const el = document.createElement('div');
    el.classList.add('chat-preview');
    el.innerHTML = `
      <div class="chat-avatar" style="background-image: url('${thread.avatar}')"></div>
      <div class="chat-info">
        <div class="chat-snippet">${thread.message}</div>
      </div>
      <div class="thread-names">${thread.name}</div>
    `;




    container.appendChild(el);
  });

  initContactClicks();
}

function handleCloseBarPressStart(event) {
  if (event) event.stopPropagation(); // ✅ Prevent bubbling to app icons
  closeBarHeld = false;
  closeBarTimer = setTimeout(() => {
    closeBarHeld = true;
    openAppSwitcher();
  }, closeBarThreshold);
}

function handleCloseBarPressEnd(event) {
  if (event) event.stopPropagation(); // ✅ Prevent bubbling to app icons
  clearTimeout(closeBarTimer);
  if (!closeBarHeld) {
    // Reset all panels except Spiral's internal state
    document.querySelectorAll('.hud-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('panel-home').classList.add('active');
    document.getElementById('close-bar')?.classList.add('hidden');
    document.getElementById('app-switcher')?.classList.add('hidden');
  }
}


function initAppSwitcherGestures() {
  const switcherCards = document.querySelectorAll('.switcher-card');

  switcherCards.forEach(card => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    });

    card.addEventListener('touchmove', (e) => {
        distX = e.touches[0].clientX - startX;    // Calculate horizontal distance
        distY = e.touches[0].clientY - startY;
        // If dragged more than 10px in any direction, mark card as "removing"
      if (Math.sqrt(distX*distX + distY*distY) > 3) {
            card.classList.add('removing');
        }
    });


    card.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      const isVerticalSwipe = Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX);

      if (isVerticalSwipe) {
        const appID = card.getAttribute('data-app');
        card.classList.add('removing');
        setTimeout(() => {
          recentApps.delete(appID);
          delete recentAppTimestamps[appID];
          localStorage.setItem('recentAppTimestamps', JSON.stringify(recentAppTimestamps));
          card.remove();
          resetAppState(appID);
          updateAppSwitcher();
        }, 250);
      } else {
        card.classList.remove('removing');
      }
    });


    // 🖱 Mouse version for desktop flicks
    let mouseStartY = 0;
    let mouseStartTime = 0;

    card.addEventListener('mousemove', (e) => {
        if (e.buttons !== 1) return;
        distX = e.clientX - startX;
        distY = e.clientY - startY;
        if (Math.sqrt(distX*distX + distY*distY) > 10) {
            card.classList.add('removing');
        }
    });

    card.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      mouseStartY = e.clientY;
      mouseStartTime = Date.now();
    });

    card.addEventListener('mouseup', (e) => {
      const endX = e.clientX;
      const endY = e.clientY;

      const deltaX = endX - startX;
      const deltaY = endY - mouseStartY;

      const isVerticalSwipe = Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX);

      if (isVerticalSwipe) {
        const appId = card.dataset.app;
        recentApps.delete(appId);
        localStorage.setItem('recentApps', JSON.stringify([...recentApps]));
        setTimeout(() => {
          card.remove();
          updateAppSwitcher();
        }, 300);
      } else {
        card.classList.remove('removing');
      }
    });


  });
}


function applyDefaultPreviewState(preview) {
  // Unhide any major visible containers (like hud-panels or app-screens)
  preview.querySelectorAll('.hud-panel, .app-screen').forEach(el => el.classList.remove('hidden'));

  // Unhide any top-level children inside the preview
  Array.from(preview.children).forEach(child => {
    if (child.classList.contains('hidden')) {
      child.classList.remove('hidden');
    }
  });

  // Unhide all active elements to show default visible state
  preview.querySelectorAll('.active').forEach(el => el.classList.remove('hidden'));
}


// ✅ FINAL FIXED VERSION FOR IOS-LIKE SWITCHER IN SL HUD
function updateAppSwitcher() {
  const container = document.querySelector('.switcher-scroll');
  if (!container) return;
  container.innerHTML = '';

  recentApps.forEach(appId => {
    const appPanel = document.getElementById(appId);
    if (!appPanel) return;

    const card = document.createElement('div');
    card.className = 'switcher-card';
    card.setAttribute('data-app', appId);

    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'switcher-preview-wrapper';

    const realHUD = document.querySelector('.app-container');
    const preview = realHUD.cloneNode(true);

    // First, show the target panel and hide others
    preview.querySelectorAll('.hud-panel').forEach(panel => {
      if (panel.id === appId) {
        panel.classList.add('active');
        panel.classList.remove('hidden');
        // Show all content within the active panel
        panel.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
        // Ensure core UI elements are visible
        panel.querySelectorAll('.messages-panel, .chat-body, .settings-page, .app-screen.active').forEach(el => {
          el.classList.remove('hidden');
          el.style.display = '';
        });
      } else {
        panel.classList.remove('active');
        panel.classList.add('hidden');
      }
    });

    // Handle specific panel states
    if (appId === 'panel-messages') {
      const previewStateHandler = previewStateHandlers['panel-messages'];
      if (previewStateHandler) {
        previewStateHandler(preview);
      }
    }

    preview.classList.remove('hud-panel', 'active');
    preview.classList.add('switcher-preview');
    preview.style.width = '343px';
    preview.style.height = '686px';
    preview.style.transform = 'scale(0.8)';
    
    preview.style.pointerEvents = 'none';
    preview.style.display = 'flex';
    preview.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    previewWrapper.appendChild(preview);
    card.appendChild(previewWrapper);

    const label = document.createElement('div');
    label.className = 'switcher-label';
    const appIcon = document.querySelector(`.app-icon[data-target="${appId}"]`);
    label.textContent = appIcon ? appIcon.querySelector('span')?.textContent || 'App' : 'App';
    card.appendChild(label);

    // Set pointer-events to auto after card is fully assembled
    preview.style.pointerEvents = 'auto';

    card.addEventListener('click', () => {
      document.getElementById('app-switcher')?.classList.add('hidden');
      openPanel(appId);
    });

    container.appendChild(card);
  });
}


function enableDragReorder(container) {

  let dragged;

  container.addEventListener('dragstart', e => {
    dragged = e.target;
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientX);
    if (afterElement == null) {
      container.appendChild(dragged);
    } else {
      container.insertBefore(dragged, afterElement);
    }
  });

  container.addEventListener('dragend', () => {
    if (dragged) {
      dragged.classList.remove('dragging');
      dragged.style.transform = 'scale(1.02)';
      setTimeout(() => {
        dragged.style.transform = '';
      }, 100);
    }
  });

  container.addEventListener('dragend', () => {
    if (dragged) {
      dragged.classList.remove('dragging');
      dragged.style.transform = 'scale(1.02)';
      setTimeout(() => {
        dragged.style.transform = '';
      }, 100);

      // ✅ Update order in recentApps
      const reordered = [...container.querySelectorAll('.switcher-card')].map(card =>
        card.getAttribute('data-app')
      );

      recentApps = reordered;
      localStorage.setItem('recentApps', JSON.stringify(recentApps));
    }
  });




}

function getDragAfterElement(container, x) {

  const draggableElements = [...container.querySelectorAll('.switcher-card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function resetAppState(appId) {

  const panel = document.getElementById(appId);
  if (panel) {
    panel.querySelectorAll('.app-screen').forEach(screen => screen.classList.remove('active'));
    panel.querySelector('.app-screen[data-screen="settings-home"]')?.classList.add('active');
    // Add similar line for each app’s default

  }

  if (appId === 'panel-messages') {
    document.getElementById('messages-chat')?.classList.add('hidden');
    document.getElementById('chat-visible-section')?.classList.add('hidden');
    document.getElementById('messages-threads')?.classList.remove('hidden');
    document.getElementById('threads-wrapper')?.classList.remove('hidden');
  }

  if (appId === 'panel-settings') {
    // Reset any toggle states or dynamic pages here if needed
  }

  // Future apps should be reset here too
}

function switchAppPage(appId, screenName) {
  const panel = document.getElementById(appId);
  if (!panel) return;

  const pages = panel.querySelectorAll('.app-screen');
  pages.forEach(page => page.classList.remove('active'));

  const target = panel.querySelector(`.app-screen[data-screen="${screenName}"]`);
  if (target) target.classList.add('active');
}










document.getElementById('app-switcher').addEventListener('click', (e) => {
  if (e.target.id === 'app-switcher') {
    document.getElementById('app-switcher')?.classList.add('hidden');
    openPanel('panel-home');
  }
});

function updateTime() {
  const use24Hour = localStorage.getItem('use24Hour') === 'true';
  const options = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: !use24Hour, 
    timeZone: 'America/New_York'
  };
  let time = new Date().toLocaleTimeString('en-US', options).replace(/\s[AP]M$/, '');
  if (!use24Hour && time.startsWith('0')) {
    time = time.substring(1);
  }
  document.querySelector('.status-bar div:first-child').textContent = time;
}

function initCalendar() {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const now = new Date();
  const monthEl = document.querySelector('.calendar-month');
  const yearEl = document.querySelector('.calendar-year');
  const weekdaysEl = document.querySelector('.calendar-weekdays');
  const daysEl = document.querySelector('.calendar-days');
  
  monthEl.textContent = months[now.getMonth()];
  yearEl.textContent = now.getFullYear();
  
  weekdaysEl.innerHTML = weekdays.map(day => `<div>${day}</div>`).join('');
  
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push('<div class="calendar-day"></div>');
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === now.getDate();
    days.push(`<div class="calendar-day ${isToday ? 'current' : ''}">${i}</div>`);
  }
  
  daysEl.innerHTML = days.join('');
}

function initHomePages() {
  const homePages = document.querySelector('.home-pages');
  const dots = document.querySelectorAll('.dot');
  let activePage = 0;

  const leftNav = document.querySelector('.home-nav-left');
  const rightNav = document.querySelector('.home-nav-right');

  leftNav.addEventListener('click', () => {
    if (activePage > 0) {
      activePage--;
      homePages.style.transform = `translateX(-${activePage * 50}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === activePage));
    }
  });

  rightNav.addEventListener('click', () => {
    if (activePage < 1) {
      activePage++;
      homePages.style.transform = `translateX(-${activePage * 50}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === activePage));
    }
  });
}

function initMusicImport() {
  const importBtn = document.querySelector('.import-music-btn');
  const importDialog = document.querySelector('.import-dialog');
  const urlInput = document.querySelector('.youtube-url-input');
  const convertBtn = document.querySelector('.convert-btn');
  const playButton = document.querySelector('.playback-controls .fa-play');
  const trackTitle = document.querySelector('.track-title');
  const libraryTitle = document.querySelector('.library-title');
  const libraryPage = document.querySelector('.library-page');
  const backToMusic = document.querySelector('.back-to-music');
  const librarySongs = document.querySelector('.library-songs');
  let currentAudio = null;

  // Library page navigation
  document.querySelector('.library-title')?.addEventListener('click', () => {
    const libraryPage = document.querySelector('.library-page');
    const librarySongs = document.querySelector('.library-songs');
    
    if (libraryPage && librarySongs) {
      libraryPage.style.display = 'flex';
      libraryPage.classList.remove('hidden');
      // Clone music items to library page
      const musicItems = document.querySelectorAll('.music-list .music-item');
      librarySongs.innerHTML = '';
      musicItems.forEach(item => {
        const clone = item.cloneNode(true);
        librarySongs.appendChild(clone);
      });
      initMusicItems(true); // Reinitialize click handlers for cloned items
    }
  });

  backToMusic?.addEventListener('click', () => {
    libraryPage?.classList.add('hidden');
  });

  // Initialize click handlers for music items
  function initMusicItems(isLibraryPage = false) {
    const selector = isLibraryPage ? '.library-songs .music-item' : '.music-list .music-item';
    document.querySelectorAll(selector).forEach(item => {
      item.addEventListener('click', () => {
        const title = item.querySelector('.song-title').textContent;
        const artist = item.querySelector('.song-artist').textContent;
        const img = item.querySelector('img').src;
        
        // Update now playing display
        document.querySelector('.now-playing .album-art').src = img;
        document.querySelector('.now-playing .track-title').textContent = title;
        document.querySelector('.now-playing .artist-name').textContent = artist;
        
        if (currentAudio) {
          currentAudio.pause();
          playButton.classList.replace('fa-pause', 'fa-play');
        }
        
        if (item.dataset.downloadUrl) {
          try {
            currentAudio = new Audio(item.dataset.downloadUrl);
            currentAudio.onerror = () => {
              console.error('Error loading audio:', currentAudio.error);
              alert('Unable to play this track. The file may be unavailable.');
              playButton.classList.replace('fa-pause', 'fa-play');
            };
            
            let playPromise = currentAudio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  playButton.classList.replace('fa-play', 'fa-pause');
                })
                .catch(error => {
                  console.error('Playback failed:', error);
                  trackTitle.textContent = 'Error Playing Track';
              alert('Unable to play this track. Please check:\n1. RapidAPI key is configured in Secrets tab\n2. YouTube URL is valid\n3. Audio file is accessible');
                  playButton.classList.replace('fa-pause', 'fa-play');
                });
            }
          } catch (error) {
            console.error('Audio creation failed:', error);
            alert('Unable to play this track. The file may be unavailable.');
          }
        }
      });
    });
  }

  // Handle play/pause button
  playButton?.addEventListener('click', () => {
    if (!currentAudio) return;
    
    if (currentAudio.paused) {
      currentAudio.play();
      playButton.classList.replace('fa-play', 'fa-pause');
    } else {
      currentAudio.pause();
      playButton.classList.replace('fa-pause', 'fa-play');
    }
  });

  if (!importBtn) return;

  importBtn.addEventListener('click', () => {
    importDialog.classList.toggle('hidden');
  });

  convertBtn?.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;

    try {
      convertBtn.disabled = true;
      convertBtn.textContent = 'Converting...';
      
      const response = await fetch('/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (response.ok) {
        const musicList = document.querySelector('.music-list');
        const newItem = document.createElement('div');
        newItem.className = 'music-item';
        newItem.dataset.downloadUrl = data.downloadUrl;
        newItem.innerHTML = `
          <img src="https://i.ytimg.com/vi/${url.split('v=')[1]}/mqdefault.jpg" alt="Music">
          <div class="song-info">
            <div class="song-title">${data.title}</div>
            <div class="song-artist">${data.author}</div>
          </div>
        `;
        musicList.appendChild(newItem);
        initMusicItems(); // Reinitialize click handlers
        urlInput.value = '';
        importDialog.classList.add('hidden');
      } else {
        const errorMessage = data.error || 'Failed to convert video';
        const apiResponse = data.api_response || '';
        alert(`${errorMessage}\n\n${apiResponse}`);
      }
    } catch (err) {
      console.error('Error converting video:', err);
      const errorResponse = err.response?.data?.api_response || '';
      alert(`Error converting video: ${err.message}\n\n${errorResponse}`);
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = 'Convert & Add';
    }
  });
}

// Spiral App Navigation
function initSpiralNav() {
  const navItems = document.querySelectorAll('.spiral-nav .nav-item');
  const panelSpiral = document.getElementById('panel-spiral');
  
  if (!panelSpiral || !navItems.length) return; // Guard against missing elements

  function stopEventBubbling(e) {
    e.stopPropagation();
  }
  
  panelSpiral.addEventListener('mousedown', stopEventBubbling, true);
  panelSpiral.addEventListener('mouseup', stopEventBubbling, true);

  // Handle navigation item clicks
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Get clicked nav button's target screen
      const targetScreen = item.getAttribute('data-screen');
      
      // Update nav buttons active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Hide all screens first
      document.querySelectorAll('.spiral-screen').forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
      });
      
      // Show target screen
      const screenToShow = document.getElementById(targetScreen);
      if (screenToShow) {
        // Use block display for video feed, flex for others
        screenToShow.style.display = targetScreen === 'spiral-video' ? 'block' : 'flex';
        screenToShow.classList.add('active');
        
        // Show content within screen
        const content = screenToShow.querySelector('.video-feed, .friends-list, .create-options, .inbox-messages, .profile-content');
        if (content) {
          content.style.display = content.classList.contains('video-feed') ? 'block' : 'flex';
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSpiralNav();
  initAppIcons();
  initMessageNav();
  updateTime();
  initCalendar();
  initHomePages();
  initMusicImport();
  setInterval(updateTime, 1000);

  renderThreads();
  initContactClicks();
  initAppSwitcherGestures();

  const stored = localStorage.getItem('recentApps');
  if (stored) {
    recentApps = JSON.parse(stored).filter((v, i, a) => a.indexOf(v) === i);
  }

  updateAppSwitcher();
});

document.addEventListener('DOMContentLoaded', () => {
  initAppIcons();
  initMessageNav();
  updateTime();
  initCalendar();
  initHomePages();
  initMusicImport();
  initProfilePage();
  setInterval(updateTime, 1000);

  renderThreads();
  
  initContactClicks();
  initAppSwitcherGestures();

  const stored = localStorage.getItem('recentApps');
  if (stored) {
    recentApps = JSON.parse(stored).filter((v, i, a) => a.indexOf(v) === i);
  }

  updateAppSwitcher();
});

function initProfilePage() {
  const editProfileBtn = document.querySelector('.edit-profile-btn');
  const editProfileModal = document.querySelector('.edit-profile-modal');
  const closeModalBtn = document.querySelector('.close-modal');
  const saveProfileBtn = document.querySelector('.save-profile-btn');
  const profileTabs = document.querySelectorAll('.profile-tabs .tab');

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      editProfileModal?.classList.remove('hidden');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      editProfileModal?.classList.add('hidden');
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      // Here you would normally save the profile data
      editProfileModal?.classList.add('hidden');
    });
  }

  profileTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      profileTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Here you would normally switch between video grids
    });
  });
}



function backToInbox() {
  const messagesScreen = document.getElementById('spiral-messages');
  const activityScreen = document.getElementById('spiral-activity');
  const inboxScreen = document.getElementById('spiral-inbox');
  const inboxNavItem = document.querySelector('.spiral-nav .nav-item[data-screen="spiral-inbox"]');
  
  if (messagesScreen) messagesScreen.style.display = 'none';
  if (activityScreen) activityScreen.style.display = 'none';
  if (inboxScreen) inboxScreen.style.display = 'flex';
  
  // Update nav state
  document.querySelectorAll('.spiral-nav .nav-item')?.forEach(nav => nav?.classList?.remove('active'));
  if (inboxNavItem) inboxNavItem.classList.add('active');
}
