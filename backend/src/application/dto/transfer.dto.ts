import {IsNumber, IsOptional, IsString, Min} from "class-validator";

export class TransferDto {
    @IsString()
    receiverId!: string;

    @IsNumber()
    @Min(0.01, {message: "Amount must be greater than 0"})
    amount!: number;

    @IsOptional()
    @IsString()
    description?: string;
}

