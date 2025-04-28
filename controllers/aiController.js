const studyAssistant = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: "No question provided." });
  }

  try {
    const prompt = `
    You are an AI-powered study assistant. Provide a clear and helpful answer to the student's question below. Explain thoroughly but in simple words if possible.

    Student's Question:
    ${question}

    Answer:
    `;

    const { OpenAI } = require("openai");
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/novita/v3/openai",
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "thudm/glm-4-32b-0414",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
    });

    const answer =
      chatCompletion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate an answer right now.";

    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error generating AI answer:", error);
    res
      .status(500)
      .json({ message: "Failed to generate study assistant response." });
  }
};

module.exports = { studyAssistant };
