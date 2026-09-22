# Bespoke automatic handoff

The wizard stays on GitHub Pages. Save, Open, and Send call one Netlify function.
That function is the only place that holds a GitHub token.

Leads click **Save** to store the current design, **Open** to load it on another
computer, and **Send to Britt** to start the existing Spoke Signals workflow.
Open asks for the lesson and the edit code. A wrong code returns “That code is
not right. Try again.” The edit code is at least 4 characters. There is no account.

Send does not push to `main` and does not run `bespoke-apply-selection.py`. The
workflow opens a draft pull request. Britt’s merge is still the greenlight. No
lesson HTML is built from this path.

The browser still keeps a convenience copy. **For builders** can still download a
design file. That download is not the lead’s main step.

Drafts are saved only when someone clicks Save or Send. Typing does not create a
commit. Each draft is encrypted with a key derived from the token and stored on
the branch `bespoke-drafts`, not on `main`. The Pages site never receives the token.

## One-time setup

Do not paste the token into a pull request, an issue, a chat, or any file in this
repository.

1. Create a fine-grained personal access token limited to `doclegg05/Curriculum-Employability-Skills`.
   - Repository access: only this repository.
   - Contents: Read and write, so Save can update `bespoke-drafts`.
   - Actions: Read and write, so Send can start `spoke-signals.yml`.
2. Store that token as a Netlify secret named `BESPOKE_GITHUB_TOKEN`.
3. Deploy this repository to Netlify with publish directory `netlify/site` and functions directory `netlify/functions`. No build command. The site root is only a short note. The wizard is not hosted there.
4. Set the Pages wizard’s API base. In `bespoke/handoff-config.json`, set `apiBase` to `https://YOUR-SITE.netlify.app/api/bespoke`, then publish that file on the Pages branch. The URL is public. The token is not part of it.

Until the secret exists, the function replies that saving is not connected. Until
`apiBase` is published, the Pages wizard does not call the function and shows the
same message. Nothing is written to `main` in either case.

Replacing the token changes the encryption key. Designs saved under the old token
cannot be opened. Leads choose Save again after a rotation.

Do not merge `bespoke-drafts` into `main`. That branch holds encrypted drafts only.
