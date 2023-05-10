import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import CryptoJS from "crypto-js";
import e from "express";
import { parse } from "path";

dotenv.config();

const supabase = createClient(
    "https://ignzwetmebuhkyuodjpp.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnbnp3ZXRtZWJ1aGt5dW9kanBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODM2NjA2MTgsImV4cCI6MTk5OTIzNjYxOH0.4r30Mzs9DXhtH2aQEio4zZt3aw32YpUJc04NCRNooSI"
);

export async function login(req: Request, res: Response) {
    console.log("login");
    //get email and password from the body
    const { email, password } = req.body;
    //check if email and password are present
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }

    let { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email);

    //if profile not found return unregistered
    if (profiles?.length === 0) {
        res.status(401).json({ message: "User not found" });
        return;
    }

    //decrypt password
    const bytes = CryptoJS.AES.decrypt(
        profiles?.[0].password as string,
        "079-3n6v4qwetvyub4235q9870h"
    );
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

    //check if email and password are valid
    if (profiles?.[0].email !== email || originalPassword !== password) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }

    //if ok make token and send it back
    const token = jwt.sign(
        {
            user: {
                id: profiles?.[0].id,
                email: profiles?.[0].email,
                name: profiles?.[0].name,
                dateOfBirth: profiles?.[0].dateOfBirth,
                gender: profiles?.[0].gender,
                role: profiles?.[0].role,
                votedEvents: profiles?.[0].votedEvents,
            },
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "1h",
        }
    );

    res.json({ access_token: token });
}

export async function register(req: Request, res: Response) {
    //get user data from body
    const { email, password, name, dateOfBirth, gender, id } = req.body;

    //check if email and password are present
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
    }

    //encrypt passsword with crypto-js
    const encryptedPassword = CryptoJS.AES.encrypt(
        password,
        "079-3n6v4qwetvyub4235q9870h"
    ).toString();

    //insert user to database
    const { data, error } = await supabase.from("profiles").insert([
        {
            id: id,
            email: email,
            password: encryptedPassword,
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            role: "voter",
            votedEvents: [],
        },
    ]);

    if (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error,
        });
        return;
    }

    //if ok make token and send it back
    const token = jwt.sign(
        {
            user: {
                id: id,
                email: email,
                password: encryptedPassword,
                name: name,
                dateOfBirth: dateOfBirth,
                gender: gender,
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
}

export async function getEvent(req: Request, res: Response) {
    if (!req.params.eventId) {
        res.status(400).json({ message: "Event id is required" });
    }

    //get event from supabase
    let { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", req.params.eventId);

    //if event not found return 404
    if (events?.length === 0) {
        res.status(404).json({ message: "Event not found" });
        return;
    }

    const event = events?.[0];

    res.json({
        startDate: event?.startDate,
        endDate: event?.endDate,
        name: event?.name,
        id: event?.id,
        candidates: event?.candidates,
    });
}

export async function createEvent(req: Request, res: Response) {
    //get event data from body
    const { startDate, endDate, name, candidates } = req.body;

    //check if event data is present
    if (!startDate || !endDate || !name || !candidates) {
        res.status(400).json({ message: "Event data is required" });
    }

    //insert event to database
    const { data: events, error } = await supabase
        .from("events")
        .insert([
            {
                startDate: startDate,
                endDate: endDate,
                name: name,
                candidates: candidates,
            },
        ])
        .select();

    res.json({
        startDate: events?.[0].startDate,
        endDate: events?.[0].endDate,
        name: events?.[0].name,
        id: events?.[0].id,
        candidates: events?.[0].candidates,
    });
}

export async function addCandidate(req: Request, res: Response) {
    const eventId = parseInt(req.params.eventId);
    //get candidate data from body
    const { name, party } = req.body;

    if (!eventId) {
        res.status(400).json({ message: "Event id is required" });
    }

    //get event from supabase
    let { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId);

    //if event not found return 404
    if (events?.length === 0) {
        res.status(404).json({ message: "Event not found" });
        return;
    }

    const event = events?.[0];

    event?.candidates.push({
        name: name,
        party: party,
        id: event.candidates.length + 1,
        votes: 0,
    });

    //add candidates from event
    let { data: newEvents, error: error2 } = await supabase
        .from("events")
        .update(event)
        .eq("id", req.params.eventId)
        .select();

    if (error2) {
        res.status(500).json({
            message: "Internal server error",
            error: error2,
        });
        return;
    }

    res.json(event);
}

export async function vote(req: Request, res: Response) {
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
    let user = JSON.parse(JSON.stringify(decoded)).user;

    if (!eventId || !candidateId) {
        res.status(400).json({
            message: "Event id and candidate id are required",
        });
    }

    //get event from supabase
    let { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId);

    //if event not found return 404
    if (events?.length === 0) {
        res.status(404).json({ message: "Event not found" });
        return;
    }

    const event = events?.[0];

    if (
        event?.candidates.every(
            (candidate: any) => candidate.id !== candidateId
        )
    ) {
        res.status(404).json({ message: "Candidate not found" });
    }

    //get user voted events from supabase
    let { data: users, error: error2 } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);

    if (error2) {
        res.status(500).json({
            message: "Internal server error",
            error: error2,
        });
        return;
    }

    user = users?.[0];

    if (user?.votedEvents.includes(eventId)) {
        res.status(400).json({ message: "You already voted this event" });
    }

    event?.candidates.forEach((candidate: any) => {
        if (candidate.id === candidateId) {
            candidate.votes++;
        }
    });

    user.votedEvents.push(eventId);

    //update event and user on supabase
    let { data: newEvents, error: error3 } = await supabase
        .from("events")
        .update(event)
        .eq("id", eventId)
        .select();

    if (error3) {
        res.status(500).json({
            message: "Internal server error",
            error: error3,
        });
        return;
    }

    let { data: newUsers, error: error4 } = await supabase
        .from("profiles")
        .update(user)
        .eq("id", user.id);

    res.json(newEvents?.[0]);
}
