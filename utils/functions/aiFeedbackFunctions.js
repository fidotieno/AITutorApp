require("dotenv").config();
const { OpenAI } = require("openai");

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/novita/v3/openai",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

const generateFeedback = async (questionAndAnswer) => {
  const formattedPrompt = `
  You are a helpful and knowledgeable teacher. Evaluate the student's answer to the following question. Your job is to explain in one about 100 words whether the answer is correct or incorrect, and why. Address the student directly in a friendly tone. 
  
  Question and Answer:
  ${questionAndAnswer}
  
  Feedback:
  `;

  try {
    const chatCompletion = await client.chat.completions.create({
      model: "thudm/glm-4-32b-0414",
      messages: [
        {
          role: "user",
          content: formattedPrompt,
        },
      ],
      max_tokens: 512,
    });

    return (
      chatCompletion.choices[0].message.content ||
      "Sorry, an error occurred while generating feedback."
    );
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Sorry, an error occurred while generating feedback.";
  }
};

module.exports = generateFeedback;
