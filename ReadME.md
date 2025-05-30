# Questlog Backend

This is a MERN task management app that gamifies the process of completing tasks and supports hierarchical task assignment, allowing the breakdown of tasks into smaller, more manageable sub-tasks.

## Tech Stack

- NodeJS
- ExpressJS
- MongoDB (Mongoose)
- Nodemon
- bcrypt
- cors
- dotenv
- jsonwebtoken

---

## How to setup

1. ### Clone the repository:

   git clone https://github.com/Onetyten/questlog-backend.git
   cd questlog-backend

2. ### Install dependencies(make sure you have npm and node installed):

   ```bash
   npm install
   ```

3. ### Create a .env file following this format

   Create a `.env` file in the root of the project and add the following environment variables:

   ```env
   MONGO_URL=your_mongodb_connection_string
   PORT=your_desired_port (e.g., 8000)
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. ### Start the server
   ```bash
   npm run dev
   ```

# Authentication

Most API endpoints (especially those related to tasks) require authentication. After a successful sign-up or sign-in, you will receive a JSON Web Token (JWT). This token must be included in the `Authorization` header for subsequent requests to protected routes.

Example: `Authorization: Bearer <your_jwt_token>`

# API endpoints

1. ## Signup

   HTTP method: POST
   URL: /auth/signup
   Description: Registers a new user.

   ### Body params:

   ### compulsory

   - name
   - email
   - password

   Sample Request body

   ```json
   {
     "name": "Nameless",
     "email": "Nameless@gmail.com",
     "password": "DragonRot"
   }
   ```

### How to fetch (using fetch):

```javascript
const res = await fetch("/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});
```

### How to fetch (using axios):

```javascript
const res = await axios.post("/auth/signup", { name, email, password });
```

2. ## Signin

   HTTP method: POST
   URL: /auth/signin
   Description: Logs in an existing user.

   ### Body params:

   ### compulsory

   - email
   - password

   Sample Request body

   ```json
   {
     "email": "Nameless@gmail.com",
     "password": "DragonRot"
   }
   ```

### How to fetch (using fetch):

```javascript
const res = await fetch("/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

### How to fetch (using axios):

```javascript
const res = await axios.post("/auth/signup", { email, password });
```

3. ## add Task

   HTTP method: POST
   URL: /api/task/add

   ### Body params:

   ### compulsory

   - user_id (compulsory)
   - title (compulsory)

   ### optional

   - parent_id
   - status (pending,completed,ongoing,archived)
   - priority (high,medium,low)
   - dueDate

   Sample Request body
    <pre>
   {
    "user_id": "6689567f",
    "title": "Go to sleep"
    "parent_id": "6689672ca",
    "status": "pending",
    "priority": "medium",
    "due date" : "2026-01-01"
   }
   </pre>

### How to fetch (using fetch):

```javascript
const res = await fetch("/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id,
    title,
    parent_id,
    status,
    priority,
    dueDate,
  }),
});
```

### How to fetch (using axios):

```javascript
const res = await axios.post("/auth/signup", {
  user_id,
  title,
  parent_id,
  status,
  priority,
  dueDate,
});
```

4. ## Delete Task

   HTTP method: DELETE
   URL: /api/task/delete/:id

   ### Request params

   ### compulsory

   - id (task id)

### How to fetch (using fetch):

```javascript
const res = await fetch(`/api/task/delete/${_id}`, {
  method: "DELETE",
});
```

### How to fetch (using axios):

```javascript
const res = await axios.delete(`/api/task/delete/${_id}`);
```

5. ## Fetch Tasks

   HTTP method: GET
   URL: /api/task/fetch/:user_id

   ### Request params

   ### compulsory

   - user_id

### How to fetch (using fetch):

```javascript
const res = await fetch(`/api/task/fetch/${user_id}`, {
  method: "GET",
});
```

### How to fetch (using axios):

```javascript
const res = await axios.get(`/api/task/fetch/${user_id}`);
```

6. ## Fetch subtasks

   HTTP method: GET
   URL: /api/task/fetchchildren/:parent_id/:user_id

   ### Request params

   ### compulsory

   - user_id (id of the user)
   - parent_id (id of the parent task to have its subtasks fetched)

### How to fetch (using fetch):

```javascript
const res = await fetch(`/api/task/fetchchildren/${parent_id}/${user_id}`, {
  method: "GET",
});
```

### How to fetch (using axios):

```javascript
const res = await axios.get(`/api/task/fetchchildren/${parent_id}/${user_id}`);
```

7. ## Edit Tasks

   HTTP method: PATCH
   URL: /api/task/edit/:id

   ### Request params

   - id (task id)

   ### Body params:

   ### optional

   only the parameters added to the body will be updated

   - title (compulsory)
   - parent_id
   - status (pending,completed,ongoing,archived)
   - priority (high,medium,low)
   - dueDate

   Sample Request body
    <pre>
   {
    "title": "Go to sleep"
    "parent_id": "6689672ca",
    "status": "pending",
    "priority": "medium",
    "due date" : "2026-01-01"
   }
   </pre>

### How to fetch (using fetch):

```javascript
const res = await fetch("/auth/signup", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title, parent_id, status, priority, dueDate }),
});
```

### How to fetch (using axios):

```javascript
const res = await axios.patch("/auth/signup", {
  title,
  parent_id,
  status,
  priority,
  dueDate,
});
```
