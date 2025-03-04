import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

// Control grid visibility
const showSquares = true; // Change this to true when you want to show the names

// Cached grid assignments
let cachedAssignments = null;

// Function to fetch Superbowl data from the ESPN API
async function fetchSuperbowlData() {
    try {
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
        const data = await response.json();

        if (data) {
            const superbowlEvent = data.events[0].competitions[0];
            const startTime = new Date(superbowlEvent.date);
            

            const homeTeam = superbowlEvent.competitors[0].team.abbreviation;
            const homeTeamScore = superbowlEvent.competitors[0].score;
            const awayTeam = superbowlEvent.competitors[1].team.abbreviation;
            const awayTeamScore = superbowlEvent.competitors[1].score;

            return {
                startTime,
                homeTeam,
                homeTeamScore,
                awayTeam,
                awayTeamScore
            };
        } else {
            return { message: 'No Superbowl game found.' };
        }
    } catch (error) {
        console.error('Error fetching Superbowl data:', error);
        return { message: 'Error fetching Superbowl data.' };
    }
}

// API endpoint to return Superbowl data
app.get('/api/superbowl', async (req, res) => {
    const data = await fetchSuperbowlData();
    res.json(data);
});

// Function to generate unique grid assignments and assign leftover squares to Andy B.
function generateGridAssignments() {
    const names = [
        'Bryce B.', 
        'Ben C.', 
        'Dan B.', 
        'Dave R.',
        'Eric A.',
        'Grant F.',
        'Justin W.',
        'Lauren O.', 
        'Lauren W.',
        'Matt S.', 
        'Matt W.',  
        'Sophia B.'
    ];

    const totalCoordinates = 100;
    const availableNumbers = Array.from({ length: totalCoordinates }, (_, i) => i + 1);
    const assignments = {};

    const numberToCoordinate = (number) => {
        const row = Math.floor((number - 1) / 10);
        const col = (number - 1) % 10;
        return `(${row}, ${col})`;
    };

    names.forEach((name) => {
        const coordinates = [];
        for (let i = 0; i < 8; i++) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const number = availableNumbers.splice(randomIndex, 1)[0];
            coordinates.push(numberToCoordinate(number));
        }
        assignments[name] = coordinates;
    });

    // Assign any remaining squares to 'Andy B.'
    const andySquares = availableNumbers.map(numberToCoordinate);
    assignments['Andy B.'] = andySquares;

    return assignments;
}

// API endpoint to return grid assignments
app.get('/api/assignments', (req, res) => {
    if (!cachedAssignments) {
        cachedAssignments = generateGridAssignments();
        console.log('Grid assignments generated and cached.');
    } else {
        console.log('Returning cached grid assignments.');
    }

    // Create a "safe" version of the assignments that hides names if `showSquares` is false
    const safeAssignments = {};
    for (let person in cachedAssignments) {
        safeAssignments[person] = cachedAssignments[person].map(coord =>
            showSquares ? coord : '' // Show the coordinates but hide names when showSquares is false
        );
    }

    res.json({
        assignments: safeAssignments,
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
