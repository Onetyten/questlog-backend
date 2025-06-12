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

   - HTTP method: POST
   - URL: /auth/signup
   - Description: Registers a new user.

   ### Body params:

   ### compulsory

- - name
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

   - HTTP method: POST
   - URL: /auth/signin
   - Description: Logs in an existing user.

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
   - HTTP method: POST
   - URL: /api/task/add
    This operation requires a token in the request header.

   ### Body params:

   ### compulsory

   - title (compulsory)

   ### optional

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
const res = await fetch("/api/task/add", {
  method: "POST",
   headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Token}`, 
  },
  body: JSON.stringify({
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
const res = await axios.post("/api/task/add", {
  title,
  parent_id,
  status,
  priority,
  dueDate,
},{headers:{Autorization:`Bearer ${Token}`}});
```

4. ## Delete Task

   - HTTP method: DELETE
   - URL: /api/task/delete/:id
  This operation requires a token in the request header.
   ### Request params
   ### compulsory

   - id (task id)

### How to fetch (using fetch):

```javascript
const res = await fetch(`/api/task/delete/${_id}`, {
  method: "DELETE",
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Token}`,
  },
});
```

### How to fetch (using axios):

```javascript
const res = await axios.delete(`/api/task/delete/${_id}`,{headers:{Autorization:`Bearer ${Token}`}});
```

5. ## Fetch Tasks

   - HTTP method: GET
   - URL: /api/task/fetch
    This operation requires a token in the request header.

### How to fetch (using fetch):

```javascript
const res = await fetch(`/api/task/fetch`, {
  method: "GET",
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Token}`,
  },
});
```

### How to fetch (using axios):

```javascript
const res = await axios.get(`/api/task/fetch`,{headers:{Autorization:`Bearer ${Token}`}});
```

### how to sort and filter tasks (Optional)


### Query Parameters

You can use any combination of the following query parameters to **sort** or **filter** tasks:

| Query Parameter | Type     | Description                                                                 |
|------------------|----------|-----------------------------------------------------------------------------|
| `sortBy`         | `string` | Field to sort by (e.g., `title`, `createdAt`, `dueDate`)                    |
| `order`          | `string` | Sorting order: `"asc"` (default) or `"desc"`                                |
| `priority`       | `string` | Filter tasks by priority (e.g., `high`, `medium`, `low`)                    |
| `status`         | `string` | Filter tasks by status (e.g., `pending`, `done`)                            |
| `today`          | `true`   | Include tasks due **today** only                                            |
| `tomorrow`       | `true`   | Include tasks due **tomorrow** only                                         |
| `week`           | `true`   | Include tasks due **within the next 7 days**, including today               |

> You can combine filters like:  
> `/api/task/fetch?priority=high&status=pending&sortBy=title&order=desc`

---

### 🧪 Example (Using Fetch):


```javascript
const res = await fetch(`/api/task/fetch?sortBy=title&order=asc&priority=high`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Token}`,
  },
});
```

### 🧪 Example (Using axios):


```javascript
  const res = await axios.get(`/api/task/fetch?status=pending&today=true`, {
    headers: {
      Authorization: `Bearer ${Token}`,
    },
  });
```






6. ## Fetch subtasks

   - HTTP method: GET
   - URL: /api/task/fetchchildren/:parent_id
     This operation requires a token in the request header.

   ### Request params
   ### compulsory
   - parent_id (id of the parent task to have its subtasks fetched)

### How to fetch (using fetch):
```javascript
const res = await fetch(`/api/task/fetchchildren/${parent_id}`, {
  method: "GET",
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Token}`,
});
```

### How to fetch (using axios):

```javascript
const res = await axios.get(`/api/task/fetchchildren/${parent_id}`,{headers:{Autorization:`Bearer ${Token}`}});
```

7. ## Edit Tasks

   - HTTP method: PATCH
   - URL: /api/task/edit/:id

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
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Token}`, 
  },
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
}.{headers:{Autorization:`Bearer ${Token}`}});
```

8. ## Refresh access token
   - HTTP method: POST
   - URL: /api/auth/refreshAccesstoken

   ### Body params:
   ### compulsory
   - refreshToken

   Sample Request body
    <pre>
   {
    "refreshToken": "6689672cahdhusjdhfffhff",
   }

   </pre>

### How to fetch (using fetch):

```javascript
const res = await fetch("/auth/refreshAccesstoken", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ refreshToken}),
});
```

### How to fetch (using axios):

```javascript
const res = await axios.patch("/auth/signup", {
  refreshToken
});
```
