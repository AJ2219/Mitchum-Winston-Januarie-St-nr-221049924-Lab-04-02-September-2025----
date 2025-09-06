// Mitchum Winston Januarie - St nr:221049924 Lab 04 (WAD621S)

// script.js — validation, DOM creation, table sync, accessibility

document.addEventListener("DOMContentLoaded", () => {
  // ------- Element refs -------
  const form = document.getElementById("Registration_form");
  const firstName = document.getElementById("firstName");
  const lastName  = document.getElementById("lastName");
  const email     = document.getElementById("email");
  const programme = document.getElementById("programme");
  const photo     = document.getElementById("Photo");
  const live      = document.getElementById("live");

  const cardsWrap = document.getElementById("studentProfiles");
  const tableBody = document.getElementById("summaryBody");

  // If the table header has no Actions column, add one.
  const summaryTable = document.getElementById("summary");
  const headerRow = summaryTable?.querySelector("thead tr");
  if (headerRow && ![...headerRow.children].some(th => th.textContent.trim().toLowerCase() === "actions")) {
    const th = document.createElement("th");
    th.textContent = "Actions";
    headerRow.appendChild(th);
  }

  // Registry to keep card <-> row in sync
  const registry = new Map(); 

  // ------- Helpers -------
  function announce(msg) {
    if (!live) return;
    live.textContent = msg;
  }

  function ensureErrorEl(afterEl, idBase) {
    // ERROR MESSAGE for field errors
    const existing = document.getElementById(idBase + "Error");
    if (existing) return existing;
    const small = document.createElement("small");
    small.className = "error-message";
    small.id = idBase + "Error";
    // place right after the field (or at end of its .Form-row)
    const container = afterEl.closest(".Form-row") || afterEl.parentElement || afterEl;
    container.appendChild(small);
    return small;
  }

  function setError(inputEl, message) {
    const idBase = inputEl.id || inputEl.name || "field";
    const errEl = ensureErrorEl(inputEl, idBase);
    errEl.textContent = message || "";
    if (message) {
      inputEl.setAttribute("aria-invalid", "true");
      inputEl.setAttribute("aria-describedby", errEl.id);
    } else {
      inputEl.removeAttribute("aria-invalid");
      inputEl.removeAttribute("aria-describedby");
    }
  }

  function setFieldsetError(fieldsetEl, idBase, message) {

    // For (year), attach an inline error to fieldset
    let errEl = document.getElementById(idBase + "Error");
    if (!errEl) {
      errEl = document.createElement("small");
      errEl.className = "error-message";
      errEl.id = idBase + "Error";
      fieldsetEl.appendChild(errEl);
    }
    errEl.textContent = message || "";
    if (message) {
      fieldsetEl.setAttribute("aria-invalid", "true");
      fieldsetEl.setAttribute("aria-describedby", errEl.id);
    } else {
      fieldsetEl.removeAttribute("aria-invalid");
      fieldsetEl.removeAttribute("aria-describedby");
    }
  }

  // ------- Validation  OF FORM-------
  function validName(value) {
    return typeof value === "string" && value.trim().length >= 2;
  }

  function validEmail(value) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value).trim());
  }

  function validProgramme(value) {
    return value && value.trim().length > 0;
  }

  function getSelectedYear() {
    const checked = document.querySelector('input[name="yearOfStudy"]:checked');
    return checked ? checked.value : "";
  }

  function validURLIfProvided(value) {
    if (!value || value.trim() === "") return true;
    try {
      new URL(value.trim());
      return true;
    } catch {
      return false;
    }
  }

  function getInterests() {
    const checked = [...document.querySelectorAll('input[name="interests"]:checked')];
    // Prefer the label text for clarity; fallback to value
    return checked.map(cb => {
      const lbl = document.querySelector(`label[for="${cb.id}"]`);
      return (lbl?.textContent?.trim()) || cb.value;
    });
  }

  function validateAll() {
    let ok = true;

    if (!validName(firstName.value)) {
      setError(firstName, "Please enter at least 2 characters.");
      ok = false;
    } else {
      setError(firstName, "");
    }

    if (!validName(lastName.value)) {
      setError(lastName, "Please enter at least 2 characters.");
      ok = false;
    } else {
      setError(lastName, "");
    }

    if (!validEmail(email.value)) {
      setError(email, "Please enter a valid email address.");
      ok = false;
    } else {
      setError(email, "");
    }

    if (!validProgramme(programme.value)) {
      setError(programme, "Please select a programme.");
      ok = false;
    } else {
      setError(programme, "");
    }

    const yearFieldset = [...document.querySelectorAll("fieldset")].find(fs =>
      fs.querySelector('input[name="yearOfStudy"]')
    );
    if (!getSelectedYear()) {
      if (yearFieldset) setFieldsetError(yearFieldset, "yearOfStudy", "Please select your year of study.");
      ok = false;
    } else {
      if (yearFieldset) setFieldsetError(yearFieldset, "yearOfStudy", "");
    }

    if (!validURLIfProvided(photo.value)) {
      // PhotoError  in HTML
      const photoErr = document.getElementById("PhotoError") || ensureErrorEl(photo, "Photo");
      photoErr.textContent = "Please enter a valid URL or leave it blank.";
      photo.setAttribute("aria-invalid", "true");
      ok = false;
    } else {
      const photoErr = document.getElementById("PhotoError");
      if (photoErr) photoErr.textContent = "";
      photo.removeAttribute("aria-invalid");
    }

    return ok;
  }

  // ------- Profile Cards + Summary  Table (IMPLEMENTATION ) -------
  function makeId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function buildCard(data, id) {
    const card = document.createElement("article");
    card.className = "student-card";
    card.setAttribute("data-id", id);
    card.tabIndex = 0;

    const img = document.createElement("img");
    img.alt = `${data.firstName} ${data.lastName} photo`;
    img.loading = "lazy";
    img.src = data.photo || "https://placehold.co/160x160?text=Photo";

    const info = document.createElement("div");
    info.className = "card-info";

    const h3 = document.createElement("h3");
    h3.textContent = `${data.firstName} ${data.lastName}`;

    const meta = document.createElement("p");
    meta.innerHTML = `<strong>${data.programme}</strong> • ${data.year}`;

    const chips = document.createElement("p");
    chips.className = "chips";
    if (data.interests.length) {
      data.interests.forEach(int => {
        const span = document.createElement("span");
        span.className = "chip";
        span.textContent = int;
        chips.appendChild(span);
      });
    } else {
      const span = document.createElement("span");
      span.className = "chip";
      span.textContent = "No interests selected";
      chips.appendChild(span);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.className = "btn-remove";
    btnRemove.textContent = "Remove";
    btnRemove.addEventListener("click", () => removeEntry(id));
    actions.appendChild(btnRemove);

    info.appendChild(h3);
    info.appendChild(meta);
    info.appendChild(chips);
    info.appendChild(actions);

    card.appendChild(img);
    card.appendChild(info);

    return card;
  }

  function buildRow(data, id) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", id);

    const tdName = document.createElement("td");
    tdName.textContent = `${data.firstName} ${data.lastName}`;

    const tdProg = document.createElement("td");
    tdProg.textContent = data.programme;

    const tdYear = document.createElement("td");
    tdYear.textContent = data.year;

    const tdInterests = document.createElement("td");
    tdInterests.textContent = data.interests.join(", ") || "—";

    const tdActions = document.createElement("td");
    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.className = "btn-remove";
    btnRemove.textContent = "Remove";
    btnRemove.addEventListener("click", () => removeEntry(id));
    tdActions.appendChild(btnRemove);

    tr.append(tdName, tdProg, tdYear, tdInterests, tdActions);
    return tr;
  }

  function removeEntry(id) {
    const entry = registry.get(id);
    if (!entry) return;
    entry.card?.remove();
    entry.row?.remove();
    registry.delete(id);
    announce("Profile removed.");
  }

  function resetForm() {
    form.reset();
    // Clear errors
    [firstName, lastName, email, programme, photo].forEach(el => setError(el, ""));
    const yearFieldset = [...document.querySelectorAll("fieldset")].find(fs =>
      fs.querySelector('input[name="yearOfStudy"]')
    );
    if (yearFieldset) setFieldsetError(yearFieldset, "yearOfStudy", "");
    const photoErr = document.getElementById("PhotoError");
    if (photoErr) photoErr.textContent = "";
    announce("Form reset.");
    firstName.focus();
  }

  // ------- Events -------
  // Inline validation on blur/change
  firstName.addEventListener("blur", () => {
    setError(firstName, validName(firstName.value) ? "" : "Please enter at least 2 characters.");
  });
  lastName.addEventListener("blur", () => {
    setError(lastName, validName(lastName.value) ? "" : "Please enter at least 2 characters.");
  });
  email.addEventListener("blur", () => {
    setError(email, validEmail(email.value) ? "" : "Please enter a valid email address.");
  });
  programme.addEventListener("change", () => {
    setError(programme, validProgramme(programme.value) ? "" : "Please select a programme.");
  });
  photo.addEventListener("blur", () => {
    const ok = validURLIfProvided(photo.value);
    const photoErr = document.getElementById("PhotoError") || ensureErrorEl(photo, "Photo");
    photoErr.textContent = ok ? "" : "Please enter a valid URL or leave it blank.";
    if (!ok) photo.setAttribute("aria-invalid", "true"); else photo.removeAttribute("aria-invalid");
  });
  // Year radios — validate on change
  document.querySelectorAll('input[name="yearOfStudy"]').forEach(r => {
    r.addEventListener("change", () => {
      const yearFieldset = r.closest("fieldset");
      if (yearFieldset) setFieldsetError(yearFieldset, "yearOfStudy", getSelectedYear() ? "" : "Please select your year of study.");
    });
  });

//  submitting form 

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    announce(""); 
    if (!validateAll()) {
      announce("Fix errors before submitting.");
      return;
    }

    const data = {
      firstName: firstName.value.trim(),
      lastName : lastName.value.trim(),
      email    : email.value.trim(),
      programme: programme.value.trim(),
      year     : getSelectedYear(),
      interests: getInterests(),
      photo    : (photo.value || "").trim()
    };

    const id = makeId();
    const card = buildCard(data, id);
    const row  = buildRow(data, id);

    // Prepend newest first
    cardsWrap.prepend(card);
    tableBody.prepend(row);

    registry.set(id, { card, row });

    announce("Student profile added.");
    resetForm();
  });

});
