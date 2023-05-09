import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

export function login(req: Request, res: Response) {
    //get email and password from the body
    const { email, password } = req.body;
    //check if email and password are present
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
    }
    //check if email and password are valid
    if (
        (email !== "test@example.com" && email !== "kpu@example.com") ||
        password !== "password"
    ) {
        res.status(401).json({ message: "Invalid credentials" });
    }
    //if ok make token and send it back
    const token = jwt.sign(
        {
            user: {
                id: 1,
                email: email,
                name: "assa",
                dateOfBirth: 123455,
                gender: "male",
                role: email === "test@example.com" ? "voter" : "kpu",
                votedEvents: [],
            },
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "1h",
        }
    );

    res.json({ access_token: token });
}

export function register(req: Request, res: Response) {
    //get user data from body
    const { email, password, name, dateOfBirth, gender, id } = req.body;

    //if ok make token and send it back
    const token = jwt.sign(
        {
            user: {
                id: 1,
                email: email,
                name: "assa",
                dateOfBirth: 123455,
                gender: "male",
                role: "voter",
                votedEvents: [],
            },
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "1h",
        }
    );

    res.json({ access_token: token });
}

export function getProfile(req: Request, res: Response) {
    //get auth token from header and decode it
    const authHeader = req.headers.authorization;

    const token = authHeader?.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "Invalid token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        //get user data from the decoded token
        const user = JSON.parse(JSON.stringify(decoded)).user;
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }

    // if ok return user data
    res.json({
        id: 1,
        email: "test@example.com",
        name: "assa",
        dateOfBirth: 123455,
        gender: "male",
        role: "voter",
        votedEvents: [],
    });
}

export function getEvent(req: Request, res: Response) {
    if (!req.params.eventId) {
        res.status(400).json({ message: "Event id is required" });
    }

    if (req.params.eventId !== "1") {
        res.status(404).json({ message: "Event not found" });
    }

    res.json({
        startDate: 1231283902183,
        endDate: 123214123341231,
        name: "Pemilu 2022",
        id: 1,
        candidates: [
            {
                name: "Abdul Archam",
                party: "Partai Perminyakan",
                id: 2,
                votes: 0,
            },
            {
                name: "Abdul Archam",
                party: "Partai Perminyakan",
                id: 2,
                votes: 0,
            },
        ],
    });
}

export function createEvent(req: Request, res: Response) {
    //get event data from body
    const { startDate, endDate, name, candidates } = req.body;

    res.json({
        startDate: startDate,
        endDate: endDate,
        name: name,
        id: 1,
        candidates: candidates,
    });
}

export function addCandidate(req: Request, res: Response) {
    const eventId = req.params.eventId;
    //get candidate data from body
    const { name, party } = req.body;

    if (!eventId) {
        res.status(400).json({ message: "Event id is required" });
    }

    if (eventId !== "1") {
        res.status(404).json({ message: "Event not found" });
    }

    const event = {
        startDate: 1231283902183,
        endDate: 123214123341231,
        name: "Pemilu 2022",
        id: 1,
        candidates: [
            {
                name: "Abdul Archam",
                party: "Partai Perminyakan",
                id: 2,
                votes: 0,
            },
            {
                name: "Abdul Archam",
                party: "Partai Perminyakan",
                id: 2,
                votes: 0,
            },
        ],
    };

    event.candidates.push({
        name: name,
        party: party,
        id: event.candidates.length + 1,
        votes: 0,
    });

    res.json(event);
}

export function vote(req: Request, res: Response) {
    //get vote data from body
    const candidateId = parseInt(req.params.candidateId, 10);
    const eventId = parseInt(req.params.eventId, 10);

    //get auth token from header and decode it
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET as string
    );
    const user = JSON.parse(JSON.stringify(decoded)).user;

    const event = {
        startDate: 1231283902183,
        endDate: 123214123341231,
        name: "Pemilu 2022",
        id: 1,
        candidates: [
            {
                name: "Abdul Archam",
                party: "Partai Perminyakan",
                id: 1,
                votes: 0,
            },
            {
                name: "Bagus Setyo",
                party: "Partai Pasar",
                id: 2,
                votes: 0,
            },
        ],
    };

    if (!eventId || !candidateId) {
        res.status(400).json({
            message: "Event id and candidate id are required",
        });
    }

    if (eventId !== 1) {
        res.status(404).json({ message: "Event not found" });
    }

    if (event.candidates.every((candidate) => candidate.id !== candidateId)) {
        res.status(404).json({ message: "Candidate not found" });
    }

    if (user.votedEvents.includes(eventId)) {
        res.status(400).json({ message: "You already voted this event" });
    }

    event.candidates.forEach((candidate) => {
        if (candidate.id === candidateId) {
            candidate.votes++;
        }
    });

    user.votedEvents.push(eventId);

    res.json(event);
}
