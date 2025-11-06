# Vercel Preview Deployments — Contributor Guide

## What you get
Every pull request automatically gets a Vercel **Preview URL** so reviewers can open the app on desktop or phone.

## One-time setup (maintainer)
1. Go to Vercel → “Add New… Project” → import this GitHub repo.
2. Leave defaults (Framework: Next.js). No custom vercel.json required.
3. Ensure **Preview Deployments** are enabled for pull requests (default).
4. (When later needed) add environment variables in Vercel Project Settings → Environment Variables (handled in Epoch 0002).

## Using previews (contributors)
- Open a PR; Vercel will post a comment with the **Preview URL**.
- Click the Preview to test on-device. Share the link with reviewers.
- If your PR is updated, Vercel posts updated preview links automatically.

## Troubleshooting
- If the build fails, check the Vercel build logs linked from the PR.
- If no preview appears, confirm the repo is connected in Vercel and PR builds are enabled.

---
_This guide is referenced from the main README._
