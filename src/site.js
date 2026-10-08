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

const metadataObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.preload = "metadata";
          metadataObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "160px" })
  : null;

videos.forEach((video) => {
  const piece = video.closest(".video-piece");
  const status = piece.querySelector(".video-status");
  const retry = piece.querySelector(".video-retry");
  let loadingTimer;
  let attempt = 0;

  const clearLoading = () => {
    clearTimeout(loadingTimer);
    loadingTimer = undefined;
  };

  const showProblem = (message) => {
    clearLoading();
    status.textContent = message;
    status.hidden = false;
    retry.hidden = false;
  };

  const clearProblem = () => {
    clearLoading();
    status.hidden = true;
    status.textContent = "";
    retry.hidden = true;
  };

  const showLoading = () => {
    clearLoading();
    status.textContent = "视频加载中…";
    status.hidden = false;
    retry.hidden = true;
    loadingTimer = setTimeout(() => {
      showProblem("视频加载较慢，可以重试或单独打开视频。");
    }, 15000);
  };

  retry.addEventListener("click", () => {
    const currentAttempt = ++attempt;
    clearProblem();
    video.preload = "auto";
    showLoading();
    try {
      video.load();
      const playing = video.play();
      if (playing && typeof playing.catch === "function") {
        playing.catch(() => {
          if (currentAttempt === attempt) {
            showProblem("未能开始播放，请点视频播放按钮或单独打开视频。");
          }
        });
      }
    } catch {
      showProblem("未能开始播放，请单独打开视频。");
    }
  });

  if (metadataObserver) metadataObserver.observe(video);

  video.addEventListener("play", () => {
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
  video.addEventListener("playing", clearProblem);
  video.addEventListener("pause", () => {
    ++attempt;
    clearLoading();
    if (retry.hidden) status.hidden = true;
  });
  video.addEventListener("ended", clearProblem);
  video.addEventListener("error", () => {
    showProblem("视频未能加载，请重试或单独打开视频。");
  });
});
