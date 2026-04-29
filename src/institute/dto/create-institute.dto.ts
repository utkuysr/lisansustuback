import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateInstituteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}