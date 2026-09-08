import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MediaAuthGuard } from './media-auth.guard';

@Module({
  imports: [PrismaModule, JwtModule.register({}), AuthModule],
  controllers: [FilesController],
  providers: [FilesService, MediaAuthGuard],
})
export class FilesModule {}
