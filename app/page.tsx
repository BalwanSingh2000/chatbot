
"use client";
import Image from "next/image";
import logo from "./assets/logo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import { useRef, useEffect } from "react";

const Home = () => {
  const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat();
  const noMessages = !messages || messages.length === 0;

  const handlePrompt = (promptText) => {
    const msg = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  };

  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main>
       <div className="logo-container">
    <Image src={logo} width={250} alt="CI logo" priority />
  </div>
      <section className={`chat-section ${noMessages ? "" : "populated"}`}>
        {noMessages ? (
          <>
            <p className="starter-text">Your All in one place for all the support.</p>
            <PromptSuggestionsRow OnPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={bottomRef} />
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something ....."
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;
