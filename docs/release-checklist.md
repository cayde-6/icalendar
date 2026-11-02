# Release checklist

## 1. Verify

On `main`, with a clean working tree:

```
npm ci
npm run verify
```

`verify` runs `check` (typecheck), `build`, and `test:coverage` — it must
pass locally before tagging.

## 2. Bump version and changelog

Bump the version in both `package.json` and `package-lock.json` with
`npm version patch --no-git-tag-version` (use `minor` or `major` when
appropriate), following [`versioning.md`](versioning.md)'s semver rules.
Add a dated entry to `CHANGELOG.md`, then run `npm run verify` again.

## 3. Tag and push

```
git add package.json package-lock.json CHANGELOG.md
git diff --cached
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main vX.Y.Z
```

Review the staged diff for secrets and private calendar data before committing.

## 4. What the release workflow does

Pushing the tag triggers `.github/workflows/release.yml`, which:

- fails fast if the tag (without its `v`) doesn't match `package.json`'s
  `version` — before installing anything
- checks out, runs `npm ci && npm run verify`
- packs the exact tarball that will be published (`npm pack`) and passes
  it from the `verify` job to the `publish` job as a build artifact
- checks whether this exact version is already on npm
  (`.github/scripts/npm-published.mjs`); if so, verifies its integrity
  against the packed tarball and skips publishing only when they match.
  Registry errors or a different tarball stop the release
- otherwise publishes it to npm (`npm publish --access public
  --provenance`, via Trusted Publishing — no token involved)
- creates a GitHub release (`gh release create --generate-notes
  --verify-tag`) with that same tarball attached, or updates the attachment
  if the release already exists

An unchanged tag can be retried after a transient failure. If a fix changes
the package, bump to a new patch version and push a new tag; do not move or
delete the old tag. npm permanently blocks republishing a version, even
after unpublishing it.

## CLI behavior

Run credentialed checks only when explicitly requested, using a dedicated
test calendar. CI's packaged CLI smoke test uses only `--help` and `--version`.

- `--help` works without `.env`
- `--version` works without `.env`
- `calendars list` works against target CalDAV account
- `events create` works against target calendar
- `events update` can change attendees
- `events delete` cleans up the test object

## Invite behavior

- organizer CN is set as expected
- invite arrives in target client(s)
- attendee updates propagate correctly

## Packaging

- `bin` entry works locally via `npm link` or `node dist/cli.js`
- `README.md` matches actual CLI behavior
- `.env.example` matches current env contract

## Security

- `.env` ignored
- no secrets in README / docs / screenshots
- if a secret was ever committed, rewrite history and rotate it
