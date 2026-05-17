/**
 * FORGE AI PLUGIN SYSTEM
 * AI integration for code generation, modification, and explanation
 */

const forgeAI = {
    
    /* ================= STATE ================= */
    apiUrl: "http://localhost:3000/ai/modify",
    isLoading: false,
    lastResponse: null,
    generatedCode: null,
    backendAvailable: false,

    /* ================= EDITOR API ================= */
    
    /**
     * Get selected text from editor
     */
    getSelectedText() {
        let textarea = document.getElementById("code");
        if (!textarea) return "";
        
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        
        if (start === end) {
            return textarea.value;
        }
        
        return textarea.value.substring(start, end);
    },

    /**
     * Get all editor text
     */
    getAllText() {
        let textarea = document.getElementById("code");
        return textarea ? textarea.value : "";
    },

    /**
     * Insert text into editor
     */
    insertText(text) {
        let textarea = document.getElementById("code");
        if (!textarea) return;
        
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
        if (!textarea) return;
        
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        
        if (start === end) {
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
        let el = document.getElementById("forgeAiResponse");
        if (el) {
            el.innerText = text;
        }
        this.lastResponse = text;
    },

    /**
     * Show loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        let btn = document.querySelector("button[onclick='forgeAI.sendPrompt()']");
        if (btn) {
            if (loading) {
                btn.classList.add("loading");
                btn.disabled = true;
            } else {
                btn.classList.remove("loading");
                btn.disabled = false;
            }
        }
    },

    /* ================= BACKEND COMMUNICATION ================= */

    /**
     * Check backend availability
     */
    async checkBackend() {
        try {
            const response = await fetch(this.apiUrl, { method: "HEAD" });
            this.backendAvailable = response.ok;
            return this.backendAvailable;
        } catch (e) {
            this.backendAvailable = false;
            return false;
        }
    },

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
                }),
                timeout: 30000
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
            let errorMsg = `Error: ${error.message}\n\n`;
            errorMsg += `Backend URL: ${this.apiUrl}\n`;
            errorMsg += "Make sure backend is running.\n\n";
            errorMsg += "For now, try these manual prompts:\n";
            errorMsg += "• Fix: Review code for issues\n";
            errorMsg += "• Explain: Describe what code does\n";
            errorMsg += "• Optimize: Improve performance\n";
            
            this.setResponse(errorMsg);
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
        if (!code.trim()) {
            this.setResponse("No code to fix");
            return;
        }
        
        let prompt = "Fix any errors or issues in this code. Return the corrected code:";
        
        document.getElementById("forgeAiPrompt").value = prompt;
        await this.callAI(prompt, code);
    },

    /**
     * Ask AI to explain code
     */
    async explainCode() {
        let code = this.getSelectedText() || this.getAllText();
        if (!code.trim()) {
            this.setResponse("No code to explain");
            return;
        }
        
        let prompt = "Explain what this code does in simple terms:";
        
        document.getElementById("forgeAiPrompt").value = prompt;
        await this.callAI(prompt, code);
    },

    /**
     * Ask AI to optimize code
     */
    async optimizeCode() {
        let code = this.getSelectedText() || this.getAllText();
        if (!code.trim()) {
            this.setResponse("No code to optimize");
            return;
        }
        
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

        let textarea = document.getElementById("code");
        if (!textarea) return;
        
        let hasSelection = textarea.selectionStart !== textarea.selectionEnd;

        if (hasSelection) {
            this.replaceSelection(this.generatedCode);
            this.setResponse("✓ Code inserted (replaced selection)");
        } else {
            this.insertText(this.generatedCode);
            this.setResponse("✓ Code inserted (appended)");
        }
    },

    /* ================= LOCAL MOCK AI (OFFLINE MODE) ================= */
    
    /**
     * Simple mock AI for offline testing
     */
    mockAI(prompt, code) {
        let response = "";
        
        if (prompt.toLowerCase().includes("fix")) {
            response = `// Fixed version:\n${code}\n\n// Analysis:\n- Code structure is valid\n- No syntax errors detected`;
        } else if (prompt.toLowerCase().includes("explain")) {
            response = `This code:\n\n${code}\n\nDoes the following:\n- Processes input data\n- Performs operations\n- Returns results`;
        } else if (prompt.toLowerCase().includes("optimize")) {
            response = `// Optimized version:\n${code}\n\n// Improvements:\n- Better variable naming\n- Removed redundancy\n- Improved readability`;
        } else {
            response = `Processing prompt: "${prompt}"\n\nCode analyzed:\n${code}`;
        }
        
        return response;
    },

    /* ================= INITIALIZATION ================= */
    
    init() {
        console.log("🤖 Forge AI Plugin initialized");
        console.log("Backend API: " + this.apiUrl);
        console.log("Features:");
        console.log("  ✓ Code generation");
        console.log("  ✓ Code fixing");
        console.log("  ✓ Code explanation");
        console.log("  ✓ Code optimization");
        console.log("  ✓ Text insertion");
        
        // Check backend availability
        this.checkBackend().then(available => {
            if (available) {
                console.log("✓ Backend connected");
            } else {
                console.log("⚠ Backend not available (offline mode)");
            }
        });
    }
};

// Auto-initialize on load
document.addEventListener("DOMContentLoaded", () => {
    forgeAI.init();
});

// Also initialize if script loads after DOM
if (document.readyState !== "loading") {
    forgeAI.init();
}
