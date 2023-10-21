import { IsNotEmpty, IsString } from 'class-validator';

export class PlanReq {
  @IsNotEmpty()
  @IsString()
  tasks: string;
  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
