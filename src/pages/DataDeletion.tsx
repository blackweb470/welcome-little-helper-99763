import PolicyLayout from "@/components/PolicyLayout";

const DataDeletion = () => {
  return (
    <PolicyLayout 
      title="Data Deletion Policy" 
      lastUpdated="May 8, 2026" 
      icon="deletion"
    >
      <section>
        <p>
          At LYQN, we believe in your right to be forgotten. This page provides clear instructions on how you can request the permanent deletion of your account and all associated data from our systems.
        </p>
      </section>

      <h2>1. Our Commitment to Data Privacy</h2>
      <p>
        In accordance with global privacy standards (including GDPR, CCPA, and Meta Developer Policies), we provide a straightforward process for users to exercise their right to have their personal data removed.
      </p>

      <h2>2. What Data Is Deleted?</h2>
      <p>When a data deletion request is processed, the following information is permanently removed from our production databases:</p>
      <ul>
        <li><strong>Profile Information:</strong> Your name, email address, and avatar.</li>
        <li><strong>Business Content:</strong> All documents, website URLs, and text chunks used to train your AI agents.</li>
        <li><strong>Conversation Logs:</strong> All chat histories from your website widgets and WhatsApp integrations.</li>
        <li><strong>Integration Settings:</strong> Your API keys, webhook configurations, and dashboard preferences.</li>
      </ul>

      <h2>3. How to Initiate Deletion</h2>
      <p>You can request data deletion through either of the following methods:</p>
      
      <h3>Method A: Self-Service Deletion</h3>
      <p>
        Log in to your <strong>Dashboard</strong>, navigate to <strong>Profile Settings</strong>, and select the <strong>"Delete Account"</strong> option. This action is immediate and irreversible.
      </p>

      <h3>Method B: Manual Request</h3>
      <p>
        If you are unable to access your account, please send an email to <strong>akhatasebhudojoseph1@gmail.com</strong> with the subject "Data Deletion Request". Please provide the email address associated with the account you wish to delete.
      </p>

      <h2>4. Processing Time</h2>
      <p>
        Self-service deletions take effect immediately. Manual requests via email are typically processed within <strong>48 to 72 hours</strong>. Once your data is deleted, we will send a confirmation email to your registered address.
      </p>

      <h2>5. Backup Data</h2>
      <p>
        Please note that while your data is removed from our active production systems, it may remain in our encrypted backups for up to 30 days. These backups are only used for disaster recovery and are never accessed for any other purpose. After 30 days, backup records are also purged.
      </p>

      <h2>6. Contact for Privacy Inquiries</h2>
      <p>
        For any other questions regarding your data or our privacy practices, please reach out to:<br />
        <strong>Privacy Team: akhatasebhudojoseph1@gmail.com</strong>
      </p>
    </PolicyLayout>
  );
};

export default DataDeletion;
