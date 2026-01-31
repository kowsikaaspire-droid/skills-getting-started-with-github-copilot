document.addEventListener("DOMContentLoaded", () => {
  // Default activities (used if no remote data available)
  const defaultActivities = [
    { id: "chess", name: "Chess Club", description: "Strategize and play weekly tournaments.", spots: 20 },
    { id: "drama", name: "Drama Club", description: "Rehearse and produce two shows per year.", spots: 30 },
    { id: "robotics", name: "Robotics Team", description: "Design, build, and compete with robots.", spots: 12 }
  ];

  // Storage keys
  const STORAGE_KEY = "mhs_participants_v1";

  // Elements
  const activitiesListEl = document.getElementById("activities-list");
  const activityTemplate = document.getElementById("activity-template");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("email");
  const messageEl = document.getElementById("message");

  // Try to load activities remotely, fall back to defaults
  fetch("activities.json")
    .then((r) => r.ok ? r.json() : Promise.reject())
    .catch(() => defaultActivities)
    .then(init);

  function loadParticipants() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveParticipants(participantsMap) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participantsMap));
  }

  function init(activities) {
    const participantsMap = loadParticipants();

    // Render select options
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    activities.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.name}`;
      activitySelect.appendChild(opt);
    });

    // Render cards
    activitiesListEl.innerHTML = "";
    activities.forEach(a => {
      const clone = activityTemplate.content.cloneNode(true);
      const card = clone.querySelector(".activity-card");
      card.dataset.activityId = a.id;
      clone.querySelector(".activity-name").textContent = a.name;
      clone.querySelector(".activity-desc").textContent = a.description;
      updateSpotsText(a, participantsMap[a.id] || [], clone.querySelector(".spots-left"));
      const list = clone.querySelector(".participants-list");
      renderParticipantsList(list, participantsMap[a.id] || []);
      activitiesListEl.appendChild(clone);
    });

    // Form handling
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const activityId = activitySelect.value;
      if (!email || !activityId) {
        showMessage("Please enter an email and choose an activity.", "error");
        return;
      }

      const participants = participantsMap[activityId] || [];
      const activity = activities.find(x => x.id === activityId);
      if (!activity) {
        showMessage("Selected activity not found.", "error");
        return;
      }

      if (participants.includes(email)) {
        showMessage("This email is already signed up for the activity.", "error");
        return;
      }

      if (participants.length >= activity.spots) {
        showMessage("Sorry, no spots left in this activity.", "error");
        return;
      }

      participants.push(email);
      participantsMap[activityId] = participants;
      saveParticipants(participantsMap);

      // Update the card for this activity
      const card = activitiesListEl.querySelector(`.activity-card[data-activity-id="${activityId}"]`);
      if (card) {
        const list = card.querySelector(".participants-list");
        renderParticipantsList(list, participants);
        const spotsEl = card.querySelector(".spots-left");
        updateSpotsText(activity, participants, spotsEl);
      }

      showMessage("Signed up successfully!", "success");
      signupForm.reset();
    });
  }

  function renderParticipantsList(ulEl, participants) {
    ulEl.innerHTML = "";
    if (!participants || participants.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No participants yet";
      ulEl.appendChild(li);
      return;
    }

    participants.forEach(email => {
      const li = document.createElement("li");
      const avatar = document.createElement("span");
      avatar.className = "avatar";
      avatar.textContent = email[0].toUpperCase() || "?";
      const txt = document.createElement("span");
      txt.className = "participant-email";
      txt.textContent = email;
      li.appendChild(avatar);
      li.appendChild(txt);
      ulEl.appendChild(li);
    });
  }

  function updateSpotsText(activity, participants, el) {
    const used = participants ? participants.length : 0;
    const left = Math.max(0, (activity.spots || 0) - used);
    el.textContent = `${left} spot${left === 1 ? "" : "s"} left`;
  }

  function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = type === "success" ? "message success" : (type === "error" ? "message error" : "message");
    messageEl.classList.remove("hidden");
    setTimeout(() => {
      messageEl.classList.add("hidden");
    }, 3000);
  }
});
