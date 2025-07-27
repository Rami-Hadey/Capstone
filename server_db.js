import express from 'express';
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Add these CORS headers FIRST, before other middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.url,
        body: req.body
    });
    next();
});

app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    next();
});

const pool = mysql.createPool({
    host: '107.180.1.16',
    user: 'cis440springA2025team7',
    password: 'cis440springA2025team7',
    database: 'cis440springA2025team7'
});

pool.query('SELECT 1', (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database');
    }
});
 
// Route to handle form submission
app.post('/signup', async (req, res) => {
    const { fname, lname, email, password, isadmin } = req.body;
    try {
        
        const query = 'INSERT INTO user_accounts (fname, lname, email, password, isadmin) VALUES (?, ?, ?, ?, ?)';
        pool.query(query, [fname, lname, email, password, isadmin], (err, result) => {
            if (err) {
                console.error('Signup error:', err);
                throw err;
            }
            res.send('User registered successfully');
        });
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).send('Error registering user');
    }
}); 

// Login endpoint starts here
app.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    try {
        // Query to check if user exists and get their info
        const query = 'SELECT * FROM user_accounts WHERE email = ?';
        
        pool.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Error during login');
            }

            if (results.length === 0) {
                return res.status(401).send('User Credentials are incorrect. Try again.');
            }

            const user = results[0];
            console.log('User found:', user); // Add this debug line
            
            // Check if password exists in database
            if (!user.password) {
                console.error('No password found in database for user');
                return res.status(500).send('Error during login');
            }

            // Compare the provided password with the hashed password
            const passwordMatch = password === user.password;

            if (!passwordMatch) {
                return res.status(401).send('User Credentials are incorrect. Try again.');
            }

            // Send back user info including isadmin status
            res.json({
                success: true,
                isAdmin: user.isadmin,
                fname: user.fname,
                userId: user.user_id
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Error during login');
    }
});

