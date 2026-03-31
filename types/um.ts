export interface LoginRequest {
  username: string;
  password: string;
  system: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface KeepAliveResponse {
  accessToken: string;
}

export interface UmSystem {
  id: string;
  clientId: string;
  systemName: string;
  systemCode: string;
  host: string;
}

export interface UmUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  clientId: string;
  role: string;
  status: string;
  phone: string;
  email: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
