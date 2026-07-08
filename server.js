const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

let users = [];
let notices = [];
let events = [];
let admins = [];

const JWT_SECRET = 'super_secret_key_omega_YareYare_daze';
// User Endpts

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Failed to accept, 'name', 'email', and 'password' are required to be filled" });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ error: "Kindly Provide a Valid Email Address" });
    }
    if (users.some(u => u.email === email)) {
        return res.status(400).json({ error: "Email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = { 
        id: users.length + 1, 
        name, 
        email, 
        password: hashedPassword, 
        createdAt: new Date(),
        role : "organzier" ,
        isApproved : false
    };
    users.push(newUser);
    res.status(201).json(newUser);
})

app.post('/login', async(req, res)=>{
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Failed to accept, 'email', and 'password' are required to be filled" });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ error: "Invalid user." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid entry." });
    }
    if(!user.isApproved) {
        return res.status(403).json({ error: "Your account is not approved yet. Please wait for approval." });
    }
    const user_json = {
        id: user.id,
        role: user.role,
        isApproved: user.isApproved
    }
    const token = jwt.sign(user_json, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: "Login successful", user: user_json });
});
//admin Endpts

app.post('/register-admin', async (req, res) => {
    try {
        const { name, password } = req.body;
        if (!name || !password) return res.status(400).json({ error: "Name and password required" });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newAdmin = await prisma.admin.create({
            data: { name, password: hashedPassword, role: "admin", isApproved: true }
        });
        res.status(201).json({ message: "Admin created!", name: newAdmin.name });
    } catch (error) {
        res.status(500).json({ error: "Error creating admin", details: error.message });
    }
});

app.post('/login-admin', async(req, res)=>{
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ error: "Failed to accept, 'name', and 'password' are required to be filled" });
    }

    const admins = admins.find(u => u.name === name);
    if (!admins) {
        return res.status(400).json({ error: "Invalid admin." });
    }

    const isMatch = await bcrypt.compare(password, admins.password);
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid admin credentials." });
    }
    if(!admins.isApproved) {
        return res.status(403).json({ error: "Your admin account is not approved yet. Please wait for approval." });
    }
    if(admins.role !== 'admin') {
        return res.status(403).json({ error: "You are not authorized to access this endpoint." });
    }

    const user_json = {
        id: admins.id,
        role: admins.role,
        isApproved: admins.isApproved
    }
    const token = jwt.sign(user_json, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: "Admin login successful", user: user_json });
});

app.patch('/users/:id/approve', (req, res) => {
    
    const requesterRole = req.headers['x-user-role']; 
    
    if (requesterRole !== 'admin') {
        return res.status(403).json({ error: "Access Denied. Only admins can approve organizers." });
    }

    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    user.isApproved = true;
    res.json({ message: "Organizer approved successfully", user });
});
app.get('/users', (req, res) => {
    res.json(users);
})

// EVents Endpts

app.post('/events', (req, res) => {
    const { title, description, category, venue, startTime, endTime, organizer } = req.body;

    if (!title || !category || !venue || !startTime || !endTime || !organizer) {
        return res.status(400).json({ error: "Failed to accept, 'title', 'category', 'venue', 'startTime', 'endTime', and 'organizer' are required to be filled" });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);

    if(start >= end) {
        return res.status(400).json({ error: "Its crazy you know HOW YOUR EVENT ENDED BEFORE IT EVEN STARTED" });
    }
    const newEvent = { id: events.length + 1, title, description, category, venue, startTime, endTime, organizer, createdAt: new Date() };
    events.push(newEvent);
    res.status(201).json(newEvent);

})

app.get('/events', (req, res) => {
    const { category } = req.query;

    if(category){
        const filteredEvents = events.filter(event => event.category.toLowerCase() === category.toLowerCase());
        return res.json(filteredEvents);
    }

    res.json(events);
});

// Notices Endpts

app.post('/notices', (req, res) => {
    const { title, content, category, postedBy } = req.body;

    if(!title || !content || !category || !postedBy) {
        return res.status(400).json({ error: "Failed to accept, 'title', 'content', 'category', and 'postedBy' are required to be filled" });
    }
    if(!users.some(u => u.name === postedBy)) {
        return res.status(400).json({ error: "The user posting the notice does not exist." });
    }
    const newNotice = { id: notices.length + 1, title, content, category, postedBy, createdAt: new Date() };
    notices.push(newNotice);
    res.status(201).json(newNotice);
})

app.get('/notices', (req, res) => {
    res.json(notices);
})

const PORT = 3000;
app.listen(PORT, () => console.log('Server up on port 3000 (Connected to PostgreSQL)'));