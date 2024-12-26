
type ID = number|null;

class Question {
    private id: ID;
    private question: string;
    private answers: string;
    private options: string[];

    constructor(id: ID, question: string, answers: string, options: string[]) {
        this.id = id;
        this.question = question;
        this.answers = answers;
        this.options = options;
    }

    getQuestion(): string {
        return this.question;
    }

    getAnswers(): string {
        return this.answers;
    }

    getOptions(): string[] {
        return this.options;
    }

    getID(): ID{
        return this.id;
    }

    setID(id: ID): void {
        this.id = id;
    }
}

class Quizz {
    private id: ID;
    private name: string;
    private description: string;
    private created_at: string;
    private created_by: User;
    private questions: Question[];

    constructor(id: ID, name: string, description: string, created_at: string, created_by: User, questions: Question[]) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.created_at = created_at;
        this.created_by = created_by;
        this.questions = questions;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getCreatedAt(): string {
        return this.created_at;
    }

    getCreatedBy(): User {
        return this.created_by;
    }

    getQuestions(): Question[] {
        return this.questions;
    }

    getID(): ID {
        return this.id;
    }

    setID(id: ID): void {
        this.id = id;
    }
}

class User {
    private id: ID;
    private username: string;
    private password: string;

    constructor(id: ID, username: string, password: string) {
        this.id = id;
        this.username = username;
        this.password = password;
    }

    getUsername(): string {
        return this.username;
    }

    getPassword(): string {
        return this.password;
    }

    getID(): ID {
        return this.id;
    }

    setID(id: ID): void {
        this.id = id;
    }
}

export { Question, Quizz, User };