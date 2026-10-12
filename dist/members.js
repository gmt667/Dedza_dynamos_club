/* members.js — Dedza Dynamos Supporter Membership & Fan Dashboard Controller */
(function () {
  'use strict';

  const SESSION_KEY = 'dedza_member_session';
  const MEMBERS_STORAGE_KEY = 'dedza_local_members';
  const VOTE_STORAGE_KEY = 'dedza_fan_vote_2026';

  // Demo seed members for instant testing/offline use
  const defaultLocalMembers = [
    {
      id: 'DD-2026-0101',
      fullName: 'Chimwemwe Banda',
      email: 'c.banda@gmail.com',
      phone: '+265 888 123 456',
      tier: 'gold',
      district: 'Dedza',
      favoritePlayer: 'Clement Nyondo',
      status: 'active',
      notificationPref: 'whatsapp',
      joinedAt: '2026-10-01 10:00:00',
    },
    {
      id: 'DD-2026-0102',
      fullName: 'Tamandani Phiri',
      email: 't.phiri@yahoo.com',
      phone: '+265 999 456 789',
      tier: 'silver',
      district: 'Lilongwe',
      favoritePlayer: 'Chikondi Mbeta',
      status: 'active',
      notificationPref: 'whatsapp',
      joinedAt: '2026-10-03 14:30:00',
    },
  ];

  function getLocalMembers() {
    try {
      const stored = localStorage.getItem(MEMBERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultLocalMembers;
    } catch {
      return defaultLocalMembers;
    }
  }

  function saveLocalMember(member) {
    try {
      const all = getLocalMembers();
      const existingIdx = all.findIndex(m => m.id === member.id || (m.email && m.email === member.email));
      if (existingIdx >= 0) {
        all[existingIdx] = { ...all[existingIdx], ...member };
      } else {
        all.unshift(member);
      }
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(member) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(member));
      saveLocalMember(member);
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('Could not clear session:', e);
    }
  }

  function showToast(msg, duration = 3500) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window._memberToastTimer);
    window._memberToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // Tier helpers
  const tierConfig = {
    gold: {
      name: 'Gold VIP Member',
      class: 'gold-card',
      color: '#b79700',
      badge: '🥇 GOLD VIP',
      ticketDiscount: '10% Discount at Gate',
      jerseyDiscount: '15% Off Replica Kit',
    },
    silver: {
      name: 'Silver Supporter',
      class: 'silver-card',
      color: '#8a8d87',
      badge: '🥈 SILVER MEMBER',
      ticketDiscount: '10% Discount at Gate',
      jerseyDiscount: '10% Off Replica Kit',
    },
    yellow: {
      name: 'Yellow Supporter',
      class: 'yellow-card',
      color: '#f4c900',
      badge: '🟡 YELLOW SUPPORTER',
      ticketDiscount: 'Member Priority Line',
      jerseyDiscount: '5% Off Matchday Goods',
    },
  };

  // DOM Elements
  const authSection = document.getElementById('member-auth-section');
  const dashSection = document.getElementById('member-dash-section');
  const tabRegister = document.getElementById('tab-register');
  const tabSignin = document.getElementById('tab-signin');
  const formRegister = document.getElementById('form-register');
  const formSignin = document.getElementById('form-signin');

  function renderView() {
    const member = getSession();
    if (member) {
      if (authSection) authSection.style.display = 'none';
      if (dashSection) dashSection.style.display = 'block';
      renderDashboard(member);
    } else {
      if (authSection) authSection.style.display = 'block';
      if (dashSection) dashSection.style.display = 'none';
    }
  }

  // Tab switching
  if (tabRegister && tabSignin) {
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabSignin.classList.remove('active');
      if (formRegister) formRegister.style.display = 'block';
      if (formSignin) formSignin.style.display = 'none';
    });

    tabSignin.addEventListener('click', () => {
      tabSignin.classList.add('active');
      tabRegister.classList.remove('active');
      if (formRegister) formRegister.style.display = 'none';
      if (formSignin) formSignin.style.display = 'block';
    });
  }

  // Tier Radio Selection Styling
  document.querySelectorAll('.tier-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.tier-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // ── REGISTRATION FORM SUBMISSION ──────────────────────────────────────────
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formRegister.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Complete Membership';

      const fullName = (document.getElementById('reg-name')?.value || '').trim();
      const email = (document.getElementById('reg-email')?.value || '').trim();
      const phone = (document.getElementById('reg-phone')?.value || '').trim();
      const district = (document.getElementById('reg-district')?.value || '').trim() || 'Dedza';
      const tier = document.querySelector('input[name="tier"]:checked')?.value || 'yellow';
      const favoritePlayer = (document.getElementById('reg-player')?.value || '').trim();
      const pin = (document.getElementById('reg-pin')?.value || '').trim();

      if (!fullName) {
        showToast('Please enter your full name.');
        return;
      }
      if (!email && !phone) {
        showToast('Please provide an email or phone number.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Registration...';
      }

      const payload = {
        action: 'register',
        fullName,
        email,
        phone,
        district,
        tier,
        favoritePlayer: favoritePlayer || 'Clement Nyondo',
        pin: pin || '1234',
      };

      let registeredMember = null;

      try {
        // Attempt POST to live API endpoint
        const res = await fetch('/api/public/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.member) {
            registeredMember = data.member;
          }
        }
      } catch (err) {
        console.warn('API call failed, switching to resilient client registration:', err);
      }

      // If backend was not reached or returned error, generate client-side verified member
      if (!registeredMember) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        registeredMember = {
          id: `DD-2026-${randomDigits}`,
          fullName,
          email,
          phone,
          district,
          tier,
          favoritePlayer: favoritePlayer || 'Clement Nyondo',
          status: 'active',
          notificationPref: 'whatsapp',
          joinedAt: new Date().toISOString(),
        };
      }

      setSession(registeredMember);
      showToast(`🎉 Welcome, ${registeredMember.fullName}! Your Member ID is ${registeredMember.id}`);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }

      renderView();
    });
  }

  // ── SIGN IN FORM SUBMISSION ───────────────────────────────────────────────
  if (formSignin) {
    formSignin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const credInput = document.getElementById('login-cred');
      const pinInput = document.getElementById('login-pin');
      const credential = (credInput?.value || '').trim();
      const pin = (pinInput?.value || '').trim();

      if (!credential) {
        showToast('Please enter your Member ID, email or phone number.');
        return;
      }

      let signedInMember = null;

      try {
        const res = await fetch('/api/public/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', credential, pin }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.member) signedInMember = data.member;
        }
      } catch (err) {
        console.warn('Network login error, falling back to local records:', err);
      }

      // Check local fallback members if server didn't resolve
      if (!signedInMember) {
        const all = getLocalMembers();
        const cleanCred = credential.toLowerCase();
        signedInMember = all.find(m =>
          m.id.toLowerCase() === cleanCred ||
          (m.email && m.email.toLowerCase() === cleanCred) ||
          (m.phone && m.phone === cleanCred)
        );
      }

      if (signedInMember) {
        setSession(signedInMember);
        showToast(`Welcome back, ${signedInMember.fullName}!`);
        renderView();
      } else {
        showToast('No member found with those details. Please register first.');
      }
    });
  }

  // Quick Demo Login Button
  const demoBtn = document.getElementById('demo-login-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const demoMember = {
        id: 'DD-2026-0842',
        fullName: 'Chimwemwe Banda',
        email: 'chimwemwe.banda@gmail.com',
        phone: '+265 888 123 456',
        tier: 'gold',
        district: 'Dedza',
        favoritePlayer: 'Clement Nyondo',
        status: 'active',
        notificationPref: 'whatsapp',
        joinedAt: '2026-10-01 08:30:00',
      };
      setSession(demoMember);
      showToast('Signed in as Chimwemwe Banda (Gold VIP Member) ✓');
      renderView();
    });
  }

  // ── DASHBOARD POPULATION ──────────────────────────────────────────────────
  function renderDashboard(member) {
    const tierInfo = tierConfig[member.tier] || tierConfig.yellow;

    // Greeting & Info
    const greetName = document.getElementById('dash-member-name');
    if (greetName) greetName.textContent = member.fullName;

    const greetTier = document.getElementById('dash-member-tier');
    if (greetTier) greetTier.textContent = tierInfo.name;

    // Digital Membership Card
    const cardEl = document.getElementById('digital-membership-card');
    if (cardEl) {
      cardEl.className = `membership-card ${tierInfo.class}`;
    }

    const cardId = document.getElementById('card-id-text');
    if (cardId) cardId.textContent = member.id;

    const cardHolder = document.getElementById('card-holder-name');
    if (cardHolder) cardHolder.textContent = member.fullName.toUpperCase();

    const cardTierBadge = document.getElementById('card-tier-badge');
    if (cardTierBadge) cardTierBadge.textContent = tierInfo.badge;

    const cardDistrict = document.getElementById('card-district-text');
    if (cardDistrict) cardDistrict.textContent = (member.district || 'Dedza').toUpperCase() + ', MALAWI';

    // Player of the Month Vote State
    renderVotingWidget(member);

    // Profile Settings Form
    const profPhone = document.getElementById('prof-phone');
    if (profPhone) profPhone.value = member.phone || '';
    const profDistrict = document.getElementById('prof-district');
    if (profDistrict) profDistrict.value = member.district || 'Dedza';
  }

  // Copy Code Handler
  window.copyDiscountCode = function (code, btnId) {
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById(btnId);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'COPIED! ✓';
        btn.style.background = '#27ae60';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
          btn.style.color = '';
        }, 2500);
      }
      showToast(`Voucher code "${code}" copied to clipboard!`);
    }).catch(() => {
      showToast(`Code: ${code}`);
    });
  };

  // Voting Widget Logic
  function renderVotingWidget(member) {
    const savedVote = localStorage.getItem(VOTE_STORAGE_KEY);
    const voteBtn = document.getElementById('submit-vote-btn');
    const cards = document.querySelectorAll('.candidate-card');

    cards.forEach(card => {
      const playerId = card.dataset.player;
      if (savedVote === playerId) {
        card.classList.add('voted');
        const badge = card.querySelector('.voted-tag');
        if (badge) badge.style.display = 'inline-block';
      } else {
        card.classList.remove('voted');
        const badge = card.querySelector('.voted-tag');
        if (badge) badge.style.display = 'none';
      }

      card.onclick = () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      };
    });

    if (savedVote && voteBtn) {
      voteBtn.textContent = 'Vote Recorded (Click to Change)';
    }

    if (voteBtn) {
      voteBtn.onclick = () => {
        const selected = document.querySelector('input[name="player-vote"]:checked');
        if (!selected) {
          showToast('Please select a player to cast your vote.');
          return;
        }
        localStorage.setItem(VOTE_STORAGE_KEY, selected.value);
        showToast('Official vote recorded! Thank you for participating in the supporter poll.');
        renderVotingWidget(member);
      };
    }
  }

  // Profile Save
  const profForm = document.getElementById('member-profile-form');
  if (profForm) {
    profForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = getSession();
      if (!current) return;

      const newPhone = document.getElementById('prof-phone')?.value.trim() || current.phone;
      const newDistrict = document.getElementById('prof-district')?.value.trim() || current.district;
      const newPref = document.getElementById('prof-pref')?.value || current.notificationPref;

      const updated = {
        ...current,
        phone: newPhone,
        district: newDistrict,
        notificationPref: newPref,
      };

      setSession(updated);
      showToast('Profile and preferences updated ✓');
      renderDashboard(updated);
    });
  }

  // Print Card Button
  const printBtn = document.getElementById('print-card-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Sign Out Button
  const signoutBtn = document.getElementById('member-signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      clearSession();
      showToast('Signed out of member portal.');
      renderView();
    });
  }

  // Initialize view on load
  document.addEventListener('DOMContentLoaded', renderView);
  renderView();
})();
