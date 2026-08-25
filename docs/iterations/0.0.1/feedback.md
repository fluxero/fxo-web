# Repo hygiene — fxo-web

**To:** Shivansh Mishra
**From:** Kieran Purvis
**Date:** 25 August 2026
**Re:** Build artefacts committed to `web-master`, and the `web-master` history rewrite
**Branch reviewed:** `origin/web-master` @ `97f3f30`

---

## Summary

`web-master` currently tracks **11,977 files. Only 57 of them are source.** The other
99.5% are installed dependencies and build output that the deploy pipeline regenerates
from scratch on every run. None of it is used by the live site.

Separately, `web-master` was re-created as a brand-new history on 21 May 2026, which
silently orphaned every clone that existed before that date. Details in section 4.

Nothing here is urgent or broken in production — the site is serving fine. This is about
making the repo cheap to clone and safe to collaborate on.

---

## 1. What's tracked that shouldn't be

| Path | Files | Introduced |
|---|---:|---|
| `node_modules/` | 11,916 | `43ba506` — *Fluxero website v2 - initial commit* |
| `dist/` | 4 | `43ba506` |
| `.claude/launch.json` | 1 | `43ba506` |
| **Actual source** | **57** | — |

The `.gitignore` is already correct — it lists `node_modules/` and `dist/`. The problem is
that it landed in `62d2003`, one commit *after* the files were committed in `43ba506`.

**`.gitignore` only applies to untracked files.** Once a path is in the index, Git keeps
tracking it forever regardless of ignore rules. That's the whole bug — it's a common one,
and it needs an explicit `git rm --cached` to undo.

---

## 2. Why GitHub doesn't need any of it

You're right to expect GitHub to handle this — it already does. Here's the actual deploy
path, from `.github/workflows/pages.yml`:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
- run: npm ci --legacy-peer-deps     # installs dependencies from package-lock.json
- run: npm run build                 # writes a fresh dist/
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist                       # uploads the dist it just built
```

So on every push:

- **`npm ci` ignores the committed `node_modules` entirely.** It deletes the directory
  outright before installing — that's the documented difference between `npm ci` and
  `npm install`. The committed copy is not just unused, it's actively deleted.
- **`npm run build` overwrites `dist/`.** The committed `dist/` is never what ships.
- **`cache: npm` already handles install speed.** That's the supported mechanism for
  avoiding repeat downloads. Committing `node_modules` isn't a faster alternative to it.

Deployment is via the Pages **Actions artifact** (`actions/deploy-pages@v4` against the
`github-pages` environment) — there is no `gh-pages` branch, and no branch is served
directly. So committed build output cannot be what's live even in principle.

Worth noting: the pre-overhaul versions of this site deployed the same way and never had
`node_modules` committed. This was introduced by the v2 initial commit, not inherited.

---

## 3. The fix

From a clean tree on `web-master`:

```bash
# 1. Stop tracking — --cached keeps every file on your disk untouched
git rm -r --cached node_modules dist .claude

# 2. Confirm: should report ~57 files, all source
git ls-files | wc -l

