var typing = false;
var lastTypingTime;
var users;
var inChatPage = true;
var uploadedImageLink = "";
var idToDelete = "";

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/~/g, '&tilde;');
}

$(document).ready(function () {

    socket.emit("join room", chatId);
    socket.on("typing", () => $(".typingDots").show());
    socket.on("stop typing", () => $(".typingDots").hide());
    socket.on("message deleted", (toDeleteId) => {
        $("li[data-id=" + toDeleteId + "]").remove();
    });

    $.get(`/api/chats/${chatId}`, (data) => {
        $("#chatName").text(getChatName(data));
        users = data.users;
    })
    
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
    $(".fa-envelope").css('color', 'var(--blue)');

});

$(document).on("click", (e) => {
    var target = $(e.target)
    if(target.hasClass("leaveChat")){
        if(confirm("Are you sure you want to leave this chat room?")) {
            $.ajax({
                url: `/api/chats/${chatId}/leaveChat`,
                type: "PUT", 
                success: () => location.reload(),
                error: () => confirm("Could not update. Please try again")
            })
        }
        return false
    }
})

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

$(".sendVideoCallRequestButton").click(() => {
    videoCallRequestSent();
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

function videoCallRequestSent() {

    var href = createJitsiMeetLinkUrl(users);
    var iTag = '<i class="fal fa-video-plus"></i>';
    var content = mix(iTag, href);
    sendMessage(content);
    socket.emit("stop typing", chatId);
    typing = false;
    window.open(href, '_blank');

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


    var requiredContent = replaceURLs(message.content);

    if((message.content).substring(0,33) == '<i class="fal fa-video-plus"></i>') {
        var link = (message.content).substring(34, (message.content).length);
        requiredContent = createJitsiMeetPostHtml(link);
    }
    if(isOfficialLink(message.content) != false) {
        requiredContent = isOfficialLink(message.content);
    }

    return `<li data-id=${message._id} class='message ${liClassName}'>
                ${imageContainer}
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${requiredContent}
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

function setClipboard(value) {
    var tempInput = document.createElement("input");
    tempInput.style = "position: absolute; left: -1000px; top: -1000px";
    tempInput.value = value;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
}

function createJitsiMeetLinkUrl(users) {
    var linkUrl = "";
    users.forEach(user => {
        linkUrl+= (user.firstName).substring(0, 4);
    });
    if(linkUrl.length > 15) {
        return getJitsiMeetLink(linkUrl.substring(0, 15));
    }
    return getJitsiMeetLink(linkUrl+=makeid((users.length)*2));
}

function getJitsiMeetLink(linkUrl) {
    return "https://meet.jit.si/" + linkUrl;
}

function createJitsiMeetPostHtml(link) {

    return `<div style='border: 3px solid transparent; display: flex; flex-direction: column; align-items:center'>
                <p style='font-size: 1rem;font-weight: 500;'>You're invited to a Jitsi Meet!</p>
                <a target='_blank' style='text-decoration: underline' href="${link}">${link.substring(8, link.length)} <i class="far fa-external-link-square-alt urlLink"></i></a>
                <button style="outline: none;max-width: 7rem;color: #000;border-radius: 1rem;margin: 1rem;padding: 0.5rem;box-shadow: 0 6px 6px rgba(10,16,20,.15), 0 0 52px rgba(10,16,20,.12);border: 1px solid transparent;" onclick="setClipboard('${link}')">
                    <i class="fal fa-copy"></i> Copy Link
                </button>
            </div>
            <a style="outline: none;" data-placement="right" tabindex="0" role="button" data-toggle="popover" data-trigger="focus" title="Warning:" data-content="You're about to access a page which is not maintained by this platform. This platform will be held responsible under no circumstances. Proceed with caution."><i style='box-shadow: 0 6px 6px rgba(10,16,20,.15), 0 0 52px rgba(10,16,20,.12);margin: 0.5rem' class="far fa-exclamation-triangle"></i></a>`
}

function mix(iTag, link) {
    return iTag + " " + link;
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function isOfficialLink(content) {
    let start = "/uploads/images/";
    let end = ".png";
    if (content.substring(0, 16) == start && content.substring(content.length - 4) == end) {
        return `<div class='sentImageContainer'>
                <img class='sentPngImage' src='${content}' alt='uploaded image'>
                <span></span><span></span>
                <a href='${content}' target='_blank' download='image.png'><button><i class="fal fa-download"></i></button></a>
            </div>`
    }
    return false;
}

function uploadCroppedImage (formData) {

    $.ajax({
        url: "/api/users/uploadImage",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: (data, status, xhr) => {
            if(xhr.status == 206) {
                sendImage(data)
            }
            else {
                alert("Unable to send image. Please try again!")
            }
        }
    })
}

function sendImage(imageURL) {
    
    $.post("/api/messages", { content: imageURL, chatId: chatId }, (data, status, xhr) => {
        if(xhr.status != 201) {
            alert("Could not send your image. Check your internet connection.");
            return;
        }
        addChatMessageHtml(data);
        $("#sendImageModal").modal("hide");

        if(connected) {
            socket.emit("new message", data);
        }
    })
}

$(document).on("click", ".sentPngImage", (event) => {
    var imageURL = $(event.target).attr("src");
    $("#viewSentImageModal").modal("show");
    $("#imageView").attr("src", imageURL);
});

// console.log when the li is double clicked
$(document).on("dblclick", ".message", function(event) {
    idToDelete = $(this).data("id");
    $("#deleteSentMessageModal").modal("show");
    var html = $(this).find('span.messageBody').html();
    $("#deleteSentMessageModal .modal-body").html("");
    $("#deleteSentMessageModal .modal-body").append(html);
})

// on deletebutton click
$(document).on("click", "#confirmDeleteButton", function(event) {
    $.ajax({
        url: "/api/messages/delete/" + idToDelete,
        type: "PUT",
        success: (data, status, xhr) => {
            if(xhr.status == 204) {
                $("li[data-id=" + idToDelete + "]").remove();
                $("#deleteSentMessageModal").modal("hide");
                socket.emit("message deleted", chatId, idToDelete);
            }
        },
        error: (xhr, status, error) => { alert("Could not delete Message! Make sure it is your message!");}
    })
})