/**
 * WhatsApp Webhook Handler
 *
 * This file receives all incoming WhatsApp messages.
 * Meta sends messages here, and we process them and reply.
 */

import { sendTextMessage } from '../lib/whatsapp.js';

/**
 * Main webhook handler - Vercel calls this for every request
 */
export default async function handler(request, response) {

  // ===== GET REQUEST: Webhook Verification =====
  // Meta sends a GET request once to verify this webhook is real.
  // We need to echo back a challenge code they send us.
  if (request.method === 'GET') {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    // Check that the verify token matches what we set in Meta dashboard
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return response.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed - token mismatch');
      return response.status(403).send('Forbidden');
    }
  }

  // ===== POST REQUEST: Incoming Messages =====
  // Meta sends a POST request every time someone messages the bot
  if (request.method === 'POST') {
    const body = request.body;

    // Verify this is a WhatsApp message event
    if (body.object !== 'whatsapp_business_account') {
      return response.status(404).send('Not a WhatsApp event');
    }

    // Extract the message details from Meta's nested structure
    // Meta wraps messages in: body.entry[0].changes[0].value.messages[0]
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    // If there's no message, it might be a status update (delivered, read, etc.)
    // We acknowledge it but don't process it
    if (!messages || messages.length === 0) {
      return response.status(200).send('OK');
    }

    const message = messages[0];
    const senderPhoneNumber = message.from;
    const messageType = message.type;

    // For MVP, we only handle text messages
    // Later we'll add image handling for coordinator photo uploads
    if (messageType === 'text') {
      const messageText = message.text.body;

      console.log(`Received message from ${senderPhoneNumber}: ${messageText}`);

      // For now, just echo back a confirmation
      // TODO: Replace with actual routing logic (coordinator vs user)
      await sendTextMessage(
        senderPhoneNumber,
        `Thanks for your message! The Community Fridge Bot is still being set up. We'll be live soon!`
      );
    }

    // Always respond 200 to Meta, even if we couldn't process the message
    // Otherwise Meta will keep retrying
    return response.status(200).send('OK');
  }

  // Any other HTTP method is not supported
  return response.status(405).send('Method not allowed');
}
