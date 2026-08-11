# Security notes

The publishing studio is a static client that uses GitHub's API. It has no server and stores no passwords.

- Use a fine-grained GitHub token limited to this repository.
- Grant only **Contents: Read and write**.
- The Studio verifies the authenticated GitHub account and allows only `@rapolusai` to continue.
- The token is stored in `sessionStorage`, so closing the tab removes it.
- The repository name and branch are stored in `localStorage` for convenience; they are not secrets.
- Never commit a token into this repository or add one to `content/site.json`.
- The admin page escapes project content before rendering it and applies a restrictive Content Security Policy.

If a token is ever exposed, revoke it immediately in GitHub settings and create a replacement.
