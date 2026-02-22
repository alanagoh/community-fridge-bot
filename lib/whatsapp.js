/**
 * WhatsApp Message Helpers
 *
 * Functions for sending messages back to users via the WhatsApp Cloud API.
 * Uses the Meta Graph API under the hood.
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Send a text message to a WhatsApp user
 *
 * @param {string} recipientPhoneNumber - The user's phone number (with country code, no +)
 * @param {string} messageText - The message to send
 * @returns {Promise<object>} - The API response
 */
export async function sendTextMessage(recipientPhoneNumber, messageText) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_TOKEN;

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const requestBody = {
    messaging_product: 'whatsapp',
    to: recipientPhoneNumber,
    type: 'text',
    text: {
      body: messageText
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', JSON.stringify(data));
      throw new Error(`WhatsApp API error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log(`Message sent successfully to ${recipientPhoneNumber}`);
    return data;

  } catch (error) {
    console.error('Failed to send WhatsApp message:', error.message);
    throw error;
  }
}

/**
 * Send an interactive button message
 * Useful for verification prompts like "Is this correct? [Yes] [No]"
 *
 * @param {string} recipientPhoneNumber - The user's phone number
 * @param {string} bodyText - The main message text
 * @param {Array<{id: string, title: string}>} buttons - Up to 3 buttons
 * @returns {Promise<object>} - The API response
 */
export async function sendButtonMessage(recipientPhoneNumber, bodyText, buttons) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_TOKEN;

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const requestBody = {
    messaging_product: 'whatsapp',
    to: recipientPhoneNumber,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map(button => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title
          }
        }))
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', JSON.stringify(data));
      throw new Error(`WhatsApp API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data;

  } catch (error) {
    console.error('Failed to send button message:', error.message);
    throw error;
  }
}
