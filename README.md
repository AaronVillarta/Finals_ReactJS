SUPER ROCK PAPER SCISSORS - SIMPLE VSCODE SETUP
=============================================

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

TROUBLESHOOTING
--------------
If you see "Module not found":
npm install (in project root)
npm install (in server folder)

If you see "Port already in use":
Change PORT=5001 to different number in .env file

Need more help?
--------------
Create an issue on the repository