const slider = document.querySelector(".slider");
const img = document.createElement("img");
img.src = "https://picsum.photos/300/300";
img.alt = "slider 1";
img.style.position = "absolute";
slider.appendChild(img);

let position = 0;
const speed = 3; 
slider.style.overflow = "hidden";
slider.style.position = "relative";
slider.style.width = "99vw"
slider.style.height = "300px"; 


function animateslider() {
    img.style.transform = `translateX(${    position}px)`;
    position -= speed;

    if (position+300 < 0) {  
        position = window.innerWidth; 
    }

    requestAnimationFrame(animateslider);
}

animateslider();
