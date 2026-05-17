/**
 * FORGE AI PLUGIN SYSTEM
 * Full AI integration for code generation, modification, and explanation
 */

const forgeAI = {
    
    /* ================= STATE ================= */
    apiUrl: "http://localhost:3000/ai/modify",
    isLoading: false,
    lastResponse: null,
    generatedCode: null,

    /* ================= EDITOR API ================= */
    
    /**
     * Get selected text from editor
     */
    getSelectedText() {
        let textarea = document.getElementById("code");
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        
        if (start === end) {
            // No selection, return all text
            return textarea.value;
        }
        
        return textarea.value.substring(start, end);
    },

    /**
     * Get all editor text
     */
    getAllText() {
        return document.getElementById("code").value;
    },

    /**
     * Insert text into editor
     */
    insertText(text) {
        let textarea = document.getElementById("code");
        let cursorPos = textarea.selectionEnd;
        let before = textarea.value.substring(0, cursorPos);
        let after = textarea.value.substring(cursorPos);
        
        textarea.value = before + text + after;
        textarea.selectionEnd = cursorPos + text.length;
        
        // Trigger highlight update
        let event = new Event("input", { bubbles: true });
        textarea.dispatchEvent(event);
    },

    /**
     * Replace selected text
     */
    replaceSelection(text) {
        let textarea = document.getElementById("code");
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        
        if (start === end) {
            // No selection, replace all
            textarea.value = text;
        } else {
            let before = textarea.value.substring(0, start);
            let after = textarea.value.substring(end);
            textarea.value = before + text + after;
            textarea.selectionEnd = start + text.length;
        }
        
        // Trigger highlight update
        let event = new Event("input", { bubbles: true });
        textarea.dispatchEvent(event);
    },

    /**
     * Update response display
     */
    setResponse(text) {
        document.getElementById("forgeAiResponse").innerText = text;
        this.lastResponse = text;
    },

    /**
     * Show loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        let btn = document.querySelector("button[onclick='forgeAI.sendPrompt()']");
        if (loading) {
            btn.classList.add("loading");
            btn.disabled = true;
        } else {
            btn.classList.remove("loading");
            btn.disabled = false;
        }
    },

    /* ================= BACKEND COMMUNICATION ================= */

    /**
     * Send request to AI backend
     */
    async callAI(prompt, code) {
        try {
            this.setLoading(true);
            this.setResponse("Calling AI...");
            
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: prompt,
                    code: code
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Store generated code
            this.generatedCode = data.content || data.preview || "";
            
            // Display response
            this.setResponse(
                data.content || 
                data.preview || 
                JSON.stringify(data, null, 2)
            );
            
            return data;
            
        } catch (error) {
            this.setResponse(`Error: ${error.message}\n\nMake sure backend is running at ${this.apiUrl}`);
            console.error("AI Error:", error);
            return null;
        } finally {
            this.setLoading(false);
        }
    },

    /* ================= AI ACTIONS ================= */

    /**
     * Send custom prompt
     */
    async sendPrompt() {
        let prompt = document.getElementById("forgeAiPrompt").value;
        
        if (!prompt.trim()) {
            this.setResponse("Please enter a prompt");
            return;
        }

        let selectedCode = this.getSelectedText();
        
        // If no selection, use all text
        if (!selectedCode || selectedCode === this.getAllText()) {
            selectedCode = this.getAllText();
        }

        await this.callAI(prompt, selectedCode);
    },

    /**
     * Ask AI to fix code issues
     */
    async fixCode() {
        let code = this.getSelectedText() || this.getAllText();
        let prompt = "Fix any errors or issues in this code. Return the corrected code:";
        
        document.getElementById("forgeAiPrompt").value = prompt;
        await this.callAI(prompt, code);
    },

    /**
     * Ask AI to explain code
     */
    async explainCode() {
        let code = this.getSelectedText() || this.getAllText();
        let prompt = "Explain what this code does in simple terms:";
        
        document.getElementById("forgeAiPrompt").value = prompt;
        await this.callAI(prompt, code);
    },

    /**
     * Ask AI to optimize code
     */
    async optimizeCode() {
        let code = this.getSelectedText() || this.getAllText();
        let prompt = "Optimize this code for performance and readability. Return the improved code:";
        
        document.getElementById("forgeAiPrompt").value = prompt;
        await this.callAI(prompt, code);
    },

    /**
     * Insert generated code into editor
     */
    insertGenerated() {
        if (!this.generatedCode) {
            this.setResponse("No generated code available. Run an AI action first.");
            return;
        }

        let hasSelection = document.getElementById("code").selectionStart !== 
                          document.getElementById("code").selectionEnd;

        if (hasSelection) {
            this.replaceSelection(this.generatedCode);
            this.setResponse("✓ Code inserted (replaced selection)");
        } else {
            this.insertText(this.generatedCode);
            this.setResponse("✓ Code inserted (appended)");
        }
    },

    /* ================= INITIALIZATION ================= */
    
    init() {
        console.log("Forge AI Plugin initialized");
        console.log("Backend API: " + this.apiUrl);
        console.log("Editor API ready:");
        console.log("  - getSelectedText()");
        console.log("  - getAllText()");
        console.log("  - insertText(text)");
        console.log("  - replaceSelection(text)");
    }
};

// Auto-initialize on load
document.addEventListener("DOMContentLoaded", () => {
    forgeAI.init();
});

// Also initialize if script loads after DOM
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        forgeAI.init();
    });
} else {
    forgeAI.init();
}
