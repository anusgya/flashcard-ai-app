# Collaborative Study Feature: Test Cases

This document outlines the test cases for the collaborative study feature.

## 1. Collaborative Lobby (`/collaborative`)

This page allows users to start a new collaborative session or join an existing one.

**Table 1: Test Cases for Collaborative Lobby**

| Test Case ID | Description                      | Input                                                                | Expected Output                                                                                                                                       | Actual Output | Pass/Fail |
| :----------- | :------------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | :-------- |
| TC-1.1       | View Collaborative Study Lobby   | Navigate to the "Collaborative" section after logging in.            | The page should display a list of the user's decks. Each deck should have a "Start Session" button. A "Join a session" button should also be visible. |               |           |
| TC-2.1       | Start a Collaborative Session    | Click the "Start Session" button for any deck.                       | The user is redirected to the collaborative session page for that deck (e.g., `/collaborative/deck-123`). The session should be initialized.          |               |           |
| TC-3.1       | Open Join Session Dialog         | Click the "Join a session" button.                                   | A dialog box appears with an input field for a session code and a "Join Session" button.                                                              |               |           |
| TC-3.2       | Join a Session with Valid Code   | Enter a valid session code and click "Join Session".                 | The user is redirected to the corresponding collaborative session page.                                                                               |               |           |
| TC-3.3       | Join a Session with Invalid Code | Enter an _invalid_ or expired session code and click "Join Session". | An error message is displayed indicating the session code is invalid. The user remains in the lobby.                                                  |               |           |
| TC-3.4       | Join a Session with Empty Code   | Leave the session code field blank and click "Join Session".         | The "Join Session" button should be disabled or show a validation error. The user remains in the lobby.                                               |               |           |

## 2. Collaborative Session Page (`/collaborative/[deckId]`)

This is the main page for the real-time collaborative study session.

**Table 2: Test Cases for Collaborative Session**

| Test Case ID | Description                            | Input                                                                      | Expected Output                                                                                                                    | Actual Output | Pass/Fail |
| :----------- | :------------------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :------------ | :-------- |
| TC-4.1       | Two users in a session                 | User A starts a session, User B joins.                                     | User A and User B can both see each other's avatars and usernames in the "Participants" list. The list should update in real-time. |               |           |
| TC-4.2       | User leaves a session                  | User A closes the browser tab or navigates away from the session.          | User A's avatar and username are removed from the "Participants" list on User B's screen.                                          |               |           |
| TC-4.3       | Multiple users join a session          | User A starts, User B joins, User C joins.                                 | The "Participants" list for all three users should show User A, User B, and User C.                                                |               |           |
| TC-5.1       | Navigate to next card                  | A user clicks the "Next" button.                                           | The flashcard content updates to the next card for _all_ users simultaneously.                                                     |               |           |
| TC-5.2       | Navigate to previous card              | A user clicks the "Previous" button.                                       | The flashcard content updates to the previous card for _all_ users simultaneously.                                                 |               |           |
| TC-5.3       | Previous button disabled on first card | Session is on the first card.                                              | The "Previous" button is disabled and not clickable for all users.                                                                 |               |           |
| TC-5.4       | Next button disabled on last card      | Session is on the last card.                                               | The "Next" button is disabled and not clickable for all users.                                                                     |               |           |
| TC-6.1       | Send a chat message                    | A user types and sends a message in the chat.                              | The message appears in the discussion thread for all users, associated with the sender's profile.                                  |               |           |
| TC-6.2       | Chat is card-specific                  | Users navigate between cards with and without existing chat messages.      | The chat/discussion thread updates to show only messages for the current card.                                                     |               |           |
| TC-7.1       | Late joiner synchronization            | User B joins a session after User A has already navigated to a later card. | User B's screen should immediately display the same card as User A.                                                                |               |           |
| TC-7.2       | Reconnection synchronization           | A user loses and regains internet connection during a session.             | The user's session state (current card, participants, chat) should automatically sync upon reconnection.                           |               |           |
