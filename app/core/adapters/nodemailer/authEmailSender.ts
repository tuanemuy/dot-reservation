import type { Transporter } from "nodemailer";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AuthEmailSender } from "@/core/domain/auth/ports/authEmailSender";

export class NodemailerAuthEmailSender implements AuthEmailSender {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string,
  ) {}

  async sendVerificationEmail(params: {
    user: { id: string; email: string; name: string };
    url: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.user.email,
        subject: "メールアドレスの確認",
        text: [
          `${params.user.name} 様`,
          "",
          "ご登録ありがとうございます。",
          "以下のリンクをクリックして、メールアドレスの確認を完了してください。",
          "",
          params.url,
          "",
          "このメールに心当たりがない場合は、無視してください。",
        ].join("\n"),
        html: [
          `<p>${params.user.name} 様</p>`,
          "<p>ご登録ありがとうございます。</p>",
          "<p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>",
          `<p><a href="${params.url}">${params.url}</a></p>`,
          "<p>このメールに心当たりがない場合は、無視してください。</p>",
        ].join("\n"),
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.NetworkError,
        "Failed to send verification email",
        error,
      );
    }
  }

  async sendPasswordResetEmail(params: {
    user: { id: string; email: string; name: string };
    url: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.user.email,
        subject: "パスワードリセット",
        text: [
          `${params.user.name} 様`,
          "",
          "パスワードリセットのリクエストを受け付けました。",
          "以下のリンクをクリックして、パスワードをリセットしてください。",
          "",
          params.url,
          "",
          "このリクエストに心当たりがない場合は、無視してください。",
        ].join("\n"),
        html: [
          `<p>${params.user.name} 様</p>`,
          "<p>パスワードリセットのリクエストを受け付けました。</p>",
          "<p>以下のリンクをクリックして、パスワードをリセットしてください。</p>",
          `<p><a href="${params.url}">${params.url}</a></p>`,
          "<p>このリクエストに心当たりがない場合は、無視してください。</p>",
        ].join("\n"),
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.NetworkError,
        "Failed to send password reset email",
        error,
      );
    }
  }
}
