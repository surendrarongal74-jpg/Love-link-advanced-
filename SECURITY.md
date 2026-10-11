# Security Policy

## Supported Versions

Love Link is currently under development. Security fixes will be prioritized for the latest maintained version.

## Reporting a Vulnerability

If you discover a security vulnerability in Love Link, please report it privately.

- Project: Love Link
- Contact: lovelink165@gmail.com
- Subject: Private Security Report — Love Link

Please include:

- A description of the vulnerability.
- Steps to reproduce the issue.
- The potential impact.
- Any relevant screenshots or logs, with personal information removed.

Please do not publicly disclose vulnerabilities or exploit them against other users.

## Security Best Practices

Love Link aims to protect users' accounts, conversations, photos, voice messages, and shared memories.

The project should follow these practices:

- Never commit API keys, passwords, access tokens, or private credentials to Git.
- Store server-side secrets in environment variables or a secure secrets manager.
- Never expose privileged Firebase service-account credentials in a mobile app or public repository.
- Configure Firebase Authentication, Firestore Security Rules, and Storage Rules to restrict access to authorized users.
- Verify permissions on the server for sensitive operations and partner-linked data.
- Use HTTPS for network communication.
- Validate user input and handle authentication failures securely.
- Avoid logging passwords, tokens, private messages, or other sensitive user data.
- Review third-party dependencies and apply security updates.
- Keep API keys and other credentials out of client-side code whenever they require server-side protection.

## Scope

This policy covers the Love Link application, its backend services, authentication, databases, file storage, and integrations maintained by the project.

## Response

Reports will be reviewed as soon as reasonably possible. The reporter may be contacted for additional information. Fixes and disclosure decisions will depend on the severity and circumstances of the issue.

Thank you for helping make Love Link safer for everyone.
