"# QuizBee" 
<<<<<<< HEAD
# University Q&A Forum (QuizBee)
=======
# University Q&A Forum 
>>>>>>> 96f6f4187b9395b0ba11ff563a4f6f896df6625a

A full-stack Q&A forum for university communities where users can register, log in, ask questions, comment on questions, and manage their profile.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express.js
- Database: MongoDB (local)
<<<<<<< HEAD

## Project Structure

```text
QuizBee/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
└── server/
    └── src/
        ├── middleware/
        ├── models/
        └── routes/
```

## Features

### 1. User Authentication
- Register with:
  - unique username
  - password
  - confirm password
- Login with:
  - username
  - password

### 2. User Profile
Users can view and update optional profile fields:
- name
- phone number
- role (`student`, `senior student`, `lecturer`)

### 3. Question Posting
- Post text-only questions
- Edit own questions
- Delete own questions

### 4. Commenting
- Comment on questions

### 5. Database
- MongoDB URI: `mongodb://127.0.0.1:27017/quiz`
- Collections:
  - users
  - questions
  - comments

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
- `POST /register` - create new user
- `POST /login` - authenticate user

### Questions
- `GET /questions` - fetch all questions
- `GET /questions/:id` - fetch one question with comments
- `POST /questions` - create new question (auth required)
- `PUT /questions/:id` - update own question (auth required)
- `DELETE /questions/:id` - delete own question (auth required)

### Comments
- `POST /comments` - create new comment (auth required)

### Profile
- `GET /profile` - fetch current user profile (auth required)
- `PUT /profile` - update current user profile (auth required)

## Data Models

### User
- `username` (String, required, unique)
- `password` (String, required, hashed)
- `name` (String, optional)
- `phone` (String, optional)
- `role` (String, optional: `student` | `senior student` | `lecturer`)

### Question
- `text` (String, required)
- `author` (ObjectId -> User, required)
- timestamps

### Comment
- `text` (String, required)
- `author` (ObjectId -> User, required)
- `question` (ObjectId -> Question, required)
- timestamps

## Prerequisites

- Node.js 18+ recommended
- npm 9+ recommended
- MongoDB running locally

## Setup Instructions


### 1. Install server dependencies

```Terminal
cd server
npm install
```

### 2. Configure server environment

Create `server/.env` with:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quiz
JWT_SECRET=quiz_jwt_secret_key_change_in_production
```

### 3. Install client dependencies

```Terminal
cd ../client
npm install
```

## Running the App

### Start backend

```Terminal
cd server
npm run dev
```

### Start frontend (new terminal)

```Terminal
cd client
npm run dev
```

Frontend URL:
- `http://localhost:3000`

Backend URL:
- `http://localhost:5000`

## Notes

- Questions can only be edited/deleted by their author.
- Deleting a question also deletes its comments.

=======
>>>>>>> 96f6f4187b9395b0ba11ff563a4f6f896df6625a
