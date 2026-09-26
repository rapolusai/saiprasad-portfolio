# Rapolu`s — Portfolio

A fast, dependency-free portfolio with detailed project stories and a GitHub-backed publishing studio. The public site is static; updates are versioned as normal Git commits and deployed automatically.

## What is included

- Responsive modern portfolio with verified profile content
- LinkedIn integration and a prepared GitHub profile link
- Project/blog case studies with challenge, approach, outcome, future direction, highlights, links, and screenshot galleries
- Owner-only `/admin.html` publishing studio for creating, editing, previewing, publishing, and removing stories
- Atomic GitHub commits: a story and all its screens land in one commit
- GitHub Actions validation and automatic GitHub Pages deployment
- Optional Firebase Hosting configuration
- No framework, runtime dependency, database bill, or vendor-specific CMS

## Add the exact GitHub profile and resume

Edit `content/site.json`:

```json
{
  "resumeUrl": "assets/resume.pdf",
  "social": {
    "linkedin": "https://in.linkedin.com/in/rapolusai",
    "github": "https://github.com/rapolusai"
  }
}
```

Put a resume at `assets/resume.pdf` if you want the resume link enabled.

## Deploy free with GitHub Pages (recommended)

1. Create a public GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. The included workflow validates and publishes the site after every push.
5. The deployment URL appears in the workflow summary and in **Settings → Pages**.

Every future commit to `main`—whether made locally or through the Studio—starts a new deployment.

## Use the Project Studio

1. Open `https://YOUR-SITE/admin.html`.
2. Create a GitHub fine-grained personal access token:
   - Limit repository access to this portfolio repository.
   - Grant **Contents: Read and write** only.
3. Enter the repository name, `main` branch, and token.
   The Studio verifies that the token belongs to `@rapolusai`; all other GitHub identities are denied.
4. Add or edit a story, attach screenshots, preview it, and choose **Publish**.
5. The Studio creates one Git commit. GitHub Actions updates the website shortly afterward.

The token is kept only in the browser tab and is removed when the tab closes. See `SECURITY.md` for the security model.

## Optional Firebase Hosting

Firebase Hosting can serve the same static files using the included `firebase.json`:

```text
firebase login
firebase use --add
firebase deploy --only hosting
```

For automatic Firebase deployment, add a separate GitHub Actions workflow after creating the Firebase project and repository secret. The current workflow deliberately uses GitHub Pages because it requires no cloud project, billing account, or deployment secret.

## Local preview

Run `node scripts/serve.mjs`, then open `http://127.0.0.1:4173`. Opening files directly with `file://` will prevent browsers from loading the JSON content.

## Content model

- `content/site.json` — profile and public links
- `content/projects.json` — project stories
- `assets/uploads/` — screenshots published by the Studio
- `assets/js/admin.js` — secure GitHub publishing flow

The two sample stories are clearly written as templates. Replace them with real project details and metrics in the Studio before promoting the site publicly.
