#!/usr/bin/env python3
"""
Convert wt% compositions (Al, Ce, Si, Ni, Mg) to a stoichiometric/empirical formula.

Features
- Prompts the user to choose which elements are present (subset of Al, Ce, Si, Ni, Mg).
- Prompts for wt% of each chosen element (must sum ~100; small drift tolerated).
- Converts to moles, normalizes, and finds a small-integer stoichiometry.
- Prints both atomic ratios and the compact formula (e.g., Al4Ce, Al2NiCe).
"""

from math import isclose

# Atomic weights (IUPAC conventional): g/mol
AW = {
    "Al": 26.9815385,
    "Ce": 140.116,
    "Si": 28.085,
    "Ni": 58.6934,
    "Mg": 24.305,
}

ALLOWED = ["Al", "Ce", "Si", "Ni", "Mg"]

def ask_elements():
    print("Select elements present (subset of: Al, Ce, Si, Ni, Mg).")
    print("Enter as comma-separated symbols, e.g.  Al,Ce,Si  :")
    while True:
        raw = input("> ").strip()
        if not raw:
            print("Please enter at least one element.")
            continue
        elems = [e.strip() for e in raw.split(",") if e.strip()]
        bad = [e for e in elems if e not in ALLOWED]
        if bad:
            print(f"Unsupported symbol(s): {', '.join(bad)}. Allowed: {', '.join(ALLOWED)}")
            continue
        # dedupe but preserve order
        seen, out = set(), []
        for e in elems:
            if e not in seen:
                seen.add(e)
                out.append(e)
        return out

def ask_wtperc(elems):
    print("\nEnter wt% for each selected element.")
    wt = {}
    for e in elems:
        while True:
            try:
                val = float(input(f"  {e} wt%: ").strip())
                if val < 0:
                    raise ValueError
                wt[e] = val
                break
            except ValueError:
                print("  Please enter a non-negative number.")
    s = sum(wt.values())
    if not isclose(s, 100.0, rel_tol=0, abs_tol=0.6):
        print(f"\nNote: provided wt% sum to {s:.3f} (not ~100). I will renormalize.")
    # Renormalize to 100
    if s > 0:
        for e in wt:
            wt[e] = wt[e] * 100.0 / s
    return wt

def wt_to_moles(wt):
    moles = {e: wt[e] / AW[e] for e in wt}
    return moles

def normalize_to_smallest(moles):
    smallest = min(v for v in moles.values() if v > 0)
    return {e: v / smallest for e, v in moles.items()}

def best_integer_formula(ratios, max_mult=24, tol=0.05):
    """
    Try integer multipliers 1..max_mult to make all coefficients ~integers.
    Choose the multiplier that minimizes total fractional deviation.
    """
    best = None
    for mult in range(1, max_mult + 1):
        scaled = {e: ratios[e] * mult for e in ratios}
        frac_err = sum(abs(round(x) - x) for x in scaled.values())
        if best is None or frac_err < best[0]:
            best = (frac_err, mult, scaled)
            if frac_err < tol:  # good enough
                break
    _, mult, scaled = best
    ints = {e: int(round(scaled[e])) for e in scaled}
    # avoid all-zero
    if all(v == 0 for v in ints.values()):
        ints = {e: 1 for e in ints}
    # reduce by gcd if possible
    from math import gcd
    from functools import reduce
    g = reduce(gcd, [max(1, v) for v in ints.values()])
    if g > 1:
        ints = {e: v // g for e, v in ints.items()}
    return ints, mult

def formula_string(ints):
    # Sort by a nice order (optional): Al, Ni, Si, Mg, Ce last or customize
    order = [e for e in ["Al", "Ni", "Si", "Mg", "Ce"] if e in ints]  # tweak if you prefer Ce at end
    parts = []
    for e in order:
        n = ints[e]
        if n == 1:
            parts.append(e)
        else:
            parts.append(f"{e}{n}")
    return "".join(parts)

def main():
    print("=== wt% → Stoichiometric Ratio (Al, Ce, Si, Ni, Mg) ===")
    elems = ask_elements()
    wt = ask_wtperc(elems)

    moles = wt_to_moles(wt)
    ratios = normalize_to_smallest(moles)
    ints, mult = best_integer_formula(ratios)

    # Pretty printing
    print("\n--- Results ---")
    print("Atomic ratios (normalized to the smallest = 1):")
    for e in elems:
        print(f"  {e}: {ratios[e]:.4f}")
    print("\nSmall-integer stoichiometry:")
    print("  " + formula_string(ints))
    print(f"\n(notes) Best multiplier tried: ×{mult}. "
          "If you want stricter/looser integerization, adjust max_mult/tol in the code.")

if __name__ == "__main__":
    main()
