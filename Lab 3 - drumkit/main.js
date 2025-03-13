// const sound = document.querySelectorAll('sound')
const times = []



const sounds = {
    "a" : document.querySelector('#clap'),
    "s" : document.querySelector('#kick'),
    "d" : document.querySelector('#hihat')
}
document.querySelector('#recording').addEventListener('click',()=>{
    if(document.querySelector('#recording').textContent ==="Start Record"){
    document.querySelector('#recording').textContent = "Stop!" 
    times.length = 0;
    times.push({
        key: "start",
        time: Date.now()
    });
}else document.querySelector('#recording').textContent ="Start Record";
})

document.querySelector('#play').addEventListener('click', () => {
    const startTime = times[0].time;
    
    times.forEach(element => {
        let t = element.time - startTime;
        let sound = sounds[element.key];
        setTimeout(()=>{
            if(element.key !== "start"){
            play(sound);
        }
        }
        ,t)
    });
});


document.addEventListener('keypress',(ev)=>{
    console.log(times);
    const key = ev.key;
    times.push({
        key: key,
        time: Date.now()
    }); 
    let sound = sounds[key];
    
    play(sound);
})

function play(sound){
    sound.currentTime = 0;
    sound.play();
}