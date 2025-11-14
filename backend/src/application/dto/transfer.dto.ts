import {IsNumber, IsOptional, IsString, Min} from "class-validator";
import {Type} from "class-transformer";

export class TransferDto {
    @IsString()
    receiverId!: string; // Can be user ID or email

    @Type(() => Number)
    @IsNumber({}, {message: "Amount must be a number"})
    @Min(0.01, {message: "Amount must be greater than 0"})
    amount!: number;

    @IsOptional()
    @IsString()
    description?: string;
}

