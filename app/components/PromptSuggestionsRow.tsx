import React from 'react'
import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({ OnPromptClick }) => {
    const prompts = [
        "When will i receive my certificate ? ",
        "Class and assignment related enquiries?",
        "I want refund ",
        "What is my OJL status?",
    ]

    return (
        <div className='prompt-suggestions-row'>
            {prompts.map((prompt, index) => 
                <PromptSuggestionButton 
                    key={`suggestion-${index}`}
                    text={prompt}
                    onClick={() => OnPromptClick(prompt)}
                />
            )}
        </div>
    )
}

export default PromptSuggestionsRow
