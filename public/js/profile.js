$(document).ready(function () {
    if(selectedTab === "replies") { 
        loadReplies(); 
    }
    else { 
        loadPosts();
    }
    var userData = {
        official: $("#officialStatus").html() == "" ? undefined : true,
        email: $("#defaultEmail").html()
    }
    console.log(userData)
    $('span[id^="officialStatus"]').remove();
    $('span[id^="defaultEmail"]').remove();
    var html = currentStatus(userData);
    $("#userStatus").html(html);
});

function loadPosts() {

    $.get("/api/posts", { postedBy: profileUserId, pinned: true }, (results) => {
        outputPinnedPosts(results, $(".pinnedPostContainer"));
    })
    
    $.get("/api/posts", { postedBy: profileUserId, isReply: false }, (results) => {
        outputPosts(results, $(".postsContainer"));
    })
}
function loadReplies() {
    $.get("/api/posts", { postedBy: profileUserId, isReply: true }, (results) => {
        outputPosts(results, $(".postsContainer"));
    })
}

const outputPinnedPosts = (results, container) => {

    if(results.length == 0) {
        container.hide();
        return
    }

	container.html("");

	results.forEach((result) => {
		var html = createPostHtml(result);
		container.append(html);
	});
};

$("#aboutFieldInput").keyup(function (e) {
	var textbox = $(e.target);
	var value = textbox.val().trim();

	var submitButton = $("#changeAboutButton");

	if (submitButton.length == 0) {
		return alert("No submit button found");
	}

	if (value == "") {
		submitButton.prop("disabled", true);
		return;
	}

	submitButton.prop("disabled", false);
});

$("#changeAboutButton").click(() => {
    var text = $("#aboutFieldInput");

    $.ajax({
        url: "/api/users/updateaboutfield",
        type: "PUT",
        data: { aboutField: text.val().trim() },
        success: ((data, status, xhr) => {
            if(xhr.status != 204) {
                alert("Could not update the new chat name");
            }
            else {
                location.reload();
            }
        })
    })
}) 