declare module 'backblaze-b2' {
  interface B2Options {
    applicationKeyId: string;
    applicationKey: string;
  }

  interface B2Response<T> {
    data: T;
  }

  interface UploadUrlResponse {
    uploadUrl: string;
    authorizationToken: string;
  }

  interface UploadFileResponse {
    fileId: string;
    fileName: string;
    uploadTimestamp: number;
  }

  interface UploadFileOptions {
    uploadUrl: string;
    uploadAuthToken: string;
    fileName: string;
    data: Buffer;
    contentType: string;
  }

  class B2 {
    constructor(options: B2Options);
    authorize(): Promise<void>;
    getUploadUrl(options: { bucketId: string }): Promise<B2Response<UploadUrlResponse>>;
    uploadFile(options: UploadFileOptions): Promise<B2Response<UploadFileResponse>>;
  }

  export default B2;
} 