<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>wt% → Stoichiometry (Al, Ce, Si, Ni, Mg)</title>
  <style>
    :root { font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; }
    body { margin: 2rem; }
    h1 { margin-bottom: .25rem; }
    .card { max-width: 720px; padding: 1rem 1.25rem; border: 1px solid #e5e7eb; border-radius: 12px; }
    .row { display: grid; grid-template-columns: 110px 1fr; gap: .75rem; align-items: center; margin:.5rem 0; }
    input[type="number"] { width: 120px; padding: .4rem .5rem; }
    .muted { color: #6b7280; font-size: .9rem; }
    .btn { margin-top: .75rem; padding:.55rem .9rem; border:1px solid #111827; border-radius:10px; background:#111827; color:#fff; cursor:pointer; }
    .btn:disabled { opacity:.5; cursor:not-allowed; }
    .tag { display:inline-block; padding:.2rem .45rem; background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; margin-right:.3rem; }
    .result { margin-top:1rem; padding:.8rem; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; }
    .grid { display:grid; grid-template-columns: repeat(5, 1fr); gap:.5rem; margin:.5rem 0 0; }
    .grid > label { display:flex; align-items:center; gap:.4rem; }
    hr { border:none; border-top:1px solid #e5e7eb; margin:1rem 0; }
  </style>
</head>
<body>
  <h1>wt% → Stoichiometry</h1>
  <div class="muted">Select elements and enter wt%. Renormalization to 100% is automatic.</div>
  <div class="card">
    <div class="grid">
      <label><input type="checkbox" class="el" value="Al" checked> <span class="tag">Al</span></label>
      <label><input type="checkbox" class="el" value="Ce" checked> <span class="tag">Ce</span></label>
      <label><input type="checkbox" class="el" value="Si"> <span class="tag">Si</span></label>
      <label><input type="checkbox" class="el" value="Ni"> <span class="tag">Ni</span></label>
      <label><input type="checkbox" class="el" value="Mg"> <span class="tag">Mg</span></label>
    </div>
    <hr/>
    <div id="inputs"></div>
    <button class="btn" id="calcBtn">Convert</button>
    <div id="out" class="result" style="display:none;"></div>
  </div>

  <script>
    const AW = { Al: 26.9815385, Ce: 140.116, Si: 28.085, Ni: 58.6934, Mg: 24.305 };
    const inputsDiv = document.getElementById("inputs");
    const outDiv = document.getElementById("out");
    const boxes = [...document.querySelectorAll(".el")];

    function renderInputs() {
      inputsDiv.innerHTML = "";
      boxes.filter(b => b.checked).forEach(b => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `<div>${b.value} wt%</div>
          <div><input type="number" step="0.0001" min="0" value="0" id="wt_${b.value}" /></div>`;
        inputsDiv.appendChild(row);
      });
    }
    boxes.forEach(b => b.addEventListener("change", renderInputs));
    renderInputs();

    function gcd(a,b){return b?gcd(b,a%b):a}
    function gcdMany(arr){return arr.reduce((acc,v)=>gcd(acc,v))}

    function bestIntegerFormula(ratios, maxMult=24, tol=0.05){
      let best=null;
      for(let mult=1; mult<=maxMult; mult++){
        const scaled=Object.fromEntries(Object.entries(ratios).map(([k,v])=>[k,v*mult]));
        const err=Object.values(scaled).reduce((s,x)=>s+Math.abs(Math.round(x)-x),0);
        if(!best || err<best.err){ best={err, mult, scaled}; if(err<tol) break; }
      }
      let ints=Object.fromEntries(Object.entries(best.scaled).map(([k,v])=>[k,Math.round(v)]));
      const g=gcdMany(Object.values(ints).map(v=>Math.max(1,v)));
      ints=Object.fromEntries(Object.entries(ints).map(([k,v])=>[k,Math.max(1,Math.round(v/g))]));
      return {ints, mult:best.mult};
    }

    function wtToStoich(){
      const elems = boxes.filter(b=>b.checked).map(b=>b.value);
      if(!elems.length){ outDiv.style.display="block"; outDiv.textContent="Select at least one element."; return; }

      let wt={}, sum=0;
      elems.forEach(e=>{
        const v=parseFloat(document.getElementById(`wt_${e}`).value||"0");
        wt[e]=Math.max(0,v); sum+=wt[e];
      });
      if(sum===0){ outDiv.style.display="block"; outDiv.textContent="Please enter non-zero wt% values."; return; }
      elems.forEach(e=>wt[e]=wt[e]*100/sum);

      const moles={}; elems.forEach(e=>moles[e]=wt[e]/AW[e]);
      const smallest=Math.min(...elems.map(e=>moles[e]).filter(v=>v>0));
      const ratios={}; elems.forEach(e=>ratios[e]=moles[e]/smallest);

      const {ints, mult}=bestIntegerFormula(ratios, 24, 0.05);
      const order=["Al","Ni","Si","Mg","Ce"].filter(e=>elems.includes(e));
      const formula = order.map(e => ints[e]===1 ? e : e+ints[e]).join("");

      outDiv.style.display="block";
      outDiv.innerHTML = `
        <div><strong>Small-integer stoichiometry:</strong> ${formula}</div>
        <div class="muted">Best multiplier ×${mult}</div>
        <hr/>
        <div><strong>Normalized atomic ratios</strong> (smallest = 1):</div>
        <div>${order.map(e=>`${e}: ${ratios[e].toFixed(4)}`).join(" &nbsp; | &nbsp; ")}</div>
      `;
    }
    document.getElementById("calcBtn").addEventListener("click", wtToStoich);
  </script>
</body>
</html>

