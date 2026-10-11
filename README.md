# EPIWORK

**Live workshops. Step by step. Nobody left behind.**

EpiWork helps Epitech students prepare and run better workshops in **the Hub**. The host splits what they want to teach into small steps, launches the workshop live, and the participants follow it at their own pace from their laptop. While they work, the host sees where everyone is, who is stuck, and who is waiting for an answer to be checked.

> EpiWork is a **proof of concept**, built by Epitech students to try the idea out in real Hub workshops. It is not ready for production yet.

## The Hub and its workshops

At Epitech, the Hub is where students build free projects, give talks and run workshops. A Hub workshop is a 2 to 3 hour session where one student teaches the others something they are good at: a language, a tool, a technique.

The subjects are usually great. The activity often is not: the host knows the topic but has little time or method to turn it into a hands-on session. Explanations go too fast, exercises are improvised, and in a room full of people the host only finds out who is lost when someone raises a hand. Fast participants wait, slower ones drop off, and the host spends the session walking from laptop to laptop asking "where are you at?".

## What EpiWork changes

- **Easier to prepare.** The host writes the workshop as a list of short steps instead of a slide deck plus improvised exercises. A preview shows exactly what participants will see.
- **Easier to follow.** Participants get one clear instruction at a time and move on when they are ready, without losing the thread.
- **More fun.** Steps can ask questions, checkpoints turn the session into a series of small challenges, and everyone sees their progress grow until the finish screen.
- **Nobody left behind.** The host sees the whole room at a glance and spends their time helping the people who need it.

## How a workshop goes

1. **The host prepares the workshop.** It is a list of steps, each with a title and instructions. A step can ask a question (free text, multiple choice, or a simple "I did it" confirmation). Some steps are **checkpoints**: the participant cannot go further until the host approves their answer.
2. **The host launches it.** EpiWork gives a short join code to share with the room, on the projector or the board.
3. **Participants join with the code** and start at step 1. Each step unlocks the next one when it is done.
4. **Participants ask for help from the app.** One click on "I need help" and the host sees it, along with the step they are on.
5. **The host follows the session live.** A progress rail shows every participant on their current step. Help requests and checkpoint answers are pinned at the top under "Needs you", where the host can resolve or approve them. A timeline tells the story of the session as it happens.
6. **Participants finish and give feedback.** At the end, each one can rate the workshop from 1 to 5 stars and leave a comment, so the host knows what to improve next time.
7. **The host ends the session.** It is saved to the history, with who joined, how far each participant got, and all the feedback.

## What each person can do

In the app, hosts have an **admin** account and participants a **student** account.

### Hosts

- Create and edit workshops: icon, title, description and steps.
- Preview a workshop exactly as a participant will see it.
- Launch a workshop and share its join code.
- Follow a live session: progress of each participant, help requests, checkpoint answers, timeline of what happened.
- Approve checkpoint answers and mark help requests as resolved.
- Browse the history of past sessions with their results and feedback.
- Manage accounts: create other host accounts, reset a password, delete an account.

### Participants

- Sign up with their Epitech email (`firstname.lastname@epitech.eu`).
- Join a live workshop with the code given by the host.
- Work through the steps, answer questions, ask for help.
- Rate a workshop when they finish it.
- See their dashboard: workshops joined, workshops finished, steps completed.
- Read back any workshop they took part in, even after the session is over.

### Everyone

- Edit their profile and change their password.
- Pick an accent color and switch between light and dark themes.

## Vocabulary

| Term | Meaning |
|---|---|
| **Hub** | The Epitech space for free projects, talks and student-run workshops. |
| **Host** | The student who prepares and runs a workshop (an admin account in the app). |
| **Participant** | A student who joins a workshop (a student account in the app). |
| **Workshop** | A hands-on lesson made of ordered steps. It can be run many times. |
| **Step** | One instruction to follow. Finishing it unlocks the next one. |
| **Checkpoint** | A step whose answer the host must approve before the participant moves on. |
| **Session** | One live run of a workshop, from the moment it is launched until it is ended. |
| **Join code** | The short code participants type to join the live session. |
| **History** | The list of past sessions, with their participants and feedback. |

## Current limits

Because EpiWork is a proof of concept, a few things are deliberately simple:

- Only **one workshop can be live at a time** across the whole app.
- Live screens refresh every few seconds rather than instantly.
- There is no "forgot my password" email. A host resets passwords from the Accounts page.
- Participants must use an Epitech email address to sign up.

## Running it

Installation, configuration, architecture and contribution rules are in [DEVELOPERS.md](DEVELOPERS.md).
