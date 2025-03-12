"use client";
import { useState } from "react";

const MAX_HISTORY = 6;

export default function Form() {
  const [inputValue, setInputValue] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updatedConversation = [
      ...conversation.slice(-MAX_HISTORY), 
      { role: "user", content: inputValue },
    ];

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await fetch("/api/run-inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedConversation }),
      });

      const data = await res.json();
      const result = extractContent(data);
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");

      setConversation([...updatedConversation, { role: "assistant", content: result }]);
      setInputValue("");
    } catch (error) {
      console.error("Error:", error.message);
    }

    setLoading(false);
  };

  function extractContent(apiResponse) {
    const { text } = apiResponse;

    // Split response by "data: " but remove empty entries
    const jsonStrings = text.split("data: ").filter((entry) => {
      try {
        const jsonData = JSON.parse(entry.trim());
        // Ensure it's the assistant's message by checking for 'choices'
        return jsonData.choices?.[0]?.message?.content;
      } catch {
        return false; // Skip invalid JSON entries
      }
    });

    if (jsonStrings.length === 0) return null;

    // Get the last valid assistant response
    const finalData = JSON.parse(jsonStrings[jsonStrings.length - 1].trim());
    return finalData.choices[0].message.content;
}


  return (
    <div className="flex flex-col mx-auto text-center items-center w-2/3 justify-center bg-black text-white">
      <p className="text-3xl mb-4">llama3.1:8b</p>

      <div className="w-full p-6 border border-white rounded-lg bg-gray-900 text-left">
        <p className="text-lg font-semibold mb-2">Conversation:</p>
        <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg w-full text-white">
          {conversation.length === 0 ? (
            <p className="text-gray-400">No messages yet. Ask something!</p>
          ) : (
            conversation.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.role === "user" ? "text-blue-300" : "text-green-300"}`}>
                <strong>{msg.role === "user" ? "You:" : "AI:"}</strong> {msg.content}
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto w-full p-6 border border-white rounded-lg mt-4">
        {!loading ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-3 bg-black border border-white rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="Ask me anything..."
            required
          />
        ) : (
          <img src="lp-logo.svg" className="w-6 mx-auto animate-spin" />
        )}

        <button
          type="submit"
          className="w-1/3 mt-4 p-3 font-semibold border border-white rounded-lg transition-all duration-200 ease-in-out bg-white text-black hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Thinking..." : "Submit"}
        </button>
      </form>

      {conversation.length > 0 && (
        <button
          className="w-1/3 mt-4 p-3 font-semibold border border-white rounded-lg transition-all duration-200 ease-in-out bg-white text-black hover:bg-gray-300"
          onClick={() => {
            setConversation([]);
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
