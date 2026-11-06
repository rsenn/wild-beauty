# Wild Beauty as an association (Verein) owned by its active users (intent, owner 2026-11-06; nothing decided, nothing built)

## 0. The idea

The owner and a co-founder conceived Wild Beauty together: a platform that belongs to the people who use it. The legal form is a **Verein** (association under the Swiss Civil Code, ZGB Art. 60 ff.) with **Statuten** (articles), so that everything is owned and decided by its **active users**. This is the structural side of the spirit in `docs/DESIGN.md` S1 (a handmade playground, a counterweight to streamlined feed content) and of the principle that users keep full control of their work (`docs/DESIGN.md` S3 goal 9).

## 1. What a Verein is, in short (to verify with a lawyer or a Swiss association advisory service before any step)

- A body of people with a common, non-commercial purpose; the **Statuten** are in writing and state the purpose, the means (fees, donations) and the organisation. A **founding assembly** adopts them and elects a board (Vorstand). The general assembly (Mitgliederversammlung) is the highest organ; every member has a vote by default, which fits "decided by the active users".
- Usually no entry in the commercial register is needed unless it runs a commercial business or is audit-bound; the Verein exists from the adoption of the Statuten. Liability is limited to the association's assets, in the rule. A non-profit purpose can allow **tax exemption**, decided by the canton.
- Open: the exact rules (minimum number of founders, register, tax, liability of the board, accounting, data protection duties) must be checked, and where the Verein is seated (canton).

## 2. What it means for the product and the project (design consequences, to decide)

1. **Who is a member?** An account is not a membership. Options: a fee, a declaration, or a number of contributions; a guest (`docs/GUESTS.md`) is never a member. "Active user" needs a definition in the Statuten (open: logged in during the last N months, or has published, or paid).
2. **Decisions in the tool?** The assembly can be physical or online. A later feature could be a members list, proposals and votes; not before the Statuten say how a vote counts. Not built, not planned for the PoC.
3. **Ownership:** the code (today the owner's; a licence the Verein can rely on, open source is the natural fit, which one is open), the domains and the host, the data. The user's photos and content stay the user's in every case (goal 9); the Verein only holds what users entrust to it. Moving the server, the domain names and the backups into the Verein's name is a step of its own.
4. **Money and costs:** hosting, backup, domain; fees and donations; no ads and no selling of user data (a Statuten-level promise, in line with `docs/SEO.md` privacy first). A marketplace, if it ever comes, would be under the Statuten too.
5. **Duties:** privacy notice and retention (`docs/DESIGN.md` S3 goal 9 items), contact and legal notice, terms for users, a way to report content. These are the pre-post checklist items in `TODO.md`, and the Verein would be their natural owner.
6. **Public wording:** the Verein can be mentioned on the site once it exists; until then "photo collages and galleries" stays the public line (`docs/SEO.md` S5).

## 3. Steps (suggestion, none started)

1. Write down the purpose and values together with the co-founder (one page, in German and French).
2. Find a Swiss association template and advice; draft the Statuten (purpose, membership, fees, organs, voting, dissolution, data and code ownership, non-profit clause).
3. Decide the licence of the code and who holds the rights.
4. Hold the founding assembly with the first members (artists and makers who already try it: János, others), elect the board.
5. Move domains, host and backups to the Verein; open the account for fees and donations.
6. Only then: membership in the tool, the public mention, terms and privacy text in the Verein's name.

## 3b. Why it matters for funding (owner, 2026-11-06: "it's important for funding")

The Verein is the **precondition for money**, not only a nice structure. Typical reasons (each to be checked against the actual funder):

- Culture and project funders usually fund a legal entity with a **non-profit, culture or education purpose**, not a private person or a company. Places to look into, none checked yet: cantonal and city culture offices, Pro Helvetia, Migros-Kulturprozent, lottery funds (Swisslos/Loterie Romande), private foundations, and open-source or digital-commons funders (for the code).
- **Tax exemption** (cantonal decision on a public-benefit purpose) can make donations and sponsoring deductible for donors, which makes asking for money far easier.
- Members' **fees**, donations and crowdfunding need an account and a body that can account for them transparently.
- A funder wants a **budget, a report and clear ownership**: so the Statuten, the accounts and the "who owns the code, the domain and the host" answers (S2.3) must exist before the first application.
- The open-source licence and the "users keep their work, no ads, no selling of data" promises are an asset when applying, so write them into the Statuten.

Consequence for the order of work: the Verein steps (S3) have a long lead time and need no code, so they can run **in parallel** with the product work; the product only has to stay presentable (the guest accounts, the privacy and contact notices) for the first application.

## 4. Open

Name of the Verein (the same as the product?); seat (canton); languages of the Statuten (de and fr); membership definition and fee; the licence; whether the first members join before the site is public; who may speak for the project meanwhile.