// Update the checkPasscode endpoint to verify both passcode and surveyId
app.post('/api/checkpasscode', (req, res) => {
    const { passcode, surveyId } = req.body;
    console.log('Checking passcode:', passcode, 'for survey:', surveyId);
    
    pool.query(
        'SELECT COUNT(*) as count FROM surveys WHERE survey_id = ? AND passcode = ?',
        [surveyId, passcode],
        (err, results) => {
            if (err) {
                console.error('Error checking passcode:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Passcode check results:', results);
            res.json({ valid: results[0].count > 0 });
        }
    );
});

// Modify the createsurvey endpoint to include passcode
app.post('/createsurvey', (req, res) => {
    console.log('Hit createsurvey endpoint');
    console.log('Request body:', req.body);
    
    const { surveyName, participationPoints, passcode, question0, question1, question2 } = req.body;

    // Validate required fields
    if (!surveyName || !participationPoints || !passcode || !question0 || !question1 || !question2) {
        console.log('Missing required fields:', {
            surveyName: !!surveyName,
            participationPoints: !!participationPoints,
            passcode: !!passcode,
            question0: !!question0,
            question1: !!question1,
            question2: !!question2
        });
        return res.status(400).json({ message: 'All fields are required' });
    }

    // First check if passcode already exists
    pool.query(
        'SELECT COUNT(*) as count FROM surveys WHERE passcode = ?',
        [passcode],
        (err, results) => {
            if (err) {
                console.error('Error checking passcode:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results[0].count > 0) {
                return res.status(400).json({ 
                    message: 'Passcode already exists. Please generate a new one.' 
                });
            }

            // If passcode is unique, proceed with survey creation
            const query = `
                INSERT INTO surveys 
                (survey_name, participation_points, passcode, question_1, question_2, question_3) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            pool.query(
                query, 
                [surveyName, participationPoints, passcode, question0, question1, question2],
                (err, result) => {
                    if (err) {
                        console.error('Survey creation error:', err);
                        return res.status(500).json({ message: 'Error creating survey' });
                    }
     
     
                    console.log('Survey created successfully:', result);
                    res.status(200).json({
                        message: 'Survey created successfully',
                        surveyId: result.insertId
                    });
                }
            );
        }
    );
});

// Get all surveys endpoint - should only return necessary fields
app.get('/api/surveys', (req, res) => {
    console.log('Fetching all surveys');
    
    // Change query to only return needed fields for the survey list
    const query = 'SELECT survey_id, survey_name, participation_points FROM surveys';
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching surveys:', error);
            return res.status(500).json({ error: 'Failed to fetch surveys' });
        }
        
        console.log(`Found ${results.length} surveys`);
        res.json(results);
    });
});

// Get survey by ID endpoint
app.get('/api/surveys/:survey_id', (req, res) => {
    const surveyId = req.params.survey_id;
    console.log('Fetching survey with ID:', surveyId);
    
    const query = 'SELECT * FROM surveys WHERE survey_id = ?';
    
    pool.query(query, [surveyId], (error, results) => {
        if (error) {
            console.error('Error fetching survey:', error);
            return res.status(500).json({ error: 'Failed to fetch survey' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }
        
        console.log('Survey found:', results[0]);
        res.json(results[0]);
    });
});

// Update survey endpoint
app.put('/api/surveys/:survey_id', (req, res) => {
    const surveyId = req.params.survey_id;
    const { survey_name, participation_points, question_1, question_2, question_3 } = req.body;
    
    console.log('Updating survey:', surveyId, req.body);

    if (!surveyId) {
        return res.status(400).json({ error: 'Survey ID is required' });
    }

    const query = `
        UPDATE surveys 
        SET survey_name = ?, 
            participation_points = ?, 
            question_1 = ?, 
            question_2 = ?, 
            question_3 = ?
        WHERE survey_id = ?
    `;
    
    pool.query(
        query, 
        [survey_name, participation_points, question_1, question_2, question_3, surveyId],
        (error, results) => {
            if (error) {
                console.error('Error updating survey:', error);
                return res.status(500).json({ error: 'Failed to update survey' });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Survey not found' });
            }
            
            console.log('Survey updated successfully');
            res.json({ 
                message: 'Survey updated successfully',
                surveyId: surveyId
            });
        }
    );
});

// Delete survey endpoint
app.delete('/api/surveys/:survey_id', (req, res) => {
    const surveyId = req.params.survey_id;
    
    if (!surveyId) {
        return res.status(400).json({ error: 'Survey ID is required' });
    }

    console.log('Deleting survey:', surveyId);
    
    const query = 'DELETE FROM surveys WHERE survey_id = ?';
    
    pool.query(query, [surveyId], (error, results) => {
        if (error) {
            console.error('Error deleting survey:', error);
            return res.status(500).json({ error: 'Failed to delete survey' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }
        
        console.log('Survey deleted successfully');
        res.json({ 
            message: 'Survey deleted successfully',
            surveyId: surveyId
        });
    });
});

// Submit survey response endpoint - add validation
app.post('/submit-survey', (req, res) => {
    console.log('=== Starting Survey Submission ===');
    
    const { userId, surveyId, answers, privateMode } = req.body;
    
    console.log('Parsed values:', {
        userId: userId,
        surveyId: surveyId,
        answers: answers,
        privateMode: privateMode
    });

    // Basic validation
    if (!surveyId) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            detail: 'Survey ID is required' 
        });
    }

    if (!answers || !answers.answer1 || !answers.answer2 || !answers.answer3) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            detail: 'All answers are required' 
        });
    }

    // Modified to accept the anonymous ID from the frontend
    if (!userId) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            detail: 'User ID is required' 
        });
    }

    const query = `
        INSERT INTO user_surveys 
        (user_id, survey_id, time, answer_1, answer_2, answer_3) 
        VALUES (?, ?, NOW(), ?, ?, ?)
    `;

    pool.query(
        query,
        [userId, surveyId, answers.answer1, answers.answer2, answers.answer3],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ 
                    error: 'Database error',
                    detail: error.message 
                });
            }
            
            console.log('Survey submitted successfully:', results);
            res.json({ 
                message: 'Survey submitted successfully',
                submissionId: results.insertId
            });
        }
    );
});

// Get all survey results endpoint
app.get('/api/survey-results', (req, res) => {
    console.log('Fetching all survey results');
    
    const query = `
        SELECT s.survey_id, s.survey_name, s.question_1, s.question_2, s.question_3,
               us.user_id, us.time, us.answer_1, us.answer_2, us.answer_3
        FROM surveys s
        LEFT JOIN user_surveys us ON s.survey_id = us.survey_id
        ORDER BY s.survey_id, us.time DESC
    `;
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching survey results:', error);
            return res.status(500).json({ error: 'Failed to fetch survey results' });
        }
        
        // Group results by survey
        const surveyResults = {};
        results.forEach(row => {
            if (!surveyResults[row.survey_id]) {
                surveyResults[row.survey_id] = {
                    id: row.survey_id,
                    name: row.survey_name,
                    questions: [row.question_1, row.question_2, row.question_3],
                    responses: []
                };
            }
            
            if (row.user_id) { // Only add response if it exists
                surveyResults[row.survey_id].responses.push({
                    userId: row.user_id,
                    timestamp: row.time,
                    answers: [
                        { answer: row.answer_1 },
                        { answer: row.answer_2 },
                        { answer: row.answer_3 }
                    ]
                });
            }
        });
        
        res.json(surveyResults);
    });
});

// Get user participation points
app.get('/api/user-points', (req, res) => {
    const query = `
        SELECT 
            CASE 
                WHEN ua.user_id = 1 THEN 'Anonymous'
                ELSE CONCAT(ua.fname, ' ', ua.lname)
            END as name,
            CASE 
                WHEN ua.user_id = 1 THEN 'Anonymous'
                ELSE ua.user_id
            END as user_id,
            COUNT(us.survey_id) * s.participation_points as points
        FROM user_accounts ua
        LEFT JOIN user_surveys us ON ua.user_id = us.user_id
        LEFT JOIN surveys s ON us.survey_id = s.survey_id
        WHERE ua.isadmin = 0
        GROUP BY ua.user_id
        ORDER BY points DESC`;

    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching user points:', error);
            return res.status(500).json({ error: 'Failed to fetch user points' });
        }
        res.json(results);
    });
});

// Add this near the top after your middleware setup
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

// Add this new endpoint for checking passcode uniqueness
app.get('/checkpasscode/:passcode', async (req, res) => {
    const passcode = req.params.passcode;
    console.log('Checking passcode:', passcode);

    const query = 'SELECT COUNT(*) as count FROM surveys WHERE passcode = ?';
    
    pool.query(query, [passcode], (err, results) => {
        if (err) {
            console.error('Error checking passcode:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Passcode check results:', results);
        res.json({ exists: results[0].count > 0 });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});  