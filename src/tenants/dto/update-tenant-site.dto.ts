import { IsString, Matches, MinLength } from 'class-validator';

export class UpdateTenantSiteDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Solo minúsculas, números y guiones',
  })
  slug!: string;
}
