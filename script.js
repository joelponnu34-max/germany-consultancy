// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        
        // Here you would typically send the data to a server
        // For now, we'll just show an alert
        alert('Thank you for your interest! We will contact you soon.');
        
        // Reset the form
        this.reset();
    });
}

// Add active class to navigation on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.service-card, .program-card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});


// AI Chatbot Functionality
const HUGGINGFACE_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HUGGINGFACE_API_KEY = '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'; // Replace with your actual Hugging Face API key
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');
const chatbotMessages = document.getElementById('chatbot-messages');

let conversationHistory = [];

// System prompt for the AI assistant
const systemPrompt = `You are a helpful AI assistant for Dcaleed Global Grad, a study abroad consultancy specializing in helping Indian students study in Germany. 

You can help with:
- Information about Ausbildung (vocational training) programs in Germany
- Information about Masters programs in Germany
- Visa requirements and application processes
- Living costs and accommodation in Germany
- German language requirements (TestDaF, Goethe exams)
- Career prospects after studying in Germany
- Application timelines and deadlines

Provide accurate, helpful, and friendly responses. Keep answers concise but informative.`;

// Toggle chatbot window
chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('hidden');
    if (!chatbotWindow.classList.contains('hidden')) {
        chatbotInput.focus();
    }
});

// Close chatbot window
chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.add('hidden');
});

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageP = document.createElement('p');
    messageP.textContent = content;
    messageDiv.appendChild(messageP);
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send message to Hugging Face API
async function sendMessage(userMessage) {
    try {
        // Build messages array for the API
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        const response = await fetch(HUGGINGFACE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen2.5-72B-Instruct',                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data.choices[0].message.content;

        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: botResponse }
        );

        // Keep only last 10 messages to avoid context overflow
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        return botResponse;
    } catch (error) {
        console.error('Error calling Hugging Face API:', error);
        return 'I apologize, but I\'m having trouble connecting right now. Please try again later or contact us directly at info@dcaleedglobalgrad.com.';
    }
}

// Handle send button click
async function handleSendMessage() {
    const userMessage = chatbotInput.value.trim();
    
    if (!userMessage) return;
    
    // Add user message to chat
    addMessage(userMessage, true);
    chatbotInput.value = '';
    
    // Disable input while processing
    chatbotInput.disabled = true;
    chatbotSend.disabled = true;
    
    // Show typing indicator
    showTypingIndicator();
    
    // Get AI response
    const botResponse = await sendMessage(userMessage);
    
    // Remove typing indicator and add bot response
    removeTypingIndicator();
    addMessage(botResponse, false);
    
    // Re-enable input
    chatbotInput.disabled = false;
    chatbotSend.disabled = false;
    chatbotInput.focus();
}

// Send message on button click
chatbotSend.addEventListener('click', handleSendMessage);

// Send message on Enter key
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});


// Hero AI Button functionality
const heroAIButton = document.getElementById('hero-ai-button');
if (heroAIButton) {
    heroAIButton.addEventListener('click', () => {
        // Open the chatbot window
        chatbotWindow.classList.remove('hidden');
        chatbotInput.focus();
    });
}
