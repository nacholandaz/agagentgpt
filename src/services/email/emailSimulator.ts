/**
 * Email Simulator
 * 
 * Stores emails in memory instead of sending them
 * Perfect for development and testing
 */

interface SimulatedEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  text: string;
  timestamp: Date;
  requesterLevel: number;
}

class EmailSimulator {
  private emails: SimulatedEmail[] = [];
  private maxEmails = 1000; // Prevent memory issues

  /**
   * "Send" an email (store it instead)
   */
  async sendEmail(
    to: string,
    subject: string,
    text: string,
    requesterLevel: number
  ): Promise<void> {
    const email: SimulatedEmail = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to,
      from: 'core@cocentrica.org', // Default from
      subject,
      text,
      timestamp: new Date(),
      requesterLevel,
    };

    this.emails.unshift(email); // Add to beginning

    // Keep only last maxEmails
    if (this.emails.length > this.maxEmails) {
      this.emails = this.emails.slice(0, this.maxEmails);
    }

    // Log to console for immediate feedback
    console.log('\n📧 [EMAIL SIMULATOR]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`---`);
    console.log(text);
    console.log('---\n');
  }

  /**
   * Get all emails
   */
  getAllEmails(): SimulatedEmail[] {
    return [...this.emails];
  }

  /**
   * Get emails for a specific recipient
   */
  getEmailsFor(to: string): SimulatedEmail[] {
    return this.emails.filter(email => email.to === to);
  }

  /**
   * Get latest email
   */
  getLatestEmail(): SimulatedEmail | null {
    return this.emails[0] || null;
  }

  /**
   * Clear all emails
   */
  clear(): void {
    this.emails = [];
  }

  /**
   * Get email count
   */
  getCount(): number {
    return this.emails.length;
  }
}

// Singleton instance
export const emailSimulator = new EmailSimulator();

