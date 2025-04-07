document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.querySelector("input[type='text']");
    const sendButton = document.querySelector("button.bg-custom");
    const chatContainer = document.querySelector(".space-y-4");
    const newChatButton = document.querySelector(".w-full.bg-custom");
    const recentChatsContainer = document.querySelector(".space-y-3");
    const downloadButton = document.querySelector(".fa-download")?.parentElement;

    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    let currentChatIndex = chatHistory.length > 0 ? 0 : null;

    const API_KEY = "AIzaSyDHw-AOSDtD6UZ3hVRCw1JTe0VkXxCMxzE"; // Replace with your API key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    
    
    


    function updateRecentChats() {
        recentChatsContainer.innerHTML = "";
    
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
    
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
    
        const todayChats = [];
        const yesterdayChats = [];
        const previousChats = [];
    
        chatHistory.forEach((chat, index) => {
            let chatDate = chat.timestamp ? new Date(chat.timestamp) : new Date(); // Parse timestamp correctly
            chatDate.setHours(0, 0, 0, 0); // Normalize time
    
            let chatElement = document.createElement("div");
            chatElement.classList.add("flex", "items-center", "justify-between", "p-2", "rounded", "hover:bg-gray-100");
    
            let chatLink = document.createElement("a");
            chatLink.href = "#";
            chatLink.classList.add("flex", "items-center", "justify-between", "w-full", "text-gray-600", "hover:text-custom");
            chatLink.addEventListener("click", function () {
                loadChat(index);
            });
    
            chatLink.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-comments w-5"></i>
                    <span class="ml-2">${chat.title}</span>
                </div>
            `;
    
            let deleteButton = document.createElement("button");
            deleteButton.classList.add("text-red-500", "hover:text-red-700");
            deleteButton.innerHTML = `<i class="fas fa-trash"></i>`;
            deleteButton.addEventListener("click", function (event) {
                event.stopPropagation();
                deleteChat(index);
            });
    
            chatElement.appendChild(chatLink);
            chatElement.appendChild(deleteButton);
    
            // Categorize chats based on the timestamp
            if (chatDate.getTime() === today.getTime()) {
                todayChats.push(chatElement);
            } else if (chatDate.getTime() === yesterday.getTime()) {
                yesterdayChats.push(chatElement);
            } else if (chatDate.getTime() >= sevenDaysAgo.getTime()) {
                previousChats.push(chatElement);
            }
        });
    
        // Append sections in order
        if (todayChats.length > 0) {
            recentChatsContainer.appendChild(createSectionHeader("Today"));
            todayChats.forEach(chat => recentChatsContainer.appendChild(chat));
        }
        if (yesterdayChats.length > 0) {
            recentChatsContainer.appendChild(createSectionHeader("Yesterday"));
            yesterdayChats.forEach(chat => recentChatsContainer.appendChild(chat));
        }
        if (previousChats.length > 0) {
            recentChatsContainer.appendChild(createSectionHeader("Previous 7 Days"));
            previousChats.forEach(chat => recentChatsContainer.appendChild(chat));
        }
    }
    
    // Helper function to create section headers
    function createSectionHeader(title) {
        let header = document.createElement("div");
        header.classList.add("text-gray-500", "font-semibold",  "mb-2");
        header.textContent = title;
        return header;
    }
    
    
    


    function saveChat(title, messages) {
        if (currentChatIndex === null) {
            chatHistory.push({ title, messages, timestamp: new Date().toISOString() }); // Store timestamp as ISO string
            currentChatIndex = chatHistory.length - 1;
        } else {
            chatHistory[currentChatIndex].messages = messages;
            if (!chatHistory[currentChatIndex].timestamp) {
                chatHistory[currentChatIndex].timestamp = new Date().toISOString(); // Ensure old chats get a timestamp
            }
        }
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        updateRecentChats();
    }
    
    

    function loadChat(index) {
        currentChatIndex = index;
        chatContainer.innerHTML = ""; // Clear previous messages before loading new chat
        chatHistory[index].messages.forEach(({ sender, text }) => appendMessage(text, sender, false));
    }

    function deleteChat(index) {
        chatHistory.splice(index, 1);
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        updateRecentChats();
        if (chatHistory.length === 0) {
            chatContainer.innerHTML = "";
            currentChatIndex = null;
        } else {
            loadChat(0);
        }
    }

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const userMessage = inputField.value.trim();
        if (userMessage === "") return;

        appendMessage(userMessage, "user", true);
        inputField.value = "";
        showTypingIndicator();
        fetchAPIResponse(userMessage);

        if (chatHistory[currentChatIndex].title === "New Chat" && userMessage.trim() !== "") {
            chatHistory[currentChatIndex].title = userMessage.substring(0, 20); // Set title to first message (max 20 chars)
            updateRecentChats();
        }
        
    }

    function appendMessage(message, sender, save = true) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("flex", "items-start");

        if (sender === "user") {
            messageElement.classList.add("justify-end");
            messageElement.innerHTML = `
                <div class="bg-custom text-white rounded-lg p-4 max-w-[75%] shadow-sm">
                    <p>${message}</p>
                </div>`;
        } else {
            let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\n/g, "<br>");
            messageElement.innerHTML = `
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full bg-custom flex items-center justify-center">
                        <i class="fas fa-robot text-white text-sm"></i>
                    </div>
                </div>
                <div class="ml-3 bg-gray-100 rounded-lg p-4 max-w-[75%] shadow-sm">
                    <p>${formattedMessage}</p>
                </div>`;
        }

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (save && currentChatIndex !== null) {
            chatHistory[currentChatIndex].messages.push({ sender, text: message });
            localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        }
    }

    function showTypingIndicator() {
        const typingElement = document.createElement("div");
        typingElement.id = "typing-indicator";
        typingElement.classList.add("flex", "items-start");
        typingElement.innerHTML = `
            <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-custom flex items-center justify-center">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
            </div>
            <div class="ml-3 bg-gray-100 rounded-lg p-4 max-w-[75%] shadow-sm">
                <p>🤖 Bot is typing...</p>
            </div>`;
        chatContainer.appendChild(typingElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) typingIndicator.remove();
    }

    async function fetchAPIResponse(userMessage) {
        try {
            // Define keywords related to legal topics
            const legalKeywords = [
                "law", "lawsuit", "legal", "contract", "agreement", "court",
                "attorney", "judge", "case", "justice", "criminal", "civil",
                "rights", "property law", "tax law", "divorce", "business law",
                "intellectual property", "trademark", "patent", "copyright",
                "consumer complaint", "landlord", "tenant", "rental agreement",
                "workplace injury", "hit-and-run", "compensation", "adoption",
                "NGO registration", "loan default", "corporate governance",
                "sexual harassment", "defamation", "insurance dispute",
                "bail", "cybercrime", "dowry harassment", "inheritance",
                "money recovery", "criminal trial", "fraud", "theft", 
                "POSH Act", "marriage registration", "public event permission",
                "contempt of court", "execution of decree", "civil dispute",
                "property dispute", "free legal aid", "POCSO Act", "employment law",
                "corporate law", "commercial law", "business regulations",
                "legal compliance", "company law", "business litigation",
                "mergers and acquisitions", "business contracts", "corporate governance",
                "business structure", "partnership agreement", "limited liability company",
                "business incorporation", "articles of incorporation",
                "business dissolution", "shareholders' rights", "business ethics",
                "business liability", "fiduciary duty", "breach of contract",
                "legal due diligence", "white-collar crime", "directors' liability",
                "legal risk management", "contract law", "business agreements",
                "non-disclosure agreement", "memorandum of understanding",
                "service agreement", "breach of agreement", "employment contract",
                "franchise agreement", "business lease agreement", "terms and conditions",
                "indemnity agreement", "loan agreement", "confidentiality clause",
                "force majeure clause", "non-compete agreement", "vendor agreement",
                "arbitration clause", "licensing agreement", "severability clause",
                "performance bond", "warranties and representations", "implied contract",
                "express contract", "contract enforcement", "intellectual property law",
                "patent law", "trademark law", "copyright law", "trade secret law",
                "IP infringement", "intellectual property rights", "patent infringement",
                "trademark registration", "copyright infringement", "licensing and royalties",
                "fair use policy", "IP litigation", "trademark opposition",
                "geographical indications", "IP valuation", "design patents",
                "software licensing", "digital rights management", "technology transfer agreement",
                "cease and desist letter", "passing off action", "domain name dispute",
                "patent troll", "open-source licensing", "employment law", "labor laws",
                "workplace discrimination", "equal employment opportunity",
                "employee rights", "wage and hour laws", "minimum wage law",
                "workplace safety", "occupational safety and health act",
                "wrongful termination", "workers' compensation", "employee benefits",
                "collective bargaining", "union laws", "family and medical leave act",
                "workplace harassment", "sexual harassment policy", "employee misclassification",
                "unemployment benefits", "non-exempt vs. exempt employees",
                "employee background checks", "employment litigation", "severance pay",
                "independent contractor laws", "retaliation in workplace",
                "tax law", "corporate taxation", "business tax compliance",
                "value-added tax", "goods and services tax", "income tax laws",
                "tax evasion", "double taxation", "transfer pricing", "tax fraud",
                "capital gains tax", "sales tax", "payroll tax", "property tax",
                "excise tax", "IRS compliance", "offshore tax havens", "tax deduction laws",
                "business tax audit", "tax withholding", "deferred tax liability",
                "tax avoidance", "tax treaty", "estate tax", "tax amnesty",
                "consumer protection law", "consumer rights", "unfair trade practices",
                "false advertising", "product liability", "consumer fraud",
                "class action lawsuits", "data protection laws", "online consumer protection",
                "e-commerce laws", "return policy regulations", "truth in advertising",
                "anti-counterfeiting laws", "food and drug laws", "consumer dispute resolution",
                "consumer financial protection bureau", "false claims act",
                "consumer guarantees", "data privacy regulation", "auto lemon laws",
                "online fraud protection", "consumer contracts", "consumer recall laws",
                "safety compliance", "misrepresentation in business", "antitrust law",
                "monopoly law", "market dominance", "unfair competition", "price fixing",
                "cartel formation", "predatory pricing", "horizontal agreements",
                "vertical restraint", "competition commission", "anti-competitive behavior",
                "trade regulation laws", "tying arrangements", "mergers control",
                "bid rigging", "abuse of market power", "exclusive dealing",
                "antitrust compliance", "business monopolies", "restrictive trade practices",
                "business dispute resolution", "arbitration", "mediation",
                "civil litigation", "business lawsuit", "commercial litigation",
                "court injunction", "class action lawsuit", "alternative dispute resolution",
                "commercial arbitration", "business tort", "legal damages",
                "commercial fraud", "litigation funding", "breach of fiduciary duty",
                "defamation lawsuit", "legal settlement", "small claims court",
                "business liability lawsuit", "insurance disputes", "banking law",
                "financial regulation", "investment law", "securities law",
                "bankruptcy law", "debt restructuring", "money laundering laws",
                "capital markets law", "financial fraud", "foreign exchange management act",
                "cybersecurity law", "data protection law", "real estate law",
                "property dispute law", "zoning laws", "landlord tenant law",
                "housing regulations", "estate planning law", "trust law",
                "will execution", "non-profit laws", "charity regulations",
                "white-collar crime", "business fraud laws", "corporate espionage",
                "government contract laws", "foreign investment law", "import export law",
                "international trade law", "tax fraud prevention", "digital business laws",
                "environmental regulations", "telecommunications law", "media law",
                "advertising law", "entertainment law", "defamation law",
                "sports law", "gambling law", "pharmaceutical law",
                "biotechnology law", "maritime law", "aviation law",
                "transportation law", "shipping regulations", "agribusiness law",
                "forestry law", "mining law", "energy law", "nuclear law",
                "space law", "biometric data law", "cloud computing law",
                "blockchain regulation", "cryptocurrency laws", "artificial intelligence law",
                "fintech regulations", "internet governance", "evidence law",
                "legal malpractice", "judicial review", "legal remedies",
                "precedent law", "procedural law", "substantive law",
                "constitutional rights", "international human rights",
                "military law", "war crimes law", "genocide law",
                "extradition laws", "treaty law", "customs law" 
            ];
    
            // Define greeting keywords
            const greetingKeywords = ["hi", "hello", "hii", "hey","hlo", "good morning", "good evening", "good afternoon"];
    
            // Convert user message to lowercase for comparison
            const lowerCaseMessage = userMessage.toLowerCase();
    
            // Check if the message contains any greeting
            const isGreeting = greetingKeywords.some(greet => lowerCaseMessage.includes(greet));
    
            if (isGreeting) {
                removeTypingIndicator();
                appendMessage("👋 Hello! How can I assist you with legal matters today?", "bot", true);
                return;
            }
    
            // Check if the message contains any legal keywords
            const isLegalQuery = legalKeywords.some(keyword => lowerCaseMessage.includes(keyword));
    
            if (!isLegalQuery) {
                removeTypingIndicator();
                appendMessage("⚠️ Sorry, I can only assist with legal matters. Please ask a question related to law, contracts, or legal advice.", "bot", true);
                return;
            }
    
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: userMessage }] }]
                })
            });
    
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            removeTypingIndicator();
    
            let botReply = "⚠️ Sorry, I couldn't understand that.";
            if (data && data.candidates && data.candidates.length > 0) {
                const firstCandidate = data.candidates[0];
                if (firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0) {
                    botReply = firstCandidate.content.parts[0].text;
                }
            }
    
            appendMessage(botReply, "bot", true);
        } catch (error) {
            removeTypingIndicator();
            appendMessage("⚠️ Error fetching response. Please try again later.", "bot", true);
            console.error("API Error:", error);
        }
    }
    
    
    

    // newChatButton.addEventListener("click", function () {
    //     chatHistory.push({ title: "New Chat", messages: [] }); // Temporary title
    //     currentChatIndex = chatHistory.length - 1;
    //     localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    //     chatContainer.innerHTML = "";
    //     updateRecentChats();
    // });

    
    function showAlert() {
        alert("🚧 This feature will be available in upcoming days. Stay tuned! 🚀");
    }

    
    newChatButton.addEventListener("click", function () {
        chatHistory.push({ 
            title: "New Chat", 
            messages: [{ sender: "bot", text: "👋 Hello! I'm your AI legal consultation assistant. How may I assist you today with your legal matters?" }] 
        }); // Temporary title with initial bot message
        currentChatIndex = chatHistory.length - 1;
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        chatContainer.innerHTML = "";
        updateRecentChats();
        appendMessage("👋 Hello! I'm your AI legal consultation assistant. How may I assist you today with your legal matters?", "bot", false);
    });
    

    if (downloadButton) {
        downloadButton.addEventListener("click", function () {
            let chatText = chatHistory[currentChatIndex]?.messages.map(({ sender, text }) => `${sender === "user" ? "User" : "AI"}: ${text}`).join("\n\n") || "";
            if (!chatText) return alert("No chat messages to download.");

            const blob = new Blob([chatText], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "chat_history.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    updateRecentChats();
    if (chatHistory.length > 0) loadChat(0);
});
