import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { HTTPCodes } from './codes';

import dotenv from 'dotenv';
dotenv.config();

import { QuestionDB, QuizzDB, UserDB } from './database';
import {Question, Quizz, User} from './object';

import { Logger } from '@gamunetwork/logger';

const app = express();
app.use(bodyParser.json());


if(!process.env.JWT_SECRET){
    Logger.warning('JWT_SECRET is not defined, using default secret');
    process.env.JWT_SECRET = "";
}

/**
 * Interface for authenticated requests
 */
interface AuthenticatedRequest extends Request {
    user: User;
}

/**
 * Authenticate a request using JWT
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
async function authenticateJWT(req: AuthenticatedRequest, res: any, next: any){

    Logger.debug(`Authenticating request from ${req.ip}`);
    const token = req.headers.authorization;
    if (token) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            Logger.error(`JWT_SECRET is not defined while verifying token for ${req.ip}`);
            return res.sendStatus(HTTPCodes.InternalServerError); // Internal Server Error if secret is not defined
        }
        jwt.verify(token, secret, async (err: any, decodedToken: any) => {
            if (err) {
                Logger.debug(`JWT verification failed: ${err}`);
                return res.sendStatus(HTTPCodes.Unauthorized);
            }
            const user = await new UserDB().getByUsername(decodedToken.username);
            Logger.debug(`JWT verified for ${user.getUsername()}`);
            req.user = user; // Attach the decoded token to the request object
            next(); // Call the next middleware function
        });
    } else {
        Logger.debug('No token provided');
        res.sendStatus(HTTPCodes.Unauthorized);
    }
};

/**
 * Check if a user is allowed to edit a quiz
 * @param username The username of the user
 * @param quizId The ID of the quiz
 * @returns True if the user is allowed to edit the quiz, false otherwise
 */
async function AllowToEdit(user : User, quiz: Quizz){
    return quiz.getCreatedBy() === user;
}

/**
 * @api {post} /api/register Register a new user
 * @apiName Register
 * @apiGroup User
 */
