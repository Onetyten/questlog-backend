# Questlog Backend

This is a MERN task management app that gamifies the process of completing tasks and supports hierachical task assignment allowing the breakdown of tasks into smaller, more manageable tasks.

## Tech Stack

- NodeJS
- ExpressJS
- MongoGB (Mongoose)
- Nodemon
- bcrypt
- cors
- dotenv
- jsonwebtoken

---

## How to setup

1. ### Clone the repository:

   git clone https://github.com/Onetyten/questlog-backend.git
   cd questlog-backend.git

2. ### Install dependencies(make sure you have npm and node installed):

   <pre>js
   npm install
   </pre>

3. ### Create a .env file following this format

   MONGO_URL = ?
   PORT = ?
   JWT_SECRET = ?

4. ### Start the server
   <pre>js
   npm run dev
   </pre>

# API endpoints

1. ## Signup

   HTTP method: POST
   URL: /auth/signup
   BODY variables:

   - name (compulsory)
   - email (compulsory)
   - password (compulsory)

   Sample Request body
    <pre>json
   {
   "name": "Nameless",
   "email": "Nameless@gmail.com",
   "password": "DragonRot"
   }
   </pre>

   ### How to fetch (using fetch):

   <pre>js
   
   const res = await fetch("/auth/signup", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ name, email, password })
   });
   
   </pre>

   ### How to fetch (using axios):

   <pre>js
   
   const res = await axios.post("/auth/signup",{
      name,email,password
    });
   
   </pre>