# 3. Commit and push
git commit -m "Stop tracking node_modules, dist and editor config"
git push origin web-master
```

`--cached` is the important flag. It removes files from the index only — your working
copy is not deleted and you won't need to reinstall anything.

Two notes:

- **Add `.claude/` to `.gitignore`** if you keep local agent config there. `launch.json`
  is machine-specific debug config and shouldn't be shared.
- **Everyone else must not `git pull` into a dirty tree** the first time after this lands.
  Their local `node_modules` becomes untracked (harmless) — but tell them, so nobody
  panics at 11,916 deletions in the diff.

### This does not shrink the history

The files stay in past commits, so `.git` remains ~48 MB. Clones still pay for it once.

Purging them properly needs `git filter-repo` or BFG, which **rewrites every commit hash**.
Given section 4, please don't do that unilaterally — talk to me first and we'll pick a
window. Untracking at HEAD gets us most of the practical benefit with zero risk.

---

## 4. The history rewrite — please don't do this again

On 21 May 2026, `web-master` was replaced with a completely new history. `43ba506`
(*Fluxero website v2 - initial commit*) is a **root commit** — it has no parent, and shares
no ancestry whatsoever with what came before.

The consequence, verified today:

```
$ git merge-base web-master origin/web-master
$ echo $?
1                       # no common ancestor exists
```

My local clone showed as *24 ahead, 28 behind* and **could not be pulled or merged** —
Git refuses outright with `fatal: refusing to merge unrelated histories`. Forcing it would
have conflicted on essentially every file. Recovering it meant hard-resetting and manually
auditing what was lost.

To be clear about the content: the v2 initial commit was clearly **seeded from** the
previous state — the component filenames line up (`Hero`, `Navbar`, `Contact`,
`CurtailmentMap`, `Problem`, `Solution`, `Team`, `Technology`, `Traction`), just heavily
rewritten. So the work carried over. What was thrown away was the *ancestry* — every
authorship record, every `git blame`, and every prior commit, going back to September 2025.

Two things did not survive the reseed:

- **`components/AIAssistant.tsx`** (241 lines) — dropped entirely. Low loss, in fairness:
  it POSTed to `api.anthropic.com` from the browser with no auth header, so every request
  401'd and fell through to a hardcoded fallback dictionary. It never actually worked, and
  it can't without a backend proxy — an API key can't ship client-side. Not asking for it
  back; flagging it so we don't rebuild it the same way.
- **`public/fluxero-logo.svg` / `fluxero-logo-text.svg`** — actually deleted earlier, in
  `c9ccd04`. The site now uses raster `public/logo.png`. I've recovered both SVGs from the
  history and they're on the branding drive — please put them back, see below.

If a big overhaul needs a clean slate again, do it as a branch off the existing history —
even a squashed single commit with a real parent keeps `git blame` and lets everyone pull
normally. `git checkout --orphan` should be a deliberate, announced decision, not a side
effect of re-running `git init` in a new folder.

---

## 5. Smaller items

**`CNAME` isn't reaching the build.** It sits at the repo root, but Vite only copies
`public/` into `dist/` — so the deployed artifact contains no `CNAME` file. The custom
domain is currently holding because it's stored in the repo's Pages settings, which is
legitimate. But it means the file in the repo is decorative and misleading. Moving it to
`public/CNAME` makes it real and survives a settings change:

```bash
git mv CNAME public/CNAME
```

Please confirm `fluxero.uk` still resolves after the next deploy either way.

**`--legacy-peer-deps` is a band-aid.** It's masking the React 18 vs `@react-three`
conflict that `65336a4` worked around. Fine for now, but it means `npm ci` isn't validating
the dependency graph, so a genuinely broken dependency set would install silently. Worth
resolving the peer ranges properly at some point.

**Please put the SVG logo back.** This one I'd like done. The mark is currently a 288 KB
PNG being drawn at 20–40 px:

| Asset | Size |
|---|---:|
| `logo.png` | 295,097 bytes |
| `fluxero-logo.svg` | **1,998 bytes** |

That's **148× smaller**, and it's sharp at every size instead of soft on retina. The PNG is
also committed in four places — `logo.png`, `public/logo.png`, `dist/logo.png`,
`dist/assets/logo-Cy5j_har.png` — so it's costing us ~1.15 MB of repo for one logo. (Two of
those disappear anyway once `dist/` is untracked; the root-level duplicate looks accidental
and can go.)

Every in-page use is small enough that vector is strictly better:

- `components/Navbar.tsx:45` — 40 px
- `components/Splash.tsx:48`
- `components/Contact.tsx:297` — 24 px
- `components/H2Calculator.tsx:636,769,879` — 20–24 px

**I've already restored `public/fluxero-logo.svg` in this commit**, so it's just a matter of
swapping those `src="/logo.png"` references to `src="/fluxero-logo.svg"`. I did that because
the commit it came from (`4941ef0`) is unreachable from every branch on the remote — the
rewrite orphaned it, so the file was recoverable only from my local clone.

**One exception — keep a PNG for social.** `index.html` uses the logo for `og:image`
(line 19), `twitter:image` (line 29) and the JSON-LD `logo` (line 38). LinkedIn, X and
WhatsApp don't reliably render SVG previews, so those three must stay pointing at a raster
file. The favicon on line 5 can be SVG with a PNG fallback. Ideally re-export a properly
sized social card from the vector rather than reusing the 288 KB original.

**Stale branches.** `origin/shiv/web-v2` and `origin/web-pub` are both still on the remote.
If they're merged or dead, please delete them so it's obvious which branch is live.

**Workspace file.** I've added `fxo-web.code-workspace.eg` as a committed template and
ignored the live `fxo-web.code-workspace`, so we stop trading editor paths through Git.
Copy the `.eg` to `fxo-web.code-workspace` locally and it stays yours.

---

## Checklist

- [ ] `git rm -r --cached node_modules dist .claude`, commit, push
- [ ] Add `.claude/` to `.gitignore`
- [ ] Tell the team before pushing, so nobody pulls into a dirty tree
- [ ] `git mv CNAME public/CNAME`, then verify `fluxero.uk` after deploy
- [ ] Restore `fluxero-logo.svg` to `public/`, swap the in-page `logo.png` references
- [ ] Keep a raster image for `og:image` / `twitter:image` / JSON-LD only
- [ ] Drop the duplicate root-level `logo.png`
- [ ] Delete `origin/shiv/web-v2` and `origin/web-pub` if dead
- [ ] No history rewrites without agreeing a window first
