let objects = [];
let selected = null;
let running = false;
let scripts = new Map();

let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

/* ================= OBJECTS ================= */
function addObject(){
    let obj = {
        id: crypto.randomUUID(),
        x:100,
        y:100,
        w:50,
        h:50,
        color:"#3b82f6"
    };

    objects.push(obj);
    renderList();
}

/* ================= LIST ================= */
function renderList(){
    let el = document.getElementById("list");
    el.innerHTML = "";

    objects.forEach((o,i)=>{
        let d = document.createElement("div");
        d.innerText = "Part " + i;
        d.onclick = ()=> selected = o;
        el.appendChild(d);
    });
}

/* ================= ATTACH SCRIPT ================= */
function attach(){
    if(!selected) return;

    scripts.set(selected.id,
        document.getElementById("code").value
    );

    log("Script attached");
}

/* ================= SCRIPT ENGINE ================= */
function runScript(obj){

    let code = scripts.get(obj.id);
    if(!code) return;

    let lines = code.split("\n");

    for(let line of lines){
        let p = line.trim().split(" ");

        if(p[0]==="move" && p[1]==="x")
            obj.x += Number(p[2]);

        if(p[0]==="move" && p[1]==="y")
            obj.y += Number(p[2]);

        if(p[0]==="set" && p[1]==="color")
            obj.color = p[2];
    }
}

/* ================= RENDER ================= */
function render(){
    ctx.clearRect(0,0,900,500);

    for(let o of objects){
        if(running) runScript(o);

        ctx.fillStyle = o.color;
        ctx.fillRect(o.x,o.y,o.w,o.h);
    }
}

/* ================= LOOP ================= */
function loop(){
    render();
    requestAnimationFrame(loop);
}
loop();

/* ================= PLAY ================= */
function play(){ running = true; }
function stop(){ running = false; }

/* ================= LOG ================= */
function log(msg){
    document.getElementById("output").innerText = msg;
}