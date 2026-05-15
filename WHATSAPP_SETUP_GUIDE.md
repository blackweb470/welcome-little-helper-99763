# Meta WhatsApp Integration: Complete Setup Guide

Follow these steps in order to connect your WhatsApp Business account to the Lyqn AI platform.

## Phase 1: Meta Developer Portal
1. **Create an App**:
   - Go to [Meta for Developers](https://developers.facebook.com/).
   - Create a new app (Select **Other** -> **Business**).
   - Name it "Lyqn AI" or your business name.

2. **Add WhatsApp Product**:
   - In the App Dashboard, find **WhatsApp** and click **Set Up**.

3. **Domain Whitelisting (Crucial)**:
   - Go to **App Settings > Basic**.
   - **App Domains**: Add `lyqn.app`.
   - **Site URL**: Scroll down, click **Add Platform**, select **Website**, and enter `https://lyqn.app`.
   - **JavaScript SDK**: Go to **WhatsApp > Configuration**. Add `https://lyqn.app` to the **Allowed Domains for the JavaScript SDK**.

4. **Gather IDs**:
   - **App ID**: `2143263399800980`
   - **App Secret**: `41749704b6a11dacd44584f47e8e8a26`
   - **Config ID**: `970530725626776`

---

## Phase 2: Project Configuration
1. **Local Environment**:
   - Update your `.env` file with the IDs gathered above:
     ```env
     VITE_META_APP_ID="2143263399800980"
     VITE_WHATSAPP_CONFIG_ID="970530725626776"
     META_APP_SECRET="41749704b6a11dacd44584f47e8e8a26"
     ```

2. **Cloud Environment (Supabase)**:
   - Run this command in your terminal to sync the secrets to the Edge Functions:
     ```bash
     npx supabase secrets set META_APP_SECRET="41749704b6a11dacd44584f47e8e8a26" VITE_META_APP_ID="2143263399800980" --project-ref rgczbabidcqvpyiiqjfv
     ```

---

## Phase 3: Final Connection
1. Log in to your dashboard at `https://lyqn.app`.
2. Go to the **WhatsApp Integration** tab.
3. Click **Connect WhatsApp Now**.
4. Complete the Meta onboarding flow in the popup window.

## Phase 4: Webhook Configuration (For Receiving Messages)
To receive messages back from customers, you must set up the Webhook in the Meta Portal:
1. Go to **WhatsApp > Configuration**.
2. **Callback URL**: `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/whatsapp-webhook`
3. **Verify Token**: `lyqn_whatsapp_verify_2026`
4. **Webhook Fields**: Click **Manage** and subscribe to **messages**.

---

## Alternative: Manual Setup (Fastest for Developers)
If you encounter "Domain Not Whitelisted" errors from Meta, use the **Manual Configuration** link at the bottom of the WhatsApp settings page:
1. Go to **WhatsApp > API Setup** in Meta Portal.
2. Copy the **Phone Number ID**.
3. Copy the **WhatsApp Business Account ID**.
4. Generate a **Permanent Access Token** (System User).
5. Paste these directly into the Lyqn Dashboard.
