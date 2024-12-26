import { Question, Quizz, User } from './object';

/**
 * Interface for the Question class
 * 
 * @interface IQuestion
 * 
 * @method insert Insert a question into the database
 * @method update Update a question in the database
 * @method delete Delete a question from the database
 * @method get Get a question from the database
 * @method getAll Get all questions from the database
 */
interface IQuestion {
    insert(question: Question): void;
    update(question: Question): void;
    delete(question: Question): void;
    get(id: string): Promise<Question>;
    getByQuizID(quizID: number): Promise<Question[]>;
    getAll(): Promise<Question[]>;
}


/**
 * Interface for the Quizz class
 * 
 * @interface IQuizz
 * 
 * @method insert Insert a quizz into the database
 * @method update Update a quizz in the database
 * @method delete Delete a quizz from the database
 * @method get Get a quizz from the database
 * @method getAll Get all quizz from the database
 */
interface IQuizz {
    insert(quizz: Quizz): void;
    update(quizz: Quizz): void;
    delete(quizz: Quizz): void;
    get(id: string): Promise<Quizz>;
    getAll(): Promise<Quizz[]>;
}


/**
 * Interface for the User class
 * 
 * @interface IUser
 * 
 * @method insert Insert a user into the database
 * @method update Update a user in the database
 * @method delete Delete a user from the database
 * @method get Get a user from the database
 * @method getAll Get all users from the database
 */
interface IUser {
    insert(user: User): void;
    update(user: User): void;
    delete(user: User): void;
    get(id: string): Promise<User>;
    getAll(): Promise<User[]>;
    getByUsername(username : string): Promise<User>;
}

export { IQuestion, IQuizz, IUser };