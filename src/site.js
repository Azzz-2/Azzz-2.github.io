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

document.querySelectorAll(".video-wrap").forEach((videoWrap) => {
  const video = videoWrap.querySelector("video");
  const playButton = videoWrap.querySelector(".video-play");

  if (!video || !playButton) {
    return;
  }

  const syncPlayButton = () => {
    playButton.classList.toggle("is-hidden", !video.paused);
  };

  playButton.addEventListener("click", async () => {
    try {
      await video.play();
    } catch {
      playButton.classList.remove("is-hidden");
    }
  });

  video.addEventListener("play", () => {
    videos.forEach((otherVideo) => {
      if (otherVideo !== video) {
        otherVideo.pause();
      }
    });
    syncPlayButton();
  });
  video.addEventListener("pause", syncPlayButton);
  video.addEventListener("ended", syncPlayButton);
});
