export interface UploadFileParams {
  cloudPath: string;
  fileContent: string;
}

export interface ListFilesParams {
  prefix: string;
  marker?: string;
}

export interface DeleteFileParams {
  cloudPath: string;
}

export interface GetFileInfoParams {
  cloudPath: string;
}

export interface ToolResponse {
  success: boolean;
  [key: string]: any;
} 