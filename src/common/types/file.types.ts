import { DocType, ImageType } from '@prisma/client';

export type Doc = { docType: DocType; url: string };
export type Image = { imgType: ImageType; url: string };
