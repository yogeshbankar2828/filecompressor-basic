(function () {
  const form = document.getElementById("form");
  const fileInput = document.getElementById("file");
  const drop = document.getElementById("drop");
  const listWrap = document.getElementById("list");
  const list = listWrap.querySelector("ul");
  const statusEl = document.getElementById("status");
  const result = document.getElementById("result");
  const meter = document.getElementById("meter");
  const meterBar = meter.querySelector("span");
  const clearBtn = document.getElementById("clear");

  let files = [];

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
  }

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function renderList() {
    list.innerHTML = "";
    if (!files.length) {
      listWrap.hidden = true;
      return;
    }
    listWrap.hidden = false;
    files.forEach((file) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      const size = document.createElement("span");
      name.textContent = file.name;
      size.textContent = formatBytes(file.size);
      li.appendChild(name);
      li.appendChild(size);
      list.appendChild(li);
    });
  }

  function addFiles(fileList) {
    files = files.concat(Array.from(fileList));
    renderList();
    setStatus("");
    result.hidden = true;
  }

  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  clearBtn.addEventListener("click", () => {
    files = [];
    renderList();
    result.hidden = true;
    meter.hidden = true;
    meterBar.style.width = "0%";
    setStatus("");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!files.length) {
      setStatus("Choose at least one file.", "error");
      return;
    }

    const mode = form.querySelector('input[name="mode"]:checked').value;
    const body = new FormData();
    body.append("mode", mode);
    files.forEach((file) => body.append("files", file, file.name));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/jobs");
    meter.hidden = false;
    meterBar.style.width = "0%";
    setStatus("Uploading…");
    result.hidden = true;

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const pct = Math.round((ev.loaded / ev.total) * 100);
      meterBar.style.width = pct + "%";
      setStatus("Uploading " + pct + "%");
    };

    xhr.onerror = () => setStatus("Network error.", "error");

    xhr.onload = () => {
      meterBar.style.width = "100%";
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (_err) {
        setStatus("The server returned an invalid response.", "error");
        return;
      }

      if (xhr.status >= 400) {
        setStatus(data.error || "Compress failed.", "error");
        return;
      }

      const job = data.job;
      const saved = job.originalBytes - job.outputBytes;
      const ratio = job.originalBytes
        ? Math.round((job.outputBytes / job.originalBytes) * 100)
        : 0;
      const savedText =
        saved >= 0
          ? formatBytes(saved) + " smaller (" + ratio + "% of original)"
          : formatBytes(Math.abs(saved)) + " larger than the source (" + ratio + "% of original)";

      setStatus("Done.", "ok");
      result.hidden = false;
      result.innerHTML =
        "<p>Original " +
        formatBytes(job.originalBytes) +
        ". Output " +
        formatBytes(job.outputBytes) +
        ". " +
        savedText +
        ".</p>" +
        '<p><a class="download" href="' +
        data.downloadUrl +
        '">Download ' +
        job.outputName +
        "</a></p>" +
        "<p class=\"hint\">Job " +
        job.jobId +
        ". Expires " +
        new Date(job.expiresAt).toLocaleString() +
        ".</p>";
    };

    xhr.send(body);
  });

  fetch("/api/v1/config")
    .then((r) => r.json())
    .then((cfg) => {
      const maxFiles = document.getElementById("max-files");
      const maxSize = document.getElementById("max-size");
      const ttl = document.getElementById("ttl");
      if (maxFiles) maxFiles.textContent = String(cfg.limits.maxFiles);
      if (maxSize) maxSize.textContent = formatBytes(cfg.limits.maxBytes);
      if (ttl) ttl.textContent = String(cfg.limits.jobTtlMinutes);
    })
    .catch(() => {});
})();
