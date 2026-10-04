import { Module } from '@nestjs/common';
import { LibraryReferenceController } from './library-reference.controller';
import { LibraryReferenceService } from './library-reference.service';

@Module({
  controllers: [LibraryReferenceController],
  providers: [LibraryReferenceService],
  exports: [LibraryReferenceService],
})
export class LibraryReferenceModule {}
