var typing = false;
var lastTypingTime;

$(document).ready(function () {

    socket.emit("join room", chatId);
    socket.on("typing", () => $(".typingDots").show());
    socket.on("stop typing", () => $(".typingDots").hide());

    $.get(`/api/chats/${chatId}`, (data) => $("#chatName").text(getChatName(data)))
    
    $.get(`/api/chats/${chatId}/messages`, (data) => {
        
        var messages = [];
        var lastSenderId = "";
        data.forEach((message, index) => {
            var html = createMessageHtml(message, data[index + 1], lastSenderId);
            messages.push(html);

            lastSenderId = message.sender._id;
        });
        var messagesHtml = messages.join("");
        addMessagesHtmlToPage(messagesHtml);
        scrollToBottom(false);
        markAllMessagesAsRead();

        $(".loadingSpinnerContainer").remove();
        $(".chatContainer").css("visibility", "visible");

        // Remember to activate the loading spinner for all the pages availableC
    })

});

const activatePopper = () => {
    $(function(){
        // Enables popover
        $("[data-toggle=popover]").popover();
    });
}

$("#chatNameButton").click(function (e) { 
    var name = $("#chatNameTextbox").val().trim();
    
    $.ajax({
        url: "/api/chats/" + chatId,
        type: "PUT",
        data: { chatName: name },
        success: ((data, status, xhr) => {
            if(xhr.status != 204) {
                alert("Could not update the new chat name");
            }
            else {
                location.reload();
            }
        })
    })
    
});

$(".sendMessageButton").click(() => {
    messageSubmitted();
    return false;
})

$(".inputTextbox").keydown((event) => {

    updateTyping();

    if(event.which === 13 && !event.shiftKey) {
        messageSubmitted();
        return false;
    }

})

function updateTyping() {
    if(!connected) return;

    if(!typing) {
        typing = true;
        socket.emit("typing", chatId);
    }

    lastTypingTime = new Date().getTime();
    var timerLength = 3000;

    setTimeout(() => {
        var timeNow = new Date().getTime();
        var timeDiff = timeNow - lastTypingTime;
        if(timeDiff >= timerLength && typing) {
            socket.emit("stop typing", chatId);
            typing = false;
        }
    }, timerLength);
    
}

function messageSubmitted() {
    var content = $(".inputTextbox").val().trim();


    if(content != "") {
        sendMessage(content);
        $(".inputTextbox").val("");
        socket.emit("stop typing", chatId);
        typing = false;
    }
    
}

function sendMessage(content) {
    $.post("/api/messages", { content: content, chatId: chatId }, (data, status, xhr) => {
        if(xhr.status != 201) {
            alert("Could not send your message. Check your internet connection.");
            $(".inputTextbox").val(content);
            return;
        }
        addChatMessageHtml(data);

        if(connected) {
            socket.emit("new message", data);
        }
    })
}

function addChatMessageHtml(message) {
    if(!message || !message._id) {
        alert("Message request is not valid");
        return;
    }

    var messageDiv = createMessageHtml(message, null, "");

    addMessagesHtmlToPage(messageDiv);
    scrollToBottom(true);

}
function addMessagesHtmlToPage(html) {
    $(".chatMessages").append(html);
}

function createMessageHtml(message, nextMessage, lastSenderId) {

    var sender = message.sender;
    var senderName = sender.firstName + sender.lastName;
    var senderName = sender.firstName + " " + sender.lastName;

    var timestamp = timeDifference(new Date(), new Date(message.createdAt));
    var toShowInfo = "";

    var currentSenderId = sender._id;
    var nextSenderId = nextMessage != null ? nextMessage.sender._id : "";

    var isFirst = lastSenderId != currentSenderId;
    var isLast = nextSenderId != currentSenderId;


    var isMine = message.sender._id == userLoggedIn._id;
    var liClassName = isMine ? "mine" : "theirs";

    var nameElement = "";

    if(isFirst) { 
        liClassName+= " first";

        if(!isMine) {
            nameElement = `<span class='senderName'>${senderName}</span>`
        }
    }

    var profileImage = "";

    if(isLast) {
        liClassName+= " last";
        profileImage = `<a style="outline: none;" 
                            data-placement="right" 
                            class="vocabularyAnchor" 
                            tabindex="0" 
                            role="button" 
                            data-toggle="popover" 
                            data-trigger="focus" 
                            title="${senderName}:" 
                            data-content="Received ${timestamp}"
                        ><img src='${sender.profilePic}'></a>`;
        activatePopper();
    }
    var imageContainer = "";
    if(!isMine) {
        imageContainer = `<div class='imageContainer'>
                                ${profileImage}
                            </div>`
    }

    return `<li class='message ${liClassName}'>
                ${imageContainer}
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${replaceURLs(message.content)}
                    </span>
                </div>
            </li>`;
}

function scrollToBottom(animated) {
    var container = $(".chatMessages");
    var scrollHeight = container[0].scrollHeight;

    if(animated) {
        container.animate({ scrollTop: scrollHeight }, "slow");
    }
    else {
        container.scrollTop(scrollHeight);
    }
}

function markAllMessagesAsRead() {
    $.ajax({
        url: `/api/chats/${chatId}/messages/markAsRead`,
        type: "PUT",
        success: () => refreshMessagesBadge()
    })
}