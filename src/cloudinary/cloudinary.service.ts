import { Inject } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary) {}
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = this.cloudinary.uploader.upload_stream(
        (
          error: any,
          result:
            | UploadApiResponse
            | UploadApiErrorResponse
            | PromiseLike<UploadApiResponse | UploadApiErrorResponse>,
        ) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      console.log('upload done');

      upload.end(file.buffer);
    });
  }
}
