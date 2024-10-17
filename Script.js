const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion-list .suggestions");

let userMessage = null;

let isResponseGenerating = false;

//API configuration
const API_KEY = "AIzaSyD2fm6keDb2DtkCD02TqgVp1s6eDMYVi1c";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;



const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
    //Apply a stored theme
    document.body.classList.toggle("light_mode" , isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
    //Restore saved chats
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header" , savedChats);//hide the header once the chat started
    chatList.scrollTo(0,chatList.scrollHeight); //scroll to the bottom
}

loadLocalstorageData(); 

// Create a new mesage element and return it
const createMessageElement = (content,...classes) => {
    const div = document.createElement("div");
    div.classList.add("message" , ...classes);
    div.innerHTML = content;
    return div;
}
//show typing effect by displaying words one by one
const showTypingEffect = (text , textElement,incomingMesssageDiv) =>{
    const words = text.split(' ');
    let currentWordIndex = 0;
    const typingInterval = setInterval(() => {
        //append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ' )+ words[currentWordIndex++];
        incomingMesssageDiv.querySelector(".material-symbols-rounded").classList.add("hide");
        //if all words are displayed
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMesssageDiv.querySelector(".material-symbols-rounded").classList.remove("hide");
            localStorage.setItem("savedChats" ,chatList.innerHTML); //save chats to local storage
            chatList.scrollTo(0,chatList.scrollHeight); //scroll to the bottom
        }
    },75);
}

// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMesssageDiv) => {
    const textElement = incomingMesssageDiv.querySelector(".text"); //Get text element
    //Send a POST request to the API with the user's message
    try {
        const response = await fetch(API_URL,{
            method: "POST",
            headers:{"Content-Type": "application/json"},
            body: JSON.stringify({
                contents:[{
                    role: "user",
                    parts:[{text: userMessage}]
                }]
            })
        });
        const  data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        //Get the API response text
        const apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No valid response";

        showTypingEffect(apiResponse,textElement,incomingMesssageDiv);
    }catch(error){
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
       
    }finally {
        incomingMesssageDiv.classList.remove("loading");
    }
}

//show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `   <div class="message-content">
               <img src="gemini.png" alt="gemini image" class="avatar"> 
               <p class="text"></p>
                 <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
               </div>
               </div>
               <span  onclick="copyMessage(this)" class="material-symbols-rounded">content_copy</span>
            `;
    const incomingMesssageDiv = createMessageElement(html, "incoming" , "loading"); 
    chatList.appendChild(incomingMesssageDiv);
    chatList.scrollTo(0,chatList.scrollHeight); //scroll to the bottom
    generateAPIResponse(incomingMesssageDiv);
}

//copy message text to the clipboard
const copyMessage = (copyIcon) =>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; //Show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy" , 1000);//Revert icon after 1 second
}

//handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return;//Exit if there id=s no message

    isResponseGenerating = true;

    const html = ` <div class="message-content">
               <img src="image.png" alt="User image" class="avatar"> 
               <p class="text"></p></div>`;
    const outgoingMesssageDiv = createMessageElement(html, "outgoing");
    outgoingMesssageDiv.querySelector(".text").innerText = userMessage;  
    chatList.appendChild(outgoingMesssageDiv); 
    typingForm.reset(); //clear input feild
    chatList.scrollTo(0,chatList.scrollHeight); //scroll to the bottom
    document.body.classList.add("hide-header");//hide the header once the chat started
    setTimeout(showLoadingAnimation, 500); // show loading animation after delay
}

//Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click" , () =>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// toggle between light and dark theme
toggleThemeButton.addEventListener("click", () =>{
   const isLightMode =  document.body.classList.toggle("light_mode");
   localStorage.setItem("themecolor" ,isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click" , () =>{
   if(confirm("Are you sure you want to delete all messages?")){
    localStorage.removeItem("savedChats");
    loadLocalstorageData();
   } 
});

//Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit" , (e) =>{
    e.preventDefault();

    handleOutgoingChat();
});