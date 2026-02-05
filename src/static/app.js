document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and activity list
      activitiesList.innerHTML = "";
      
      // Clear existing options in select (except the first placeholder option)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section" aria-live="polite">
            <h5 class="participants-title">Participants</h5>
            <ul class="participants-list" aria-label="Participants for ${name}"></ul>
            <p class="no-participants info ${details.participants.length ? "hidden" : ""}">No participants yet</p>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Populate participants list
        const participantsUl = activityCard.querySelector(".participants-list");
        const noParticipantsP = activityCard.querySelector(".no-participants");
        if (details.participants && details.participants.length) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.textContent = "✕ Delete";
            deleteBtn.type = "button";
            deleteBtn.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                if (response.ok) {
                  li.remove();
                  if (participantsUl.children.length === 0) {
                    noParticipantsP.classList.remove("hidden");
                  }
                  // Refresh activities to update spots left counter
                  setTimeout(fetchActivities, 300);
                } else {
                  const result = await response.json();
                  alert(result.detail || "Failed to unregister");
                }
              } catch (error) {
                alert("Error unregistering. Please try again.");
                console.error("Error unregistering:", error);
              }
            });
            li.appendChild(emailSpan);
            li.appendChild(deleteBtn);
            participantsUl.appendChild(li);
          });
          noParticipantsP.classList.add("hidden");
        } else {
          noParticipantsP.classList.remove("hidden");
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
