import {Email} from "../value-objects/email.vo";

export interface UserProps {
    id: string;
    email: Email;
    name: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export class User {
    private constructor(private props: UserProps) {
    }

    static create(props: UserProps): User {
        return new User(props);
    }

    get id(): string {
        return this.props.id;
    }

    get email(): Email {
        return this.props.email;
    }

    get name(): string {
        return this.props.name;
    }

    get passwordHash(): string {
        return this.props.passwordHash;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    toJSON() {
        return {
            id: this.props.id,
            email: this.props.email.toString(),
            name: this.props.name,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
        };
    }
}

