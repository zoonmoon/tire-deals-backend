import crypto from 'crypto';
import { sendEmail } from '@/app/api/utils/email';

export function generateVerificationCode() {

    const code = crypto
        .randomInt(100000, 1000000)
        .toString();

    const hash = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');

    return {
        code,
        hash
    };

}


export async function sendVerificationEmail({
    email,
    firstName,
    code
}) {

    return sendEmail({

        to: email,

        subject: 'Verify your email',

        html: `
            <div
                style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                "
            >

                <h2>Verify your email</h2>

                <p>
                    Hi ${firstName || 'there'},
                </p>

                <p>
                    Thanks for creating your account.
                    Please use the verification code below
                    to verify your email address.
                </p>

                <div
                    style="
                        margin: 30px 0;
                        text-align: center;
                    "
                >

                    <div
                        style="
                            display: inline-block;
                            padding: 15px 25px;
                            background: #f5f5f5;
                            border-radius: 8px;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                        "
                    >
                        ${code}
                    </div>

                </div>

                <p>
                    This code will expire in 15 minutes.
                </p>

                <p>
                    If you did not create this account,
                    you can safely ignore this email.
                </p>

            </div>
        `

    });

}