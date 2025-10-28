# Stoichiometry
# wt% → Stoichiometric Ratio (Al, Ce, Si, Ni, Mg)

A tiny browser tool that converts **weight percent** compositions into a **small-integer stoichiometric formula** (empirical formula). Runs fully client-side—no backend, no dependencies.

**Live site (GitHub Pages):** https://<your-username>.github.io/<repo>/

## How it works
1. Select which of {Al, Ce, Si, Ni, Mg} are present.
2. Enter wt% for each (sum doesn’t have to be exactly 100; we renormalize).
3. The app converts to moles using IUPAC atomic weights, normalizes to the smallest, then searches for the best small-integer fit (by trying multipliers and minimizing rounding error).

## Dev
- Files: `index.html`, `script.js`
- No build step; just open `index.html` locally or host via GitHub Pages.

## License
MIT
