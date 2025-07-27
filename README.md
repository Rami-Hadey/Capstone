#CIS440 Capstone Project: Team JEDI
This project is a web application that allows users to create and take surveys.

## How to run the project:
1. Clone the repository
2. Make sure you have node.js and npm
3. Run the command "npm install express, mysql" to install the dependencies
4. Run the command "node server_db.js" to start the server
5. Open your browser and navigate to "http://localhost:3000/login.html"

**Link to project:** http://localhost:3000/login.html

## How It's Made:

**Tech used:** HTML, CSS, JavaScript

Our SQL database consists of three 3 tables: user_accounts, surveys, and user_surveys. API endpoints are used to interact with the database to create, read, update, and delete data to allow users to create accounts, log-in,create surveys, take surveys, and view results.

## A Walkthrough of the Project:
Upon loading the login page, a user can log-in to an existing account or choose to create an account. If they would like to create a new account, a sign-up page is linked so that users are able to create accounts and declare whether they are users or admins. Once logged in, users are directed to a home page (userlanding.html) where they can select a survey to take, given that they have the correct survey credentials, or log out to end the session. When entered into their desired survey page, users will be prompted to answer the survey's associated questions and given the choice to submit their responses anonymously. Upon successful submission of a survey, users will be logged out and redirected to the login page. 

On the other hand, admins will be directed to a separate home page where they can create a survey, view survey results, view the participation records for all users, or log out to end the session.

## Lessons Learned:

Our team learned a lot throughout this process, both in terms of software development and in terms of teamwork. We navigated this project depite having various levels of experience and backgrounds, and we learned how to leverage new tools and learnings to help us complete the project. GitHub was new to many of us, but it quickly became critical to our workflow. We also learned how to use APIs to interact with our database and how to use SQL to query our database. As far as teamwork goes, many of us also balance various commitments and day jobs outside of our coursework. This became a learning experience, as we improved throughout the course to accomodate everybody's schedule and streamline our communication methods in person and virtually.