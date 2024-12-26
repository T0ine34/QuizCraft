import { IQuestion, IQuizz, IUser } from "./interface";
import { Question, Quizz, User } from "./object";

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Database setup
const dbPromise = open({
    filename: './quizcraft.db',
    driver: sqlite3.Database
});

/**
 * Database implementation of the IQuestion interface
 */
class QuestionDB implements IQuestion {
    async insert(question: Question): Promise<void> {
        if (question.getID() === null) {
            question.setID(await QuestionDB.getNewID());
        }
        dbPromise.then(async db => {
            await db.run('INSERT INTO question VALUES (?, ?, ?, ?)', [question.getID(), question.getQuestion(), question.getAnswers(), question.getOptions().join(';')]);
        });
    }

    update(question: Question): void {
        dbPromise.then(async db => {
            await db.run('UPDATE question SET question = ?, answers = ?, options = ? WHERE id = ?', [question.getQuestion(), question.getAnswers(), question.getOptions().join(';'), question.getID()]);
        });
    }

    delete(question: Question): void {
        dbPromise.then(async db => {
            await db.run('DELETE FROM question WHERE id = ?', [question.getID()]);
        });
    }

    async get(id: string): Promise<Question> {
        return dbPromise.then(async db => {
            const row = await db.get('SELECT * FROM question WHERE id = ?', [id]);
            return new Question(row.id, row.question, row.answers, JSON.parse(row.options));
        });
    }

    async getByQuizID(quizID: number): Promise<Question[]> {
        return dbPromise.then(async db => {
            const rows = await db.all('SELECT * FROM question WHERE quizz_id = ?', [quizID]);
            return rows.map(row => new Question(row.id, row.question, row.answers, JSON.parse(row.options)));
        });
    }

    async getAll(): Promise<Question[]> {
        return dbPromise.then(async db => {
            const rows = await db.all('SELECT * FROM question');
            return rows.map(row => new Question(row.id, row.question, row.answers, JSON.parse(row.options)));
        });
    }

    static async getNewID(): Promise<number> {
        // return a new id that is't used by any question in the database
        const questions = await new QuestionDB().getAll();
        let id = 1;
        while (questions.find(question => question.getID() === id)) {
            id++;
        }
        return id;
    }
}

/**
 * Database implementation of the IUser interface
 */
class UserDB implements IUser {
    /**
     * Add a new user into the database
     * If the id is null, a new id will be created
     */
    async insert(user: User): Promise<void> {
        if (user.getID() === null) {
            user.setID(await UserDB.getNewID());
        }
        dbPromise.then(async db => {
            await db.run('INSERT INTO user VALUES (?, ?, ?)', [user.getID(), user.getUsername(), user.getPassword()]);
        });
    }

    update(user: User): void {
        dbPromise.then(async db => {
            await db.run('UPDATE user SET name = ?, password = ? WHERE id = ?', [user.getUsername(), user.getPassword(), user.getID()]);
        });
    }

    delete(user: User): void {
        dbPromise.then(async db => {
            await db.run('DELETE FROM user WHERE id = ?', [user.getID()]);
        });
    }

    async get(id: string): Promise<User> {
        return dbPromise.then(async db => {
            const row = await db.get('SELECT * FROM user WHERE id = ?', [id]);
            return new User(row.id, row.name, row.password);
        });
    }

    async getAll(): Promise<User[]> {
        return dbPromise.then(async db => {
            const rows = await db.all('SELECT * FROM user');
            return rows.map(row => new User(row.id, row.name, row.password));
        });
    }

    async getByUsername(username : string): Promise<User> {
        return dbPromise.then(async db => {
            const row = await db.get('SELECT * FROM user WHERE username = ?', [username]);
            return new User(row.id, row.username, row.password);
        });
    }

    static async getNewID(): Promise<number> {
        // return a new id that is't used by any user in the database
        const users = await new UserDB().getAll();
        let id = 1;
        while (users.find(user => user.getID() === id)) {
            id++;
        }
        return id;
    }
}

/**
 * Database implementation of the IQuizz interface
 */
class QuizzDB implements IQuizz {
    async insert(quizz: Quizz): Promise<void> {
        if (quizz.getID() === null) {
            quizz.setID( await QuestionDB.getNewID());
        }
        await dbPromise.then(async db => {
            await db.run('INSERT INTO quizz VALUES (?, ?, ?, ?, ?, ?)', [quizz.getID(), quizz.getName(), quizz.getDescription(), quizz.getCreatedAt(), quizz.getCreatedBy().getID(), quizz.getQuestions().map(question => question.getID()).join(';')]);
        });
    }

    update(quizz: Quizz): void {
        dbPromise.then(async db => {
            await db.run('UPDATE quizz SET name = ?, description = ?, created_at = ?, created_by = ?, questions = ? WHERE id = ?', [quizz.getName(), quizz.getDescription(), quizz.getCreatedAt(), quizz.getCreatedBy().getID(), quizz.getQuestions().map(question => question.getID()).join(';'), quizz.getID()]);
        });
    }

    delete(quizz: Quizz): void {
        dbPromise.then(async db => {
            await db.run('DELETE FROM quizz WHERE id = ?', [quizz.getID()]);
        });
    }

    async get(id: string): Promise<Quizz> {
        return dbPromise.then(async db => {
            const row = await db.get('SELECT * FROM quizz WHERE id = ?', [id]);
            const questions = await new QuestionDB().getByQuizID(row.id);
            return new Quizz(
                row.id,
                row.name,
                row.description,
                row.created_at,
                await new UserDB().get(row.created_by),
                questions
            );
        });
    }

    async getAll(): Promise<Quizz[]> {
        return dbPromise.then(async db => {
            const rows = await db.all('SELECT * FROM quizz');
            const quizzes : Quizz[] = [];
            for (const row of rows) {
                const questions = await new QuestionDB().getByQuizID(row.id);
                quizzes.push(new Quizz(
                    row.id,
                    row.name,
                    row.description,
                    row.created_at,
                    await new UserDB().get(row.created_by),
                    questions));
            }
            return quizzes;
        });
    }

    static async getNewID(): Promise<number> {
        // return a new id that is't used by any quizz in the database
        const quizzs = await new QuizzDB().getAll();
        let id = 1;
        while (quizzs.find(quizz => quizz.getID() === id)) {
            id++;
        }
        return id;
    }
}


export { QuestionDB, QuizzDB, UserDB };