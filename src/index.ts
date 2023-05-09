import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import {
    login,
    register,
    getProfile,
    getEvent,
    addCandidate,
    vote,
    createEvent,
} from "./dummy";
import jwt from "jsonwebtoken";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
    res.json({ message: "API is running!" });
});

//apikey header middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["apikey"];
    if (!apiKey) {
        res.status(401).json({ message: "API key is required" });
    }
    if (apiKey !== process.env.API_KEY) {
        res.status(401).json({ message: "Invalid API key" });
    }
    next();
});

//dummy route
app.post("/dummy/login", login);
app.post("/dummy/register", register);

//authorization middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "Authorization header is required" });
    }
    // check if token is valid
    const token = authHeader?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Invalid token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get("/dummy/profile", getProfile);
app.get("/dummy/event/:eventId", getEvent);
app.post("/dummy/event/:eventId/vote/:candidateId", vote);

//check role middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET as string
    );
    const user = JSON.parse(JSON.stringify(decoded)).user;
    if (user.role !== "kpu") {
        res.status(401).json({ message: "Unauthorized" });
    }
    next();
});

app.post("/dummy/event", createEvent);
app.post("/dummy/event/:eventId/candidate", addCandidate);

//handle error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode || 500;
    res.status(statusCode).json({ message: err.message });
    next();
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    console.log("Try Me!");
});
