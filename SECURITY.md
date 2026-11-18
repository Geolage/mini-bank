# Security policy

## Scope

MiniBank is a **demonstration** project. It uses synthetic seed data, demo credentials
(`admin` / `11111111`, `visitor` / `00000000`), a development JWT secret, and stores the
session token in `localStorage` on purpose. These are documented trade-offs in the README,
not vulnerabilities to report.

## Reporting a real issue

If you find something that would still be a problem in a production deployment of this
code — for example an authorization bypass, an injection, or a way to move money between
accounts you do not own — please report it privately:

1. Open a private security advisory from the repository's **Security** tab, or
2. Email the maintainer listed in the repository profile.

Include reproduction steps and the affected commit. Please do not open a public issue or
PR for an unpatched vulnerability.

## Supported versions

Only the default branch (`main`) receives fixes; there are no released versions.
