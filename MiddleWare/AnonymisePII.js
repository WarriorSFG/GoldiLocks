const axios = require("axios");
const PRESIDIO = process.env.PRESIDIO;

async function anonymizeText(text) {
  try {
    const response = await axios.post(`${PRESIDIO}/anonymize`, {
      text: text
    }
    );
    return response.data;
  } catch (error) {
    console.error("Presidio error:", error.message);
    throw error;
  }
}

async function deanonymizeText(text, mapping) {
  try {
    const response = await axios.post(`${PRESIDIO}/deanonymize`,
      {
        text: text,
        mapping: mapping
      }
    );
    return response.data;
  } catch (error) {
    console.error("Presidio error:", error.message);
    throw error;
  }
}

module.exports = {
  anonymizeText,
  deanonymizeText
};