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
  /** What the signed-in user may do to this user, as UM decides it (um-api ADR-0006). */
  can?: UmUserPermissions;
}

export interface UmUserPermissions {
  edit: boolean;
  delete: boolean;
  setStatus: boolean;
  setRole: boolean;
  setPassword: boolean;
  unlock: boolean;
  assignableRoles: string[];
}

/** What the signed-in user may do beyond individual users. */
export interface UmUserRules {
  creatableRoles: string[];
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
