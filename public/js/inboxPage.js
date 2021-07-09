$(document).ready(function () {
    $.get("/api/chats", (data, status, xhr) => {
        if(xhr.status == 400) {
            alert("Could not send a GET request to the server");
        }
        else {
            outputChatList(data, $(".resultsContainer"));
        }
    })
    $(".fa-envelope").css('color', 'var(--blue)');
});

