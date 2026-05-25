import PolicyLayout from "@/components/PolicyLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyLayout 
      title="Privacy Policy" 
      lastUpdated="May 8, 2026" 
      icon="privacy"
    >
      <section>
        <p>
          At LYQN, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or use our services, including our web widget, dashboard, and WhatsApp integration.
        </p>
      </section>

      <h2>1. Information We Collect</h2>
      <p>
        When you use LYQN, we collect several types of information from and about users of our Service, including:
      </p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, and password when you register.</li>
        <li><strong>Business Data:</strong> Website URLs, documents, and content you provide to train your AI agents.</li>
        <li><strong>Communication Data:</strong> Logs of messages sent between your business and your customers via our widget or WhatsApp Business API.</li>
        <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage statistics.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our Service.</li>
        <li>Process and complete transactions.</li>
        <li>Generate AI responses for your customers based on your provided business knowledge.</li>
        <li>Send you technical notices, updates, and security alerts.</li>
        <li>Analyze usage patterns to enhance user experience.</li>
      </ul>

      <h2>3. Data Processing and AI</h2>
      <p>
        We use third-party AI models (specifically OpenAI) to process conversation data. While we use your business documents to "train" your specific agent's behavior, we do not allow these third parties to use your private data to train their general public models.
      </p>

      <h2>4. WhatsApp Business Data</h2>
      <p>
        Our WhatsApp integration complies with Meta's developer policies. Messages sent via WhatsApp are processed through the WhatsApp Business API. We store these messages solely to provide you with conversation history and to improve AI accuracy.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We implement business-grade security measures to protect your data. This includes end-to-end encryption for sensitive data, regular security audits, and hosting on secure cloud infrastructure provided by Supabase (PostgreSQL) and Google Cloud.
      </p>

      <h2>6. Data Retention and Deletion</h2>
      <p>
        We retain your personal information for as long as your account is active. You may request the deletion of your data at any time through our <a href="/delete">Data Deletion</a> page.
      </p>

      <h2>7. Your Rights (GDPR/CCPA)</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or limit the use of your personal data. To exercise these rights, please contact us at <strong>akhatasebhudojoseph1@gmail.com</strong>.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at:<br />
        <strong>Email: akhatasebhudojoseph1@gmail.com</strong>
      </p>
    </PolicyLayout>
  );
};

export default PrivacyPolicy;
