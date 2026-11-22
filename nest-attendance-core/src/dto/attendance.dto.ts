import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAttendanceDto {
    @ApiProperty({
        description: 'The image of the user',
        example: 'image.jpg',
    })
    @IsString()
    @IsNotEmpty()
    imageKey: string;
}

export class PaginationDto {
    @ApiProperty({
        description: 'The page number',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    page?: number;

    @ApiProperty({
        description: 'The limit of the page',
        example: 10,
    })
    @IsNumber()
    @IsOptional()
    limit?: number;
}