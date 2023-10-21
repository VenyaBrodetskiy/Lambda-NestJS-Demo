import { IsNotEmpty, IsString } from 'class-validator';

export class PlanRes {
  @IsNotEmpty()
  @IsString()
  planId: string;
  @IsNotEmpty()
  @IsString()
  schemaVersion: string;
  @IsNotEmpty()
  @IsString()
  createdBy: string;
  @IsNotEmpty()
  @IsString()
  creationDate: string;
  @IsNotEmpty()
  @IsString()
  lastModified: string;
  @IsNotEmpty()
  @IsString()
  tasks: string;
}
