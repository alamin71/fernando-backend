export type ICreateAccount = {
  name: string;
  email: string;
  otp: number;
};

export type IResetPassword = {
  email: string;
  otp: number;
};
export interface IResetPasswordByEmail {
  email: string;
  resetUrl: string;
}
export interface IHelpContact {
  name: string;
  email: string;
  phone?: string;
  read: boolean;
  message: string;
}
export type IContact = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
