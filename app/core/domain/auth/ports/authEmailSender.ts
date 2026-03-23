export interface AuthEmailSender {
  sendVerificationEmail(params: {
    user: { id: string; email: string; name: string };
    url: string;
  }): Promise<void>;
  sendPasswordResetEmail(params: {
    user: { id: string; email: string; name: string };
    url: string;
  }): Promise<void>;
}
