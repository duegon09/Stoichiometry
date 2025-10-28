// Atomic weights (IUPAC conventional)
const AW = { Al: 26.9815385, Ce: 140.116, Si: 28.085, Ni: 58.6934, Mg: 24.305 };

const allowed = ["Al", "Ce", "Si", "Ni", "Mg"];
const inputsDiv = document.getElementById("inputs");
const calcBtn = document.getElementById("calcBtn");
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

function wtToStoich() {
  const elems = boxes.filter(b => b.checked).map(b => b.value);
  if (elems.length === 0) {
    outDiv.style.display = "block";
    outDiv.innerHTML = "Select at least one element.";
    return;
  }
  // Collect wt%
  let wt = {};
  let sum = 0;
  elems.forEach(e => {
    const v = parseFloat(document.getElementById(`wt_${e}`).value || "0");
    wt[e] = Math.max(0, v);
    sum += wt[e];
  });
  if (sum === 0) {
    outDiv.style.display = "block";
    outDiv.innerHTML = "Please enter non-zero wt% values.";
    return;
  }
  // Renormalize to 100
  elems.forEach(e => (wt[e] = wt[e] * 100 / sum));

  // Convert to moles
  const moles = {};
  elems.forEach(e => (moles[e] = wt[e] / AW[e]));

  // Normalize to smallest
  const smallest = Math.min(...elems.map(e => moles[e]).filter(v => v > 0));
  const ratios = {};
  elems.forEach(e => (ratios[e] = moles[e] / smallest));

  // Find best small-integer fit
  const { ints, mult } = bestIntegerFormula(ratios, 24, 0.05);

  // Compose formula string (RE/Al-first order preference)
  const order = ["Al", "Ni", "Si", "Mg", "Ce"].filter(e => elems.includes(e));
  const formula = order.map(e => (ints[e] === 1 ? e : `${e}${ints[e]}`)).join("");

  // Print
  outDiv.style.display = "block";
  outDiv.innerHTML = `
    <div><strong>Small-integer stoichiometry:</strong> ${formula}</div>
    <div class="muted">Best multiplier ×${mult}. (We scaled atomic ratios and rounded.)</div>
    <hr/>
    <div><strong>Normalized atomic ratios</strong> (smallest = 1):</div>
    <div>${order.map(e => `${e}: ${ratios[e].toFixed(4)}`).join(" &nbsp; | &nbsp; ")}</div>
    <div class="muted" style="margin-top:.5rem;">Tip: If results look too “large”, tweak tolerance or multiplier search in script.js.</div>
  `;
}

function bestIntegerFormula(ratios, maxMult = 24, tol = 0.05) {
  let best = null;
  for (let mult = 1; mult <= maxMult; mult++) {
    const scaled = Object.fromEntries(Object.entries(ratios).map(([k, v]) => [k, v * mult]));
    const fracErr = Object.values(scaled).reduce((s, x) => s + Math.abs(Math.round(x) - x), 0);
    if (!best || fracErr < best.err) {
      best = { err: fracErr, mult, scaled };
      if (fracErr < tol) break;
    }
  }
  const ints = Object.fromEntries(Object.entries(best.scaled).map(([k, v]) => [k, Math.round(v)]));
  // Reduce by GCD
  const g = gcdMany(Object.values(ints).map(v => Math.max(1, v)));
  const reduced = Object.fromEntries(Object.entries(ints).map(([k, v]) => [k, Math.max(1, Math.round(v / g))]));
  return { ints: reduced, mult: best.mult };
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function gcdMany(arr) { return arr.reduce((acc, v) => gcd(acc, v)); }

calcBtn.addEventListener("click", wtToStoich);
