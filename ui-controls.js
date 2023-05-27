const Blur = document.getElementById("blur");
const canvas = document.getElementById("canvas");

const opacity = document.getElementById("opacity");

Blur.addEventListener("input", (e) => {
  canvas.style.filter = `blur(${e.target.value}px)`;
});

opacity.addEventListener("input", (e) => {
  canvas.style.opacity = Number(e.target.value);
});
