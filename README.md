SUPER ROCK PAPER SCISSORS - COMPLETE SETUP GUIDE
==============================================

1. INITIAL SETUP
---------------
1. Open VSCode
2. Click 'Clone Git Repository' (or press Ctrl+Shift+P and type "Git: Clone")
3. Paste repository URL
4. Choose a folder on your computer
5. Click 'Open' when prompted

2. INSTALL DEPENDENCIES
---------------------
Open Terminal in VSCode (Ctrl+` or View > Terminal):

In first terminal:
npm install

In second terminal (click + to create new terminal):
cd server
npm install

3. ENVIRONMENT SETUP
------------------
Create a .env file in the server directory with:
PORT=5001
JWT_SECRET=your_secret_key_here

4. START THE APP
--------------
In first terminal:
cd server
node server.js

In second terminal:
npm start

5. VERIFY IT WORKS
----------------
1. Browser should open to http://localhost:3000
2. You should see the login page
3. Create an account to test

6. DATABASE SETUP & TESTING
-------------------------
Database Location:
server/database/game.db

Verify Database:
1. Start server (node server.js)
2. Check console for:
   "Connected to SQLite database"
   "Database location: [path]/server/database/game.db"
   "Database tables created/verified successfully"

Test Database:
1. Visit http://localhost:5001/test (should see "Server is running!")
2. Visit http://localhost:5001/test/users (should see list of users)
3. Visit http://localhost:5001/test/wins (should see list of wins)

View Database Contents:
Option 1 - SQLite Browser:
1. Download from https://sqlitebrowser.org/
2. Open game.db file
3. Browse data

Option 2 - SQLite CLI:
1. Install SQLite3
   Ubuntu/Debian: sudo apt-get install sqlite3
   macOS: brew install sqlite3
   Windows: Download from sqlite.org/download.html

2. Basic Commands:
   sqlite3 server/database/game.db
   .tables (view tables)
   SELECT * FROM users; (view users)
   .quit (exit)

7. TROUBLESHOOTING
----------------
"Module not found":
- Run npm install in project root
- Run npm install in server folder

"Port already in use":
- Change PORT in .env file
- Kill process using: 
  Windows: netstat -ano | findstr :5001
  Linux/Mac: lsof -i :5001

Database Issues:
1. Database not created:
   - Check server/database folder exists
   - Check write permissions
   - Server creates directory if missing

2. Connection errors:
   - Verify database path
   - Check file permissions
   - Look for console errors

3. Table issues:
   - Tables auto-create on server start
   - Check server logs
   - Use .schema users to verify structure

8. GAME FEATURES
--------------
- 15 Elements: Rock, Paper, Scissors, Fire, Water, Air, Dragon, Devil, 
  Lightning, Gun, Snake, Human, Tree, Wolf, Sponge
- Life System: Start with 3, max 10
- Damage Types:
  * Regular win: 1 damage + 1 life gain
  * Super effective: 2 damage
- Round System:
  * 10 second timer per round
  * No choice = forfeit
  * Double forfeit = draw

9. NEED HELP?
------------
1. Check server console for errors
2. Verify all dependencies installed
3. Confirm database connection
4. Create issue on repository if needed

10. TECH STACK
------------
Frontend:
- React
- Material-UI
- Socket.IO Client
- React Router

Backend:
- Node.js
- Express
- Socket.IO
- SQLite3
- JWT Auth
- Bcrypt