app.post('/api/register', async (req, res) => {
    try{
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        new UserDB().insert(new User(null, username, hashedPassword));
        res.sendStatus(HTTPCodes.Created);
        Logger.info(`User ${username} registered from ${req.ip}`);
    } catch (error) {
        Logger.error(`Error registering user: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
    }
});

/**
 * @api {post} /api/login Login a user
 * @apiName Login
 * @apiGroup User
 */
app.post('/api/login', async (req: any, res: any) => {
    try{
        const { username, password } = req.body;
        if (!username || !password) {
            return res.sendStatus(HTTPCodes.BadRequest);
        }
        
        const user = await new UserDB().getByUsername(username);
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            Logger.error(`JWT_SECRET is not defined while logging in user ${username} from ${req.ip}`);
            res.sendStatus(HTTPCodes.InternalServerError); // Internal Server Error if secret is not defined
            return;
        }
        if (await bcrypt.compare(password, user.getPassword())) {
            const token = jwt.sign({ username: user.getUsername() }, secret, { expiresIn: '1h' });
            Logger.info(`User ${user.getUsername()} logged in from ${req.ip}`);
            res.json({ token });
            return;
        } else {
            Logger.debug(`Invalid login attempt for user ${username} from ${req.ip}`);
            res.sendStatus(HTTPCodes.Unauthorized);
            return;
        }
    } catch (error) {
        Logger.error(`Error while logging in user: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
        return;
    }
});

/**
 * @api {get} /api/quizzes Get all quizzes
 * @apiName GetQuizzes
 * @apiGroup Quiz
 * @apiHeader {String} Authorization JWT token
 */
app.get('/api/quizzes', authenticateJWT, async (req  : AuthenticatedRequest, res : any) => {
    try{
        const quizzes = await new QuizzDB().getAll()
        res.status(HTTPCodes.OK).json(quizzes);
        console.log(Object.keys(req.user));
        Logger.info(`Quizzes fetched by ${req.user.getUsername()}`);
    } catch (error) {
        Logger.error(`Error fetching quizzes: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
    }
});

/**
 * @api {post} /api/quizzes Create a new quiz
 * @apiName CreateQuiz
 * @apiGroup Quiz
 * @apiHeader {String} Authorization JWT token
 * @apiParam {String} name The name of the quiz
 * @apiParam {String} description The description of the quiz
 * @apiParam {Object[]} questions The questions in the quiz
 * @apiParam {String} questions.question The question
 * @apiParam {String} questions.answer The answer
 * @apiParam {String[]} questions.options The options
 * @apiSuccess {Number} id The ID of the created quiz
 * @apiError {String} error The error message
 */
app.post('/api/quizzes', authenticateJWT, async (req : AuthenticatedRequest, res : any) => {
    try{
        const { name, description, questions } = req.body;
        if (!name || !description || !questions) {
            res.status(HTTPCodes.BadRequest).json({ error: 'Missing required fields', fields: { 'name': name, 'description': description, 'questions': questions } });
            return;
        }

        let  quiz = new Quizz(null, name, description, "datetime(\"now\")", req.user, questions);
        await new QuizzDB().insert(quiz);

        res.status(HTTPCodes.Created).json({ id: quiz.getID() });
        Logger.info(`Quiz ${quiz.getID()} created by ${req.user.getUsername()}`);
    } catch (error) {
        Logger.error(`Error creating quiz: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
    }
});

/**
 * @api {put} /api/quizzes/:id Update a quiz
 * @apiName UpdateQuiz
 * @apiGroup Quiz
 * @apiHeader {String} Authorization JWT token
 * @apiParam {String} name The name of the quiz
 * @apiParam {String} description The description of the quiz
 * @apiParam {Object[]} questions The questions in the quiz
 * @apiParam {Number} questions.id The ID of the question
 * @apiParam {String} questions.question The question
 * @apiParam {String} questions.answer The answer
 * @apiParam {String[]} questions.options The options
 * @apiError {String} error The error message
 */
app.put('/api/quizzes/:id', authenticateJWT, async (req : AuthenticatedRequest, res : any) => {
    if (!await AllowToEdit(req.user, await new QuizzDB().get(req.params.id))) {
        res.sendStatus(HTTPCodes.Forbidden);
    }

    try{
        const { title, description, questions } = req.body;
        const { id } = req.params;
        if (!title || !description || !questions) {
            res.status(HTTPCodes.BadRequest).json({ error: 'Missing required fields', fields: { 'name': title, 'description': description, 'questions': questions } });
            return;
        }

        await new QuizzDB().update(new Quizz(parseInt(id), title, description, "datetime(\"now\")", req.user, questions));
        
        res.sendStatus(HTTPCodes.OK);
        Logger.info(`Quiz ${id} updated by ${req.user.getUsername()}`);
    } catch (error) {
        Logger.error(`Error updating quiz: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
    }
});


/**
 * @api {delete} /api/quizzes/:id Delete a quiz
 * @apiName DeleteQuiz
 * @apiGroup Quiz   
 * @apiHeader {String} Authorization JWT token
 * @apiParam {Number} id The ID of the quiz
 * @apiError {String} error The error message
 */
app.delete('/api/quizzes/:id', authenticateJWT, async (req : AuthenticatedRequest, res : any) => {
    if (!await AllowToEdit(req.user, await new QuizzDB().get(req.params.id))) {
        res.sendStatus(HTTPCodes.Forbidden);
    }

    try{
        const { id } = req.params;
        const quizzDb = new QuizzDB();
        quizzDb.delete(await quizzDb.get(id));
        res.sendStatus(HTTPCodes.OK);
        Logger.info(`Quiz ${id} deleted by ${req.user.getUsername()}`);
    } catch (error) {
        Logger.error(`Error deleting quiz: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
    }
});

/**
 * @api {get} /api/quizzes/:id Get a quiz
 * @apiName GetQuiz
 * @apiGroup Quiz
 * @apiHeader {String} Authorization JWT token
 * @apiParam {Number} id The ID of the quiz
 * @apiSuccess {Object} quiz The quiz object
 * @apiError {String} error The error message
 */
app.get('/api/quizzes/:id', authenticateJWT, async (req : AuthenticatedRequest, res : any) => {
    try{
        const { id } = req.params;
        const quiz = await new QuizzDB().get(id);
        res.status(HTTPCodes.OK).json(quiz);
        Logger.info(`Quiz ${id} fetched by ${req.user.getUsername()}`);
    } catch (error) {
        Logger.error(`Error fetching quiz: ${error}`);
        res.sendStatus(HTTPCodes.InternalServerError);
    }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

export default app;