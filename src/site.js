const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const videos = document.querySelectorAll(".video-wrap video");

videos.forEach((video) => {
  const piece = video.closest(".video-piece");
  const status = piece.querySelector(".video-status");
  const retry = piece.querySelector(".video-retry");
  const start = piece.querySelector(".video-start");
  const mp4Source = video.getAttribute("src");
  const hlsSource = video.dataset.hls;
  const supportsHls = Boolean(hlsSource && (
    video.canPlayType("application/vnd.apple.mpegurl") ||
    video.canPlayType("application/x-mpegURL")
  ));
  const sources = supportsHls
    ? [hlsSource, video.dataset.hlsLow, mp4Source].filter(Boolean)
    : [mp4Source];
  let sourceIndex = 0;
  if (supportsHls) video.src = sources[0];
  let loadingTimer;
  let attempt = 0;
  let playbackRequested = false;
  let resumeAt = 0;
  let probeController;

  const clearLoading = () => {
    clearTimeout(loadingTimer);
    loadingTimer = undefined;
  };

  const showProblem = (message) => {
    clearLoading();
    playbackRequested = false;
    const diagnostic = `S${sourceIndex + 1}/E${video.error?.code || 0}/R${video.readyState}/N${video.networkState}`;
    status.textContent = `${message}（${diagnostic}）`;
    status.hidden = false;
    retry.hidden = false;
    start.hidden = false;
    video.pause();
    checkConnection(message, diagnostic, attempt);
  };

  const clearProblem = () => {
    clearLoading();
    status.hidden = true;
    status.textContent = "";
    retry.hidden = true;
    probeController?.abort();
  };

  const checkConnection = async (message, diagnostic, currentAttempt) => {
    probeController?.abort();
    const controller = new AbortController();
    probeController = controller;
    const probeTimer = setTimeout(() => controller.abort(), 8000);
    let url = new URL(sources[sourceIndex], document.baseURI);
    try {
      for (let depth = 0; depth < 3; depth += 1) {
        const isPlaylist = /\.m3u8(?:$|\?)/i.test(url.href);
        const response = await fetch(url.href, {
          signal: controller.signal,
          headers: isPlaylist ? {} : { Range: "bytes=0-1023" },
        });
        if (!response.ok) throw new Error("Video connection failed");
        if (!isPlaylist) {
          await response.body?.cancel();
          if (currentAttempt === attempt && !status.hidden) {
            status.textContent = `${message}（${diagnostic}，视频数据可读取）`;
          }
          return;
        }
        const playlist = await response.text();
        if (!playlist.startsWith("#EXTM3U")) throw new Error("Invalid video playlist");
        const reference = playlist.split(/\r?\n/).find((line) => line && !line.startsWith("#"));
        if (!reference) throw new Error("Empty video playlist");
        url = new URL(reference, url);
      }
    } catch {
      if (currentAttempt === attempt && !status.hidden && !controller.signal.aborted) {
        status.textContent = `${message}（${diagnostic}，视频连接检查未通过）`;
      }
    } finally {
      clearTimeout(probeTimer);
    }
  };

  const recoverPlayback = () => {
    if (!playbackRequested || sourceIndex >= sources.length - 1) return false;
    resumeAt = video.currentTime || resumeAt;
    sourceIndex += 1;
    video.src = sources[sourceIndex];
    startPlayback(true);
    return true;
  };

  const showLoading = () => {
    clearLoading();
    status.textContent = "视频加载中…";
    status.hidden = false;
    retry.hidden = true;
    start.hidden = true;
    loadingTimer = setTimeout(() => {
      if (!recoverPlayback()) showProblem("视频连接超时，请点重试播放。");
    }, 15000);
  };

  const startPlayback = (reload = false) => {
    const currentAttempt = ++attempt;
    playbackRequested = true;
    clearProblem();
    video.preload = "auto";
    showLoading();
    try {
      if (reload || video.error) {
        video.load();
      }
      const playing = video.play();
      if (playing && typeof playing.catch === "function") {
        playing.catch((error) => {
          if (currentAttempt === attempt) {
            if (error.name === "AbortError" && !playbackRequested) return;
            showProblem(error.name === "NotAllowedError"
              ? "请点画面中的播放视频按钮。"
              : "视频未能开始播放，请点重试播放。");
          }
        });
      }
    } catch {
      showProblem("视频未能开始播放，请点重试播放。");
    }
  };

  const playFromClick = (reload) => {
    if (video.error && sourceIndex < sources.length - 1) {
      sourceIndex += 1;
      video.src = sources[sourceIndex];
    }
    startPlayback(reload);
  };
  start.addEventListener("click", () => playFromClick(Boolean(video.error)));
  retry.addEventListener("click", () => playFromClick(true));
  video.addEventListener("loadedmetadata", () => {
    if (resumeAt > 0 && Number.isFinite(video.duration)) {
      video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.1));
      resumeAt = 0;
    }
  });

  video.addEventListener("play", () => {
    playbackRequested = true;
    videos.forEach((otherVideo) => {
      if (otherVideo !== video) {
        otherVideo.pause();
      }
    });
    showLoading();
  });
  video.addEventListener("waiting", () => {
    if (!video.paused) showLoading();
  });
  video.addEventListener("playing", () => {
    clearProblem();
    start.hidden = true;
  });
  video.addEventListener("pause", () => {
    if (!video.paused) return;
    playbackRequested = false;
    clearLoading();
    start.hidden = false;
    if (retry.hidden) status.hidden = true;
  });
  video.addEventListener("ended", () => {
    playbackRequested = false;
    clearProblem();
    start.hidden = false;
  });
  video.addEventListener("error", () => {
    if (!recoverPlayback()) showProblem("视频未能加载，请点重试播放。");
  });
});